import { createPublicKey, verify as nodeVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AlmaValidationError,
  LocalSigner,
  buildReceiptStatement,
  createIssuerKeyset,
  kidFor,
  receiptDigest,
  signReceiptAttestation,
  signReceiptMint,
  toJwks,
  verifyReceipt,
  verifyReceiptMint,
  type IssuerSigner,
} from "../src/index.js";
import { canonicalJson, fromBase64Url, toBase64Url } from "../src/canonical.js";

const statement = buildReceiptStatement({
  issuer: "adasouls",
  env: "testnet",
  action: "ea_1",
  payer: "alma:main:agent:a",
  payee: "alma:main:agent:b",
  capability: "pay",
  chain: "eip155:84532",
  asset: "eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e",
  amount: "500000000",
  to: "0x1111111111111111111111111111111111111111",
  txHash: "0xabc",
  settledAt: new Date("2026-09-25T00:00:00Z"),
});
const at = new Date("2026-09-28T10:00:00.456Z");

async function setup(signer?: LocalSigner) {
  const s = signer ?? (await LocalSigner.generate());
  const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(s.publicKey) }]);
  const digest = await receiptDigest(statement);
  const mint = await signReceiptMint(s, { iss: "adasouls", receipt: "rcp_1", digest, independent: true, signedAt: at });
  const attest = (kind: "payment" | "delivery", decision: "confirmed" | "declined", receipt = "rcp_1", d = digest) =>
    signReceiptAttestation(s, { iss: "adasouls", receipt, digest: d, kind, decision, decidedBy: "agent", decidedAt: at });
  return { signer: s, keyset, digest, mint, attest };
}

describe("issuer signatures", () => {
  it("signs the exact canonical payload, and the signature is plain RFC 8032 Ed25519 (what KMS ED25519_SHA_512/RAW produces)", async () => {
    const { signer, mint, digest } = await setup();
    const bytes = canonicalJson(mint.payload);
    expect(bytes).toBe(
      `{"digest":"${digest}","independent":"true","iss":"adasouls","kid":"${signer.kid}","receipt":"rcp_1",` +
        `"signedAt":"2026-09-28T10:00:00Z","t":"alma-receipt-mint/1"}`
    );
    const pub = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: toBase64Url(signer.publicKey) }, format: "jwk" });
    expect(nodeVerify(null, Buffer.from(bytes), pub, Buffer.from(fromBase64Url(mint.sig)!))).toBe(true);
    // Deterministic: signing the same payload again gives the same bytes.
    expect((await signReceiptMint(signer, { iss: "adasouls", receipt: "rcp_1", digest, independent: true, signedAt: at })).sig).toBe(mint.sig);
  });

  it("kid is derived from the public key and survives a PKCS#8 round trip", async () => {
    const a = await LocalSigner.generate();
    const b = await LocalSigner.fromPkcs8(await a.exportPkcs8());
    expect(b.kid).toBe(a.kid);
    expect(a.kid).toBe(await kidFor(a.publicKey));
    expect(a.kid).toMatch(/^ed25519-[0-9a-f]{32}$/);
    const { mint } = await setup(b);
    const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(a.publicKey) }]);
    expect((await verifyReceiptMint(mint, keyset)).ok).toBe(true);
  });

  it("verifyReceipt returns only signed facts", async () => {
    const { keyset, mint, attest, digest } = await setup();
    const r = await verifyReceipt({ id: "rcp_1", statement, mint, payment: await attest("payment", "confirmed"), delivery: null }, keyset);
    expect(r).toEqual({
      ok: true,
      payload: { id: "rcp_1", statement, digest, independent: true, payment: "confirmed", delivery: null },
    });
  });

  it("stored key order and JSON round trips don't matter", async () => {
    const { keyset, mint } = await setup();
    const reordered = JSON.parse(JSON.stringify({ sig: mint.sig, alg: mint.alg, payload: Object.fromEntries(Object.entries(mint.payload).reverse()) }));
    expect((await verifyReceipt({ id: "rcp_1", statement: JSON.parse(JSON.stringify(statement)), mint: reordered }, keyset)).ok).toBe(true);
  });

  describe("tampering is rejected", () => {
    const reason = async (p: Promise<{ ok: boolean; reason?: string }>) => {
      const r = await p;
      expect(r.ok).toBe(false);
      return r.reason;
    };

    it("editing the statement (e.g. redirecting credit to another payee)", async () => {
      const { keyset, mint } = await setup();
      expect(await reason(verifyReceipt({ id: "rcp_1", statement: { ...statement, payee: "alma:main:agent:x" }, mint }, keyset))).toMatch(/signed digest/);
    });

    it("flipping independent inside the signed payload", async () => {
      const { keyset, mint } = await setup();
      const forged = { ...mint, payload: { ...mint.payload, independent: "false" } };
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint: forged }, keyset))).toMatch(/bad signature/);
    });

    it("turning a decline into a confirmation", async () => {
      const { keyset, mint, attest } = await setup();
      const d = await attest("delivery", "declined");
      const forged = { ...d, payload: { ...d.payload, decision: "confirmed" } };
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint, delivery: forged }, keyset))).toMatch(/delivery: bad signature/);
    });

    it("moving an attestation to the other slot", async () => {
      const { keyset, mint, attest } = await setup();
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint, delivery: await attest("payment", "confirmed") }, keyset))).toMatch(/signed as payment/);
    });

    it("reusing a mint or attestation from another receipt", async () => {
      const { keyset, mint, attest, digest } = await setup();
      expect(await reason(verifyReceipt({ id: "rcp_2", statement, mint }, keyset))).toMatch(/another receipt/);
      const other = await attest("payment", "confirmed", "rcp_2", "0".repeat(64));
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint, payment: other }, keyset))).toMatch(/another receipt/);
      expect(digest).not.toBe("0".repeat(64));
    });

    it("a key that isn't in the verifier's keyset (e.g. a dev key in prod)", async () => {
      const { mint } = await setup();
      const prod = await LocalSigner.generate();
      const prodKeyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(prod.publicKey) }]);
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint }, prodKeyset))).toMatch(/untrusted key/);
    });

    it("an attacker re-signing with their own key under a trusted kid", async () => {
      const { keyset, mint, digest } = await setup();
      const attacker = await LocalSigner.generate();
      const impostor: IssuerSigner = { kid: mint.payload.kid, sign: (m) => attacker.sign(m) };
      const forged = await signReceiptMint(impostor, { iss: "adasouls", receipt: "rcp_1", digest, independent: true });
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint: forged }, keyset))).toMatch(/bad signature/);
    });

    it("a trusted key signing for a different issuer", async () => {
      const { signer, digest } = await setup();
      const keyset = await createIssuerKeyset([{ iss: "someone-else", publicKey: toBase64Url(signer.publicKey) }]);
      const mint = await signReceiptMint(signer, { iss: "adasouls", receipt: "rcp_1", digest, independent: true });
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint }, keyset))).toMatch(/does not sign for adasouls/);
    });

    it("missing or malformed signatures and payloads", async () => {
      const { keyset, mint } = await setup();
      expect(await reason(verifyReceipt({ id: "rcp_1", statement, mint: null }, keyset))).toMatch(/malformed envelope/);
      expect(await reason(verifyReceiptMint({ ...mint, extra: 1 }, keyset))).toMatch(/malformed envelope/);
      expect(await reason(verifyReceiptMint({ ...mint, payload: { ...mint.payload, extra: "x" } }, keyset))).toMatch(/malformed payload/);
      expect(await reason(verifyReceiptMint({ ...mint, sig: mint.sig + "=" }, keyset))).toMatch(/malformed signature/);
      expect(await reason(verifyReceiptMint({ ...mint, sig: mint.sig.slice(0, 40) }, keyset))).toMatch(/malformed signature/);
      expect(await reason(verifyReceiptMint({ ...mint, alg: "ES256" }, keyset))).toMatch(/malformed envelope/);
    });
  });

  it("keysets compute kids themselves and reject bad keys", async () => {
    const s = await LocalSigner.generate();
    const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(s.publicKey) }]);
    expect([...keyset.keys()]).toEqual([s.kid]);
    expect(toJwks(keyset).keys[0]).toMatchObject({ kty: "OKP", crv: "Ed25519", kid: s.kid, x: toBase64Url(s.publicKey) });
    await expect(createIssuerKeyset([{ iss: "adasouls", publicKey: "AAAA" }])).rejects.toThrow(/32-byte/);
    await expect(
      createIssuerKeyset([
        { iss: "adasouls", publicKey: toBase64Url(s.publicKey) },
        { iss: "adasouls", publicKey: toBase64Url(s.publicKey) },
      ])
    ).rejects.toThrow(/duplicate/);
  });

  it("refuses to sign malformed input", async () => {
    const s = await LocalSigner.generate();
    await expect(signReceiptMint(s, { iss: "adasouls", receipt: "rcp_1", digest: "not-a-digest", independent: true })).rejects.toThrow(AlmaValidationError);
  });

  it("base64url decoding is strict", () => {
    expect(fromBase64Url("AQID")).toEqual(new Uint8Array([1, 2, 3]));
    expect(fromBase64Url("AQI")).toEqual(new Uint8Array([1, 2]));
    expect(fromBase64Url("AQI=")).toBeUndefined();
    expect(fromBase64Url("A+/=")).toBeUndefined();
    expect(fromBase64Url("AQJ")).toBeUndefined(); // non-canonical trailing bits
  });
});
