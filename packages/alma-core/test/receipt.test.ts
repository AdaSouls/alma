import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AlmaValidationError,
  RECEIPT_VERSION,
  RECEIPT_VERSION_2,
  receiptPaymentRef,
  receiptSettlement,
  receiptStatementSchema,
  buildReceiptStatement,
  canonicalizeReceipt,
  generateReceiptSalt,
  receiptDigest,
  toBaseUnits,
} from "../src/index.js";

const base = {
  issuer: "adasouls",
  env: "testnet" as const,
  action: "ea_1",
  payer: "alma:main:agent:a",
  payee: "alma:main:agent:b",
  capability: "pay",
  chain: "eip155:84532",
  asset: "eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e",
  amount: "500000000",
  to: "0x1111111111111111111111111111111111111111",
  txHash: "0xabc",
  settledAt: new Date("2026-09-25T00:00:00.123Z"),
};

const withoutTx = () => Object.fromEntries(Object.entries(base).filter(([k]) => k !== "txHash")) as Omit<typeof base, "txHash">;

describe("receipts", () => {
  it("canonical encoding is JCS: keys sorted, no whitespace, second-precision UTC", () => {
    expect(canonicalizeReceipt(buildReceiptStatement(base))).toBe(
      `{"action":"ea_1","amount":"500000000","asset":"eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e",` +
        `"capability":"pay","chain":"eip155:84532","env":"testnet","issuer":"adasouls","payee":"alma:main:agent:b",` +
        `"payer":"alma:main:agent:a","settledAt":"2026-09-25T00:00:00Z","to":"0x1111111111111111111111111111111111111111",` +
        `"txHash":"0xabc","v":"${RECEIPT_VERSION}"}`
    );
  });

  it("encoding does not depend on the key order of the input object", () => {
    const s = buildReceiptStatement(base);
    const shuffled = Object.fromEntries(Object.entries(s).reverse()) as typeof s;
    expect(canonicalizeReceipt(shuffled)).toBe(canonicalizeReceipt(s));
  });

  it("digest is SHA-256 of the canonical bytes (matches node:crypto), 32 bytes hex", async () => {
    const s = buildReceiptStatement(base);
    const expected = createHash("sha256").update(canonicalizeReceipt(s), "utf8").digest("hex");
    expect(await receiptDigest(s)).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects the ambiguities the old encoding allowed", () => {
    for (const amount of ["500.0", "5e2", "0500", "-1", ""]) {
      expect(() => buildReceiptStatement({ ...base, amount }), amount).toThrow(/receiptStatement.amount/);
    }
    expect(() => buildReceiptStatement({ ...base, payee: "alma:ágent" })).toThrow(/ASCII/);
    expect(() => buildReceiptStatement({ ...base, chain: "base-sepolia" })).toThrow(/CAIP-2/);
    expect(() => buildReceiptStatement({ ...base, asset: "USDC" })).toThrow(/CAIP-19/);
    expect(() => buildReceiptStatement({ ...base, env: "prod" as never })).toThrow(AlmaValidationError);
  });

  it("toBaseUnits is exact and refuses to round", () => {
    expect(toBaseUnits("500", 6)).toBe("500000000");
    expect(toBaseUnits("12.5", 6)).toBe("12500000");
    expect(toBaseUnits("0.000001", 6)).toBe("1");
    expect(toBaseUnits("0", 6)).toBe("0");
    expect(() => toBaseUnits("0.0000001", 6)).toThrow(/more than 6 decimals/);
    expect(() => toBaseUnits("1e3", 6)).toThrow();
  });

  it("salts are 32 random bytes", () => {
    const a = generateReceiptSalt();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(generateReceiptSalt()).not.toBe(a);
  });

  it("without a settlement, it is the on-chain alma-receipt/1 it always was", () => {
    const s = buildReceiptStatement(base);
    expect(s.v).toBe(RECEIPT_VERSION);
    expect("settlement" in s).toBe(false);
    expect(receiptSettlement(s)).toBe("onchain");
    expect(receiptPaymentRef(s)).toBe("0xabc");
  });

  it("a counterparty receipt is alma-receipt/2: it names the payment by reference, never as a transaction", () => {
    const rest = withoutTx();
    const card = buildReceiptStatement({ ...rest, chain: "stripe:test", asset: "stripe:test/iso4217:USD", amount: "1250", to: "acct_1Nb", settlement: "counterparty", reference: "pi_3Nabc" });
    expect(card).toMatchObject({ v: RECEIPT_VERSION_2, settlement: "counterparty", reference: "pi_3Nabc" });
    expect("txHash" in card).toBe(false);
    expect(receiptSettlement(card)).toBe("counterparty");
    expect(receiptPaymentRef(card)).toBe("pi_3Nabc");
    expect(canonicalizeReceipt(card)).toBe(
      `{"action":"ea_1","amount":"1250","asset":"stripe:test/iso4217:USD","capability":"pay","chain":"stripe:test","env":"testnet",` +
        `"issuer":"adasouls","payee":"alma:main:agent:b","payer":"alma:main:agent:a","reference":"pi_3Nabc",` +
        `"settledAt":"2026-09-25T00:00:00Z","settlement":"counterparty","to":"acct_1Nb","v":"${RECEIPT_VERSION_2}"}`
    );
  });

  it("each settlement carries its own reference, and versions can't be mixed", () => {
    const rest = withoutTx();
    expect(() => buildReceiptStatement({ ...rest, settlement: "counterparty" } as never)).toThrow(/reference/);
    expect(() => buildReceiptStatement({ ...rest, settlement: "onchain" } as never)).toThrow(/txHash/);
    expect(() => buildReceiptStatement({ ...rest, settlement: "wire", reference: "x" } as never)).toThrow(AlmaValidationError);
    const v1 = buildReceiptStatement(base);
    expect(receiptStatementSchema.safeParse({ ...v1, settlement: "counterparty", reference: "pi_1" }).success).toBe(true); // extra keys are dropped, as always
    expect(receiptStatementSchema.safeParse({ ...v1, v: RECEIPT_VERSION_2 }).success).toBe(false); // /2 must say how it settled
    expect(buildReceiptStatement({ ...base, settlement: "onchain" })).toMatchObject({ v: RECEIPT_VERSION_2, settlement: "onchain", txHash: "0xabc" });
  });
});
