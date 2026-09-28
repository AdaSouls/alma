import { z } from "zod";
import { canonicalJson, toHex } from "./canonical.js";
import { unwrap } from "./errors.js";

/**
 * A receipt is the canonical, hashable statement that one settled payment
 * happened between a payer (the acting agent) and an identified payee.
 * Each side attests what only it can know (ADR-018):
 * - the payee: "payment received" -- evidence for the payer;
 * - the payer: "delivered as agreed" -- evidence for the payee.
 * That the transfer itself happened is checkable on-chain from
 * (chain, asset, to, amount, txHash); nobody needs to vouch for it.
 *
 * Encoding is unambiguous by construction, so any implementation
 * (TypeScript, Rust, a circuit) reproduces the same bytes:
 * - RFC 8785 (JCS) for a flat object of strings: keys sorted by UTF-16
 *   code units, no whitespace, JSON string escaping;
 * - every value is printable ASCII, so escaping rules and Unicode
 *   normalization never come into play;
 * - amounts are non-negative integers in the asset's base units
 *   ("500 USDC" is "500000000"), never decimals;
 * - chain and asset are CAIP-2 / CAIP-19 identifiers;
 * - `issuer` and `env` keep test/mock receipts from ever being mistaken
 *   for production ones.
 *
 * The on-chain commitment is not derived here: it needs each party's
 * enrolled holder key (see ADR-018).
 */

export const RECEIPT_VERSION = "alma-receipt/1";

export const RECEIPT_ENVS = ["mainnet", "testnet", "mock"] as const;
export type ReceiptEnv = (typeof RECEIPT_ENVS)[number];

const ascii = z.string().regex(/^[\x20-\x7e]*$/, "must be printable ASCII");
const nonEmptyAscii = ascii.min(1);

export const receiptStatementSchema = z.object({
  v: z.literal(RECEIPT_VERSION),
  issuer: nonEmptyAscii,
  env: z.enum(RECEIPT_ENVS),
  action: nonEmptyAscii,
  payer: nonEmptyAscii,
  payee: nonEmptyAscii,
  capability: nonEmptyAscii,
  /** CAIP-2, e.g. "eip155:84532" (Base Sepolia). */
  chain: ascii.regex(/^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$/, "must be a CAIP-2 chain id"),
  /** CAIP-19, e.g. "eip155:84532/erc20:0x036c...". */
  asset: ascii.regex(/^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}\/[-a-z0-9]{3,8}:[-.%a-zA-Z0-9]{1,128}$/, "must be a CAIP-19 asset id"),
  /** Integer, base units of `asset`. */
  amount: ascii.regex(/^(0|[1-9][0-9]*)$/, "must be an integer amount in base units"),
  to: nonEmptyAscii,
  txHash: nonEmptyAscii,
  settledAt: ascii.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "must be an ISO-8601 UTC timestamp with second precision"),
});
export type ReceiptStatement = z.infer<typeof receiptStatementSchema>;

export type BuildReceiptInput = Omit<ReceiptStatement, "v" | "settledAt"> & { settledAt?: Date };

export function buildReceiptStatement(input: BuildReceiptInput): ReceiptStatement {
  const settledAt = (input.settledAt ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  return unwrap(receiptStatementSchema.safeParse({ ...input, v: RECEIPT_VERSION, settledAt }), "receiptStatement");
}

/** RFC 8785 (JCS). With flat, printable-ASCII string values it reduces to sorted keys + JSON.stringify. */
export function canonicalizeReceipt(statement: ReceiptStatement): string {
  return canonicalJson(unwrap(receiptStatementSchema.safeParse(statement), "receiptStatement"));
}

/** SHA-256 of the canonical encoding, lowercase hex (64 chars). Web Crypto, so it runs in Node and browsers. */
export async function receiptDigest(statement: ReceiptStatement): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeReceipt(statement));
  return toHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)));
}

/** 32 random bytes, lowercase hex -- a party's private opening. */
export function generateReceiptSalt(): string {
  return toHex(globalThis.crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * "12.5" with 6 decimals -> "12500000". Exact (string arithmetic, no
 * floats); rejects more fractional digits than the asset has, instead of
 * silently rounding someone's money.
 */
export function toBaseUnits(amount: string, decimals: number): string {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!m) throw new Error(`amount "${amount}" must be a non-negative decimal`);
  const [, whole, frac = ""] = m;
  if (frac.length > decimals) throw new Error(`amount "${amount}" has more than ${decimals} decimals`);
  const digits = (whole + frac.padEnd(decimals, "0")).replace(/^0+(?=\d)/, "");
  return digits;
}
