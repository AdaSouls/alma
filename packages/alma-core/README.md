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

## License

MIT
