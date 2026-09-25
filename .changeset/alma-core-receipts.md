---
"@adasouls/alma-core": minor
---

Add counterparty receipts (`alma-receipt/1`): `buildReceiptStatement`, `canonicalizeReceipt` (RFC 8785 JCS over printable-ASCII strings), `receiptDigest` (SHA-256), `generateReceiptSalt`, and `toBaseUnits` (exact decimal-to-base-unit conversion). Statements carry issuer, env (mainnet/testnet/mock), payer, payee, CAIP-2 chain, CAIP-19 asset, integer amount, destination, txHash and settlement time.
