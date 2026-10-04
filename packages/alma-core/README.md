# @adasouls/alma-core

The core of the [ALMA](https://github.com/AdaSouls/alma) protocol: persistent
identity, delegated authority, credentials, relationships, reputation
evidence and counterparty receipts for humans, organizations and AI agents.
Pure TypeScript, validated with zod, runs in Node and browsers.

```bash
npm install @adasouls/alma-core
```

## Identifiers

```text
alma:<network>:<subject-type>:<local-id>
alma:main:agent:treasury
alma:main:org:tribu-raes        # "org" is accepted as short for "organization"
```

```ts
import { parseIdentifier, formatIdentifier, isValidIdentifier } from "@adasouls/alma-core";

parseIdentifier("alma:main:org:tribu-raes");
// { network: "main", subjectType: "organization", localId: "tribu-raes", subjectTypeSegment: "org" }
```

An identifier is stable: controllers (wallets, DIDs, endpoints) can change
without changing it.

## What's in the box

| Area | Main exports |
|---|---|
| Identity | `createIdentity`, `parseIdentifier`, `formatIdentifier`, `isValidIdentifier`, `SUBJECT_TYPES` (`human`, `organization`, `agent`) |
| Delegation | `createDelegation`, `revokeDelegation`, `isNarrowerScope` — who may act for whom, with which capabilities |
| Credentials | `createCredentialEvidence`, `revokeCredential` — formats `w3c-vc`, `sd-jwt`, `erc8004`, `alma-native` |
| Relationships | `createRelationship`, `hasRelationship`, `findPath`, `assertNoDelegationCycle` |
| Reputation evidence | `recordEvidence` — append-only; evidence, not a score |
| Receipts | `buildReceiptStatement`, `canonicalizeReceipt`, `receiptDigest`, `generateReceiptSalt`, `toBaseUnits` |
| Issuer signatures | `signReceiptMint`, `signReceiptAttestation`, `verifyReceipt`, `createIssuerKeyset`, `toJwks`, `LocalSigner`, `IssuerSigner` |
| Agent reports | `signAgentReport`, `verifyAgentReport`, `AGENT_REPORT_METRICS` |
| Job deliveries | `signJobDelivery`, `verifyJobDelivery`, `jsonDigest`, `canonicalJsonValue` |
| Transparency log | `envelopeLeafHash`, `merkleRoot`, `appendToFrontier`, `inclusionProof`, `verifyInclusion`, `consistencyProof`, `verifyConsistency`, `signTreeHead`, `verifyTreeHead` |

Validation failures throw `AlmaValidationError` naming the field and reason.

## Receipts (`alma-receipt/1`)

A receipt is the canonical statement that one settled payment happened
between a payer and an identified payee. The encoding is unambiguous so any
implementation reproduces the same bytes: RFC 8785 (JCS) over a flat object
of printable-ASCII strings, integer base-unit amounts, CAIP-2 chain and
CAIP-19 asset ids, plus `issuer` and `env` (`mainnet` / `testnet` / `mock`).

```ts
import { buildReceiptStatement, receiptDigest, toBaseUnits } from "@adasouls/alma-core";

const statement = buildReceiptStatement({
  issuer: "adasouls",
  env: "testnet",
  action: "eco_123",
  payer: "alma:main:agent:buyer",
  payee: "alma:main:agent:vendor",
  capability: "pay",
  chain: "eip155:84532",
  asset: "eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e",
  amount: toBaseUnits("12.5", 6), // "12500000" -- never rounds
  to: "0x…",
  txHash: "0x…",
});
const digest = await receiptDigest(statement); // SHA-256, hex
```

## Issuer signatures

The issuer signs what it asserts about a receipt with Ed25519: a **mint**
("I issued this statement", plus whether the two parties are independent)
and each **attestation** ("this party confirmed/declined payment or
delivery, at this time"). Payloads follow the same JCS rules, carry the
issuer and key id, and are bound to one receipt id and statement digest.
Signatures are plain RFC 8032 Ed25519, so any signer works: `LocalSigner`
(Web Crypto) for development, or AWS KMS (`ECC_NIST_EDWARDS25519`,
`ED25519_SHA_512`, `MessageType: RAW`) behind the `IssuerSigner` interface.

`verifyReceipt` checks everything at once and returns only the signed facts.
Use those, not your own copy of the data:

```ts
import { createIssuerKeyset, verifyReceipt } from "@adasouls/alma-core";

// Pin keys from a source you trust (config, a published fingerprint),
// not from wherever the receipt came from.
const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: "<base64url raw key>" }]);
const r = await verifyReceipt({ id, statement, mint, payment, delivery }, keyset);
if (r.ok) r.payload; // { statement, digest, independent, payment, delivery }
else r.reason;       // e.g. "mint: statement does not match the signed digest"
```

Key ids are `ed25519-` plus the first 16 bytes of SHA-256 of the public key,
so a keyset computes them itself.

## Transparency log

Signatures catch *edits*; a log catches *deletions*. The issuer appends
every signed envelope to an append-only Merkle tree (RFC 9162 hashing,
the Certificate Transparency design) and signs **tree heads** (size +
root). A party that kept an envelope can prove it's in the log, and
anyone holding an older tree head can check the log only ever grew:

```ts
import { envelopeLeafHash, verifyConsistency, verifyInclusion, verifyTreeHead } from "@adasouls/alma-core";

const head = await verifyTreeHead(sth, keyset, "adasouls-receipts-mainnet");
if (!head.ok) throw new Error(head.reason);
const { treeSize, rootHash } = head.payload; // always use size and root together
await verifyInclusion(await envelopeLeafHash(envelope), index, treeSize, proof, rootHash);
await verifyConsistency(oldSize, treeSize, oldRoot, rootHash, consistency); // nothing removed or rewritten
```

A leaf commits to the envelope's signature, so a published leaf hash
reveals nothing about a receipt to anyone who doesn't already hold it.

## Agent reports

Some figures only the agent knows: what a piece of work cost it to
compute, which model did it. The protocol asks the agent to report them,
and the issuer signs each one as an `alma-agent-report/1` envelope:
"this agent declared this figure, about this action or job, at this
time". It goes into the same transparency log as receipts.

```ts
import { verifyAgentReport } from "@adasouls/alma-core";

const report = await verifyAgentReport(envelope, keyset);
if (!report.ok) throw new Error(report.reason);
const { agent, about, ref, metric, value, unit, reportedAt } = report.payload;
```

Metrics in v1: `compute_cost` (a decimal plus a currency `unit`),
`model`, `input_tokens`, `output_tokens`, `duration_ms`.

A verified report proves **who declared what and when**, and the log
proves the declaration was never changed or removed. Neither proves the
figure is true: show it as declared by the agent, apart from what the
issuer verified itself.

## Job deliveries

When an agent is hired through the issuer, the issuer calls it and gets
its answer. It then signs an `alma-job-delivery/1` envelope: "this agent
returned a result with this digest for this job, at this time", and logs
it. The result itself stays with the two parties.

```ts
import { jsonDigest, verifyJobDelivery } from "@adasouls/alma-core";

const delivery = await verifyJobDelivery(envelope, keyset);
if (!delivery.ok) throw new Error(delivery.reason);
// Holding a result: is it the one that was delivered?
const same = (await jsonDigest(result)) === delivery.payload.resultDigest;
```

`jsonDigest` is SHA-256 over the value's canonical JSON (RFC 8785), so
key order and spacing don't matter. The envelope names the seller and
not the buyer. It proves the work was handed over, not that it was
good: that is the buyer's delivery attestation on the receipt.

## License

MIT
