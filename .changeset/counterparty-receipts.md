---
"@adasouls/alma-core": minor
---

Receipts for payments on a private rail: `alma-receipt/2` adds `settlement`. `onchain` (with `txHash`) is the same as `alma-receipt/1`; `counterparty` (with `reference`, e.g. a Stripe PaymentIntent) is a payment the issuer never saw settle, established only by the payee's confirmed payment attestation, and to be counted apart from on-chain receipts. `buildReceiptStatement` without `settlement` still builds `alma-receipt/1`, byte for byte, and every existing receipt verifies unchanged. New: `receiptSettlement()`, `receiptPaymentRef()`, `receiptStatementV1Schema`, `receiptStatementV2Schema`; `verifyReceipt` returns `settlement`.

`ReceiptStatement` is now a union of the two versions: code that reads `statement.txHash` has to check the settlement first (or use `receiptPaymentRef()`).
