import { describe, expect, it } from "vitest";
import {
  AlmaValidationError,
  LocalSigner,
  PAYMENT_AUTHORIZATION_TYPE,
  createIssuerKeyset,
  paymentAuthorizationDigest,
  signPaymentAuthorization,
  signReceiptMint,
  verifyPaymentAuthorization,
  type PaymentAuthorization,
} from "../src/index.js";
import { toBase64Url, toHex } from "../src/canonical.js";

const authorization: PaymentAuthorization = {
  chainId: 8453,
  module: `0x${"22".repeat(20)}`,
  safe: `0x${"11".repeat(20)}`,
  token: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  to: `0x${"33".repeat(20)}`,
  amount: "25000000",
  nonce: `0x${"ab".repeat(32)}`,
  expiresAt: 1_800_000_000,
};

async function setup() {
  const signer = await LocalSigner.generate();
  const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(signer.publicKey) }]);
  return { signer, keyset };
}

describe("payment authorization digest", () => {
  it("is SHA-256 over the packed layout the module rebuilds (known answer, computed apart)", async () => {
    // Python hashlib over the same bytes; adasouls-contracts checks this value from Solidity too.
    expect(toHex(await paymentAuthorizationDigest(authorization))).toBe("c8058e0d4c6724a791fcb5177e6ddd7d0e34cf39552ad54b77f55396c9f4b875");
  });

  it("changes with every field", async () => {
    const base = toHex(await paymentAuthorizationDigest(authorization));
    const changes: Partial<PaymentAuthorization>[] = [
      { chainId: 84532 },
      { module: `0x${"23".repeat(20)}` },
      { safe: `0x${"12".repeat(20)}` },
      { token: `0x${"44".repeat(20)}` },
      { to: `0x${"34".repeat(20)}` },
      { amount: "25000001" },
      { nonce: `0x${"ac".repeat(32)}` },
      { expiresAt: 1_800_000_001 },
    ];
    for (const change of changes) {
      expect(toHex(await paymentAuthorizationDigest({ ...authorization, ...change })), JSON.stringify(change)).not.toBe(base);
    }
  });

  it("refuses fields the module couldn't read the same way", async () => {
    const bad: [Partial<Record<keyof PaymentAuthorization, unknown>>, string][] = [
      [{ module: `0x${"AB".repeat(20)}` }, "module"],
      [{ to: "0x1234" }, "to"],
      [{ amount: "0" }, "amount"],
      [{ amount: "1.5" }, "amount"],
      [{ amount: (2n ** 256n).toString() }, "amount"],
      [{ nonce: "0x12" }, "nonce"],
      [{ expiresAt: 1.5 }, "expiresAt"],
      [{ chainId: 0 }, "chainId"],
    ];
    for (const [change, field] of bad) {
      const attempt = paymentAuthorizationDigest({ ...authorization, ...change } as PaymentAuthorization);
      await expect(attempt, field).rejects.toThrow(AlmaValidationError);
      await expect(attempt, field).rejects.toThrow(`paymentAuthorization.${field}`);
    }
    await expect(paymentAuthorizationDigest({ ...authorization, extra: 1 } as PaymentAuthorization)).rejects.toThrow(AlmaValidationError);
  });
});

describe("signing and checking a payment authorization", () => {
  it("is signed over the 32-byte digest and checks out against the keyset", async () => {
    const { signer, keyset } = await setup();
    const signed = await signPaymentAuthorization(signer, authorization);
    expect(signed).toMatchObject({ authorization, kid: signer.kid, digest: `0x${toHex(await paymentAuthorizationDigest(authorization))}` });
    expect(signed.sig).toMatch(/^0x[0-9a-f]{128}$/);
    expect(await verifyPaymentAuthorization(signed, keyset, "adasouls")).toEqual({ ok: true, payload: authorization });
  });

  it("fails when any field, the digest or the signature changed, or the key isn't trusted for that issuer", async () => {
    const { signer, keyset } = await setup();
    const signed = await signPaymentAuthorization(signer, authorization);
    const other = await setup();

    expect(await verifyPaymentAuthorization({ ...signed, authorization: { ...authorization, amount: "25000001" } }, keyset)).toEqual({ ok: false, reason: "digest does not match the authorization" });
    const moved = { ...authorization, to: `0x${"34".repeat(20)}` };
    expect(await verifyPaymentAuthorization({ ...signed, authorization: moved, digest: `0x${toHex(await paymentAuthorizationDigest(moved))}` }, keyset)).toEqual({ ok: false, reason: "bad signature" });
    const flipped = `${signed.sig.slice(0, -1)}${signed.sig.endsWith("0") ? "1" : "0"}`;
    expect(await verifyPaymentAuthorization({ ...signed, sig: flipped }, keyset)).toEqual({ ok: false, reason: "bad signature" });
    expect(await verifyPaymentAuthorization(signed, other.keyset)).toEqual({ ok: false, reason: `untrusted key ${signer.kid}` });
    expect(await verifyPaymentAuthorization(signed, keyset, "someone-else")).toMatchObject({ ok: false, reason: expect.stringContaining("does not sign for someone-else") });
    expect(await verifyPaymentAuthorization({ ...signed, extra: 1 }, keyset)).toEqual({ ok: false, reason: "malformed authorization" });
  });

  it("can never be confused with a JSON envelope: it signs 32 bytes, they sign more", async () => {
    const { signer, keyset } = await setup();
    const mint = await signReceiptMint(signer, { iss: "adasouls", receipt: "rcpt_1", digest: "a".repeat(64), independent: true });
    // A mint signature presented as an authorization's: it signed other bytes.
    const sig = `0x${toHex(Uint8Array.from(atob(mint.sig.replace(/-/g, "+").replace(/_/g, "/").padEnd(88, "=")), (c) => c.charCodeAt(0)))}`;
    const signed = await signPaymentAuthorization(signer, authorization);
    expect(await verifyPaymentAuthorization({ ...signed, sig }, keyset)).toEqual({ ok: false, reason: "bad signature" });
    expect(PAYMENT_AUTHORIZATION_TYPE).toBe("alma-payment-authorization/1");
  });
});
