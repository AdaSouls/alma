import { z } from "zod";
import { toHex } from "./canonical.js";
import { unwrap } from "./errors.js";
import type { IssuerKeyset, IssuerSigner, VerifyResult } from "./issuer-signature.js";

/**
 * The issuer's permission for one payment out of an agent's Safe, checked
 * on-chain by the AdaSouls payment module (AdaSouls/adasouls-contracts)
 * before it moves anything: "this Safe may pay exactly this amount of this
 * token to this address, once, before this time".
 *
 * It grants nothing by itself. AdaSouls never holds a key that moves money:
 * the agent submits the payment with its own key, through a module its
 * Safe's owners installed and can remove. A signature can only make a
 * payment possible that the agent then makes, to the payee it names.
 *
 * Signed with the issuer key, but not like the other envelopes: a contract
 * can't afford to parse JSON, so the issuer signs a 32-byte digest of fixed
 * bytes Solidity rebuilds with `abi.encodePacked` and the SHA-256
 * precompile:
 *
 *   sha256(abi.encodePacked(
 *     "alma-payment-authorization/1",   // 28 bytes, the type tag
 *     uint256 chainId, address module, address safe,
 *     address token, address to, uint256 amount,
 *     bytes32 nonce, uint64 expiresAt))
 *
 * The signed message is always exactly 32 bytes, and every JSON envelope is
 * longer, so neither can pass for the other.
 */
export const PAYMENT_AUTHORIZATION_TYPE = "alma-payment-authorization/1";

const address = z.string().regex(/^0x[0-9a-f]{40}$/, "must be a lowercase 0x address");
const WHOLE = /^(0|[1-9][0-9]*)$/;
// A failed regex doesn't stop zod's refinements, so each one checks the shape before BigInt() sees it.
const uint256 = (what: string) =>
  z
    .string()
    .regex(WHOLE, `${what} must be a whole number in base units, as a decimal string`)
    .refine((v) => !WHOLE.test(v) || BigInt(v) < 2n ** 256n, `${what} must fit in 256 bits`);

export const paymentAuthorizationSchema = z
  .object({
    /** EIP-155 chain id: the authorization is good on this chain only. */
    chainId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    /** The payment module that may act on it. */
    module: address,
    /** The agent's Safe (its declared work wallet) that pays. */
    safe: address,
    /** The ERC-20 token paid. */
    token: address,
    /** Who is paid: the payee owner's payout wallet. */
    to: address,
    amount: uint256("amount").refine((v) => !WHOLE.test(v) || BigInt(v) > 0n, "amount must be more than 0"),
    /** 32 random bytes: the module accepts each nonce once. */
    nonce: z.string().regex(/^0x[0-9a-f]{64}$/, "must be 32 bytes, lowercase 0x hex"),
    /** Unix seconds. The module refuses it at or after this time. */
    expiresAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export type PaymentAuthorization = z.infer<typeof paymentAuthorizationSchema>;

/** An authorization as the agent hands it to the module. */
export interface SignedPaymentAuthorization {
  authorization: PaymentAuthorization;
  /** Which issuer key signed it; the module accepts only keys its owners approved. */
  kid: string;
  /** The 32 signed bytes, 0x hex. */
  digest: string;
  /** Ed25519 (RFC 8032) over `digest`, 64 bytes, 0x hex. */
  sig: string;
}

const hex = (b: Uint8Array) => `0x${toHex(b)}`;
const fromHex = (h: string) => Uint8Array.from(h.slice(2).match(/../g) ?? [], (b) => parseInt(b, 16));
const word = (n: bigint, bytes: number) => fromHex(`0x${n.toString(16).padStart(bytes * 2, "0")}`);

/** The bytes the issuer signs: see the layout above. */
export async function paymentAuthorizationDigest(input: PaymentAuthorization): Promise<Uint8Array> {
  const a = unwrap(paymentAuthorizationSchema.safeParse(input), "paymentAuthorization");
  const parts = [
    new TextEncoder().encode(PAYMENT_AUTHORIZATION_TYPE),
    word(BigInt(a.chainId), 32),
    fromHex(a.module),
    fromHex(a.safe),
    fromHex(a.token),
    fromHex(a.to),
    word(BigInt(a.amount), 32),
    fromHex(a.nonce),
    word(BigInt(a.expiresAt), 8),
  ];
  const packed = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    packed.set(p, at);
    at += p.length;
  }
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", packed));
}

export async function signPaymentAuthorization(signer: IssuerSigner, authorization: PaymentAuthorization): Promise<SignedPaymentAuthorization> {
  const digest = await paymentAuthorizationDigest(authorization);
  const sig = await signer.sign(digest);
  if (sig.length !== 64) throw new Error(`signer ${signer.kid} returned a ${sig.length}-byte signature, expected 64`);
  return { authorization, kid: signer.kid, digest: hex(digest), sig: hex(sig) };
}

/**
 * What the module checks, off-chain: the signature is a trusted key's
 * (of `iss`, when given) over the digest these fields make. Expiry and
 * whether the nonce was used are the chain's to say.
 */
export async function verifyPaymentAuthorization(
  signed: unknown,
  keyset: IssuerKeyset,
  iss?: string
): Promise<VerifyResult<PaymentAuthorization>> {
  const shape = z
    .object({
      authorization: z.unknown(),
      kid: z.string(),
      digest: z.string().regex(/^0x[0-9a-f]{64}$/),
      sig: z.string().regex(/^0x[0-9a-f]{128}$/),
    })
    .strict()
    .safeParse(signed);
  if (!shape.success) return { ok: false, reason: "malformed authorization" };
  const parsed = paymentAuthorizationSchema.safeParse(shape.data.authorization);
  if (!parsed.success) return { ok: false, reason: "malformed authorization" };
  const key = keyset.get(shape.data.kid);
  if (!key) return { ok: false, reason: `untrusted key ${shape.data.kid}` };
  if (iss !== undefined && key.iss !== iss) return { ok: false, reason: `key ${key.kid} does not sign for ${iss}` };
  // Recomputed from the fields: the digest sent alongside is a convenience, never trusted.
  const digest = await paymentAuthorizationDigest(parsed.data);
  if (hex(digest) !== shape.data.digest) return { ok: false, reason: "digest does not match the authorization" };
  const valid = await globalThis.crypto.subtle.verify({ name: "Ed25519" }, key.cryptoKey, fromHex(shape.data.sig), new Uint8Array(digest));
  return valid ? { ok: true, payload: parsed.data } : { ok: false, reason: "bad signature" };
}
