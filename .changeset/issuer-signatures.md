---
"@adasouls/alma-core": minor
---

Issuer signatures on receipts (ADR-020): Ed25519-signed mint and attestation payloads (`signReceiptMint`, `signReceiptAttestation`), `LocalSigner` and the `IssuerSigner` interface for KMS/HSM signers, key sets with derived key ids (`createIssuerKeyset`, `kidFor`, `toJwks`), and `verifyReceipt`, which checks a receipt end to end and returns only the signed facts.
