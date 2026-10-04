# @adasouls/alma-core

## 0.7.0

### Minor Changes

- [#14](https://github.com/AdaSouls/alma/pull/14) [`c07b84f`](https://github.com/AdaSouls/alma/commit/c07b84f5674b1755ccf9a8e6bf4adc19f3c25dac) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Job deliveries: `alma-job-delivery/1` envelopes (`signJobDelivery`, `verifyJobDelivery`) record that a hired agent returned a result, by its digest; `envelopeLeafHash` accepts them. `jsonDigest` and `canonicalJsonValue` give the RFC 8785 canonical form and SHA-256 of any JSON value.

## 0.6.0

### Minor Changes

- [#12](https://github.com/AdaSouls/alma/pull/12) [`7b64879`](https://github.com/AdaSouls/alma/commit/7b64879a3341652c90c3c197258b38484e23ba07) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Agent reports: figures only the agent knows (compute cost, model, tokens, duration), declared by the agent and signed by the issuer as `alma-agent-report/1` envelopes (`signAgentReport`, `verifyAgentReport`). `envelopeLeafHash` accepts them, so they enter the transparency log next to receipts.

## 0.5.0

### Minor Changes

- [#10](https://github.com/AdaSouls/alma/pull/10) [`7e084a3`](https://github.com/AdaSouls/alma/commit/7e084a3d40256dbce1698179aeefe3ae6f0fd6f8) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Transparency log (ADR-021): RFC 9162 Merkle tree over signed envelopes (`envelopeLeafHash`, `merkleRoot`, frontier append), inclusion and consistency proofs with verification, and signed tree heads (`signTreeHead`, `verifyTreeHead`).

## 0.4.0

### Minor Changes

- [#7](https://github.com/AdaSouls/alma/pull/7) [`1d9ca1f`](https://github.com/AdaSouls/alma/commit/1d9ca1f3014fb8fa72e1ec2f125f03c68da9748a) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Issuer signatures on receipts (ADR-020): Ed25519-signed mint and attestation payloads (`signReceiptMint`, `signReceiptAttestation`), `LocalSigner` and the `IssuerSigner` interface for KMS/HSM signers, key sets with derived key ids (`createIssuerKeyset`, `kidFor`, `toJwks`), and `verifyReceipt`, which checks a receipt end to end and returns only the signed facts.

## 0.3.0

### Minor Changes

- [#5](https://github.com/AdaSouls/alma/pull/5) [`8aca05e`](https://github.com/AdaSouls/alma/commit/8aca05e41abbac874e68786f64a079afbd487679) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Open source under MIT and publish to the public npm registry.
  
  alma-core: accept `org` as the short form of the `organization` subject type (`alma:main:org:acme-labs`), as the
  spec's own example and the on-chain AlmaAnchorRegistry already use. Parsing normalizes `subjectType` to
  `organization` and reports the literal in `subjectTypeSegment`; formatting preserves it, so identifiers round-trip.

## 0.2.0

### Minor Changes

- [#3](https://github.com/AdaSouls/alma/pull/3) [`5a9d47d`](https://github.com/AdaSouls/alma/commit/5a9d47d1e3b58e704a4d012d5a1250eb6131aa90) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Add counterparty receipts (`alma-receipt/1`): `buildReceiptStatement`, `canonicalizeReceipt` (RFC 8785 JCS over printable-ASCII strings), `receiptDigest` (SHA-256), `generateReceiptSalt`, and `toBaseUnits` (exact decimal-to-base-unit conversion). Statements carry issuer, env (mainnet/testnet/mock), payer, payee, CAIP-2 chain, CAIP-19 asset, integer amount, destination, txHash and settlement time.

## 0.1.1

### Patch Changes

- [`299263d`](https://github.com/AdaSouls/alma/commit/299263d28e1cdc9c4079c4dd72b5ccc9ab41a6f6) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - First release to the private GitHub Packages registry (Phase 1, M6):
  identifier format, Subject/Delegation/Credential/Relationship/
  ReputationEvidence types with revocation, and the alma-credentials
  stub verifier.
