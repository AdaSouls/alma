import { z } from "zod";
import { canonicalJson, toHex } from "./canonical.js";
import { unwrap } from "./errors.js";

/**
 * A receipt is the canonical, hashable statement that one settled payment
 * happened between a payer (the acting agent) and an identified payee.
 * Each side attests what only it can know (ADR-018):
 * - the payee: "payment received" -- evidence for the payer;
 * - the payer: "delivered as agreed" -- evidence for the payee.
 *
 * How the transfer itself is known depends on the rail (`settlement`):
 * - onchain: checkable by anyone on the chain from (chain, asset, to,
 *   amount, txHash); nobody needs to vouch for it. Every
 *   `alma-receipt/1` receipt is this kind.
 * - counterparty (`alma-receipt/2` only): a private rail, such as a card
 *   payment through Stripe, that only its parties can see. `reference`
 *   names the payment on that rail (a Stripe PaymentIntent, `pi_...`),
 *   and the issuer has not seen it settle: the payment is established
 *   only by the payee's "payment received" attestation. Consumers must
 *   count it apart from on-chain receipts, never as one.
 *
 * Encoding is unambiguous by construction, so any implementation
 * (TypeScript, Rust, a circuit) reproduces the same bytes:
 * - RFC 8785 (JCS) for a flat object of strings: keys sorted by UTF-16
 *   code units, no whitespace, JSON string escaping;
 * - every value is printable ASCII, so escaping rules and Unicode
 *   normalization never come into play;
 * - amounts are non-negative integers in the asset's base units
 *   ("500 USDC" is "500000000"), never decimals;
 * - chain and asset are CAIP-2 / CAIP-19 identifiers. A private rail
 *   uses the same shape: Stripe is "stripe:test" / "stripe:live", its
 *   assets "stripe:live/iso4217:USD", amounts in the currency's minor
 *   units (cents);
 * - `issuer` and `env` keep test/mock receipts from ever being mistaken
 *   for production ones.
 *
 * The on-chain commitment is not derived here: it needs each party's
 * enrolled holder key (see ADR-018).
 */

/** The on-chain receipt. Unchanged: every receipt issued with it keeps its bytes and its meaning. */
export const RECEIPT_VERSION = "alma-receipt/1";
/** Adds `settlement`, so a receipt can also describe a payment on a private rail. */
export const RECEIPT_VERSION_2 = "alma-receipt/2";

export const RECEIPT_SETTLEMENTS = ["onchain", "counterparty"] as const;
export type ReceiptSettlement = (typeof RECEIPT_SETTLEMENTS)[number];

export const RECEIPT_ENVS = ["mainnet", "testnet", "mock"] as const;
export type ReceiptEnv = (typeof RECEIPT_ENVS)[number];

const ascii = z.string().regex(/^[\x20-\x7e]*$/, "must be printable ASCII");
const nonEmptyAscii = ascii.min(1);

const statementFields = {
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
  settledAt: ascii.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "must be an ISO-8601 UTC timestamp with second precision"),
};

export const receiptStatementV1Schema = z.object({ v: z.literal(RECEIPT_VERSION), ...statementFields, txHash: nonEmptyAscii });
export const receiptStatementV2Schema = z.discriminatedUnion("settlement", [
  z.object({ v: z.literal(RECEIPT_VERSION_2), settlement: z.literal("onchain"), ...statementFields, txHash: nonEmptyAscii }),
  z.object({ v: z.literal(RECEIPT_VERSION_2), settlement: z.literal("counterparty"), ...statementFields, reference: nonEmptyAscii }),
]);
export const receiptStatementSchema = z.union([receiptStatementV1Schema, receiptStatementV2Schema]);
export type ReceiptStatement = z.infer<typeof receiptStatementSchema>;
export type ReceiptStatementV1 = z.infer<typeof receiptStatementV1Schema>;

type Fields = Omit<ReceiptStatementV1, "v" | "settledAt" | "txHash"> & { settledAt?: Date };
/**
 * Without `settlement`: an on-chain `alma-receipt/1`, byte for byte what
 * this function always built. With `settlement: "counterparty"`: an
 * `alma-receipt/2` naming the payment by `reference`.
 */
export type BuildReceiptInput =
  | (Fields & { settlement?: undefined; txHash: string })
  | (Fields & { settlement: "onchain"; txHash: string })
  | (Fields & { settlement: "counterparty"; reference: string });

export function buildReceiptStatement(input: BuildReceiptInput): ReceiptStatement {
  const settledAt = (input.settledAt ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  const { settlement, ...rest } = input;
  // Each version's own schema, so a failure names the field rather than "matches neither version".
  return settlement === undefined
    ? unwrap(receiptStatementV1Schema.safeParse({ ...rest, v: RECEIPT_VERSION, settledAt }), "receiptStatement")
    : unwrap(receiptStatementV2Schema.safeParse({ ...rest, settlement, v: RECEIPT_VERSION_2, settledAt }), "receiptStatement");
}

/** How the payment a receipt describes is known: `alma-receipt/1` is always on-chain. */
export function receiptSettlement(statement: ReceiptStatement): ReceiptSettlement {
  return "settlement" in statement ? statement.settlement : "onchain";
}

/** The on-chain transaction, or the private rail's payment reference: whatever names the payment on its rail. */
export function receiptPaymentRef(statement: ReceiptStatement): string {
  return "reference" in statement ? statement.reference : statement.txHash;
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
