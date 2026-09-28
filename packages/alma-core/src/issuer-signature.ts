import { z } from "zod";
import { canonicalJson, fromBase64Url, toBase64Url, toHex } from "./canonical.js";
import { unwrap } from "./errors.js";
import { receiptDigest, receiptStatementSchema, type ReceiptStatement } from "./receipt.js";

/**
 * The issuer's signature over what it asserts about a receipt (ADR-020):
 * - mint: "this statement is a receipt I issued, with this independence
 *   flag" (the flag is not part of the statement);
 * - attestation: "this party answered this, at this time".
 *
 * Payloads follow the receipt rules (flat, printable ASCII, JCS), so any
 * implementation reproduces the signed bytes. `t` separates the two kinds;
 * `iss` and `kid` inside the payload stop a signature from being
 * re-labelled under another issuer or key; `receipt` + `digest` bind it to
 * one statement. Ed25519 (pure, RFC 8032) over the canonical bytes: AWS KMS
 * `ED25519_SHA_512` with `MessageType: RAW` produces the same signatures.
 *
 * Verification needs a keyset the verifier got from somewhere it trusts
 * (deploy config, a pinned fingerprint) -- never from the same place the
 * signed data came from.
 */

export const ISSUER_SIGNATURE_ALG = "Ed25519";
export const RECEIPT_MINT_TYPE = "alma-receipt-mint/1";
export const RECEIPT_ATTESTATION_TYPE = "alma-receipt-attestation/1";

const ascii = z.string().min(1).regex(/^[\x20-\x7e]*$/, "must be printable ASCII");
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "must be an ISO-8601 UTC timestamp with second precision");
const digest = z.string().regex(/^[0-9a-f]{64}$/, "must be a lowercase hex SHA-256 digest");
const kid = z.string().regex(/^ed25519-[0-9a-f]{32}$/, "must be an ed25519 key id");

export const receiptMintPayloadSchema = z
  .object({
    t: z.literal(RECEIPT_MINT_TYPE),
    iss: ascii,
    kid,
    receipt: ascii,
    digest,
    independent: z.enum(["true", "false"]),
    signedAt: timestamp,
  })
  .strict();
export type ReceiptMintPayload = z.infer<typeof receiptMintPayloadSchema>;

export const RECEIPT_ATTESTATION_KINDS = ["payment", "delivery"] as const;
export type ReceiptAttestationKind = (typeof RECEIPT_ATTESTATION_KINDS)[number];
export type ReceiptDecision = "confirmed" | "declined";

export const receiptAttestationPayloadSchema = z
  .object({
    t: z.literal(RECEIPT_ATTESTATION_TYPE),
    iss: ascii,
    kid,
    receipt: ascii,
    digest,
    kind: z.enum(RECEIPT_ATTESTATION_KINDS),
    decision: z.enum(["confirmed", "declined"]),
    decidedBy: z.enum(["member", "agent"]),
    decidedAt: timestamp,
  })
  .strict();
export type ReceiptAttestationPayload = z.infer<typeof receiptAttestationPayloadSchema>;

export type IssuerPayload = ReceiptMintPayload | ReceiptAttestationPayload;

export interface IssuerEnvelope<P extends IssuerPayload = IssuerPayload> {
  payload: P;
  alg: typeof ISSUER_SIGNATURE_ALG;
  /** base64url, 64 bytes. */
  sig: string;
}

/** Anything that can produce a pure Ed25519 signature: a local key, AWS KMS, an HSM. */
export interface IssuerSigner {
  readonly kid: string;
  sign(message: Uint8Array): Promise<Uint8Array>;
}

const subtle = () => globalThis.crypto.subtle;
const ED25519 = { name: "Ed25519" } as const;
/** Web Crypto wants ArrayBuffer-backed views; callers may hold any Uint8Array. */
const bytes = (b: Uint8Array): Uint8Array<ArrayBuffer> => new Uint8Array(b);
const toSeconds = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

/** "ed25519-" + the first 16 bytes of SHA-256(raw public key), hex. Derived from the key, so a keyset can check it. */
export async function kidFor(rawPublicKey: Uint8Array): Promise<string> {
  if (rawPublicKey.length !== 32) throw new Error("an Ed25519 public key is 32 bytes");
  const hash = new Uint8Array(await subtle().digest("SHA-256", bytes(rawPublicKey)));
  return `ed25519-${toHex(hash.subarray(0, 16))}`;
}

/** Web Crypto signer for local development and tests. Production signs in KMS. */
export class LocalSigner implements IssuerSigner {
  private constructor(
    readonly kid: string,
    readonly publicKey: Uint8Array,
    private readonly privateKey: CryptoKey
  ) {}

  static async generate(): Promise<LocalSigner> {
    const pair = (await subtle().generateKey(ED25519, true, ["sign", "verify"])) as CryptoKeyPair;
    return LocalSigner.from(pair.privateKey, pair.publicKey);
  }

  /** From a PKCS#8 private key (DER bytes), e.g. one written by `exportPkcs8()`. */
  static async fromPkcs8(pkcs8: Uint8Array): Promise<LocalSigner> {
    const privateKey = await subtle().importKey("pkcs8", bytes(pkcs8), ED25519, true, ["sign"]);
    // Web Crypto has no private->public for Ed25519; the JWK export carries both.
    const { d: _d, key_ops: _ops, ...pub } = await subtle().exportKey("jwk", privateKey);
    const publicKey = await subtle().importKey("jwk", pub, ED25519, true, ["verify"]);
    return LocalSigner.from(privateKey, publicKey);
  }

  private static async from(privateKey: CryptoKey, publicKey: CryptoKey): Promise<LocalSigner> {
    const raw = new Uint8Array(await subtle().exportKey("raw", publicKey));
    return new LocalSigner(await kidFor(raw), raw, privateKey);
  }

  async exportPkcs8(): Promise<Uint8Array> {
    return new Uint8Array(await subtle().exportKey("pkcs8", this.privateKey));
  }

  async sign(message: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(await subtle().sign(ED25519, this.privateKey, bytes(message)));
  }
}

async function signPayload<P extends IssuerPayload>(signer: IssuerSigner, payload: P): Promise<IssuerEnvelope<P>> {
  const sig = await signer.sign(new TextEncoder().encode(canonicalJson(payload)));
  if (sig.length !== 64) throw new Error(`signer ${signer.kid} returned a ${sig.length}-byte signature, expected 64`);
  return { payload, alg: ISSUER_SIGNATURE_ALG, sig: toBase64Url(sig) };
}

export interface SignReceiptMintInput {
  iss: string;
  receipt: string;
  digest: string;
  independent: boolean;
  signedAt?: Date;
}

export async function signReceiptMint(signer: IssuerSigner, input: SignReceiptMintInput): Promise<IssuerEnvelope<ReceiptMintPayload>> {
  const payload = unwrap(
    receiptMintPayloadSchema.safeParse({
      t: RECEIPT_MINT_TYPE,
      iss: input.iss,
      kid: signer.kid,
      receipt: input.receipt,
      digest: input.digest,
      independent: String(input.independent),
      signedAt: toSeconds(input.signedAt ?? new Date()),
    }),
    "receiptMint"
  );
  return signPayload(signer, payload);
}

export interface SignReceiptAttestationInput {
  iss: string;
  receipt: string;
  digest: string;
  kind: ReceiptAttestationKind;
  decision: ReceiptDecision;
  decidedBy: "member" | "agent";
  decidedAt: Date;
}

export async function signReceiptAttestation(
  signer: IssuerSigner,
  input: SignReceiptAttestationInput
): Promise<IssuerEnvelope<ReceiptAttestationPayload>> {
  const payload = unwrap(
    receiptAttestationPayloadSchema.safeParse({ t: RECEIPT_ATTESTATION_TYPE, ...input, kid: signer.kid, decidedAt: toSeconds(input.decidedAt) }),
    "receiptAttestation"
  );
  return signPayload(signer, payload);
}

/** A trusted issuer key: which issuer it signs for and its raw Ed25519 public key (base64url). */
export interface IssuerKeyConfig {
  iss: string;
  publicKey: string;
}

export interface IssuerKey {
  iss: string;
  kid: string;
  publicKey: Uint8Array;
  cryptoKey: CryptoKey;
}

export type IssuerKeyset = ReadonlyMap<string, IssuerKey>;

/** Kids are computed here from the keys, never taken from the config. */
export async function createIssuerKeyset(keys: IssuerKeyConfig[]): Promise<IssuerKeyset> {
  const set = new Map<string, IssuerKey>();
  for (const [i, k] of keys.entries()) {
    const iss = unwrap(ascii.safeParse(k.iss), `issuerKeys.${i}.iss`);
    const publicKey = fromBase64Url(k.publicKey);
    if (!publicKey || publicKey.length !== 32) throw new Error(`issuerKeys.${i}.publicKey: must be a base64url 32-byte Ed25519 public key`);
    const kid = await kidFor(publicKey);
    if (set.has(kid)) throw new Error(`issuerKeys.${i}: duplicate key ${kid}`);
    set.set(kid, { iss, kid, publicKey, cryptoKey: await subtle().importKey("raw", bytes(publicKey), ED25519, false, ["verify"]) });
  }
  return set;
}

/** For `/.well-known/alma-issuer-keys`. Publishing is a convenience: verifiers pin keys from a separate source. */
export function toJwks(keyset: IssuerKeyset) {
  return {
    keys: [...keyset.values()].map((k) => ({ kty: "OKP", crv: "Ed25519", alg: "EdDSA", use: "sig", kid: k.kid, iss: k.iss, x: toBase64Url(k.publicKey) })),
  };
}

export type VerifyResult<P> = { ok: true; payload: P } | { ok: false; reason: string };

async function verifyEnvelope<P extends IssuerPayload>(envelope: unknown, schema: z.ZodType<P>, keyset: IssuerKeyset): Promise<VerifyResult<P>> {
  const shape = z.object({ payload: z.unknown(), alg: z.literal(ISSUER_SIGNATURE_ALG), sig: z.string() }).strict().safeParse(envelope);
  if (!shape.success) return { ok: false, reason: "malformed envelope" };
  const parsed = schema.safeParse(shape.data.payload);
  if (!parsed.success) return { ok: false, reason: "malformed payload" };
  const key = keyset.get(parsed.data.kid);
  if (!key) return { ok: false, reason: `untrusted key ${parsed.data.kid}` };
  if (key.iss !== parsed.data.iss) return { ok: false, reason: `key ${key.kid} does not sign for ${parsed.data.iss}` };
  const sig = fromBase64Url(shape.data.sig);
  if (!sig || sig.length !== 64) return { ok: false, reason: "malformed signature" };
  // Re-canonicalized from the parsed payload: stored key order or whitespace never matter.
  const valid = await subtle().verify(ED25519, key.cryptoKey, bytes(sig), new TextEncoder().encode(canonicalJson(parsed.data)));
  return valid ? { ok: true, payload: parsed.data } : { ok: false, reason: "bad signature" };
}

export const verifyReceiptMint = (envelope: unknown, keyset: IssuerKeyset) => verifyEnvelope(envelope, receiptMintPayloadSchema, keyset);
export const verifyReceiptAttestation = (envelope: unknown, keyset: IssuerKeyset) => verifyEnvelope(envelope, receiptAttestationPayloadSchema, keyset);

export interface SignedReceipt {
  id: string;
  statement: unknown;
  mint: unknown;
  payment?: unknown;
  delivery?: unknown;
}

/** The facts about a receipt that the issuer's signatures vouch for -- the only ones a verifier should use. */
export interface VerifiedReceipt {
  id: string;
  statement: ReceiptStatement;
  digest: string;
  independent: boolean;
  payment: ReceiptDecision | null;
  delivery: ReceiptDecision | null;
}

/**
 * Checks a receipt end to end: the statement hashes to the signed digest,
 * the mint is signed by a trusted key of the statement's issuer, and every
 * present attestation is signed, for this receipt and statement, in its
 * own slot. Any failure fails the whole receipt: a bad signature on stored
 * data means the data was edited, so none of it should count. A missing
 * attestation (null/undefined) is just "not answered".
 */
export async function verifyReceipt(receipt: SignedReceipt, keyset: IssuerKeyset): Promise<VerifyResult<VerifiedReceipt>> {
  const statement = receiptStatementSchema.safeParse(receipt.statement);
  if (!statement.success) return { ok: false, reason: "malformed statement" };
  const digest = await receiptDigest(statement.data);

  const mint = await verifyReceiptMint(receipt.mint, keyset);
  if (!mint.ok) return { ok: false, reason: `mint: ${mint.reason}` };
  if (mint.payload.receipt !== receipt.id) return { ok: false, reason: "mint: signed for another receipt" };
  if (mint.payload.digest !== digest) return { ok: false, reason: "mint: statement does not match the signed digest" };
  if (mint.payload.iss !== statement.data.issuer) return { ok: false, reason: "mint: signed by another issuer" };

  const answers: Record<ReceiptAttestationKind, ReceiptDecision | null> = { payment: null, delivery: null };
  for (const kind of RECEIPT_ATTESTATION_KINDS) {
    const envelope = receipt[kind];
    if (envelope === null || envelope === undefined) continue;
    const a = await verifyReceiptAttestation(envelope, keyset);
    if (!a.ok) return { ok: false, reason: `${kind}: ${a.reason}` };
    if (a.payload.kind !== kind) return { ok: false, reason: `${kind}: signed as ${a.payload.kind}` };
    if (a.payload.receipt !== receipt.id || a.payload.digest !== digest) return { ok: false, reason: `${kind}: signed for another receipt` };
    if (a.payload.iss !== statement.data.issuer) return { ok: false, reason: `${kind}: signed by another issuer` };
    answers[kind] = a.payload.decision;
  }

  return {
    ok: true,
    payload: { id: receipt.id, statement: statement.data, digest, independent: mint.payload.independent === "true", ...answers },
  };
}
