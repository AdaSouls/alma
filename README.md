# ALMA

ALMA provides persistent identity, verifiable credentials, delegated authority, relationships, and economic reputation across digital and financial systems.

It allows any actor — human, organization, or autonomous agent — to answer five fundamental questions:

- **Who are you?** — Persistent, portable identity.
- **Who do you represent?** — Verifiable relationships between humans, organizations, and agents.
- **What are you authorized to do?** — Cryptographically verifiable delegation and authority.
- **What can you prove?** — Public, private, and selectively disclosed credentials.
- **What have you done?** — Verifiable economic history and reputation evidence.

ALMA is not a wallet, token, identity provider, or centralized reputation score.

It is an open trust layer designed to aggregate and verify evidence from multiple sources — including blockchains, wallets, credentials, organizations, agent protocols, and economic interactions — while allowing applications to define their own trust policies.

```
Human ─────── owns ───────► Organization
                                │
                             delegates
                                │
                                ▼
                              Agent
                                │
                           transacts with
                                │
                                ▼
                              Agent
```

Each participant has a persistent ALMA identity:

```
alma:human:...
alma:org:...
alma:agent:...
```

An ALMA identity is independent of any particular wallet, blockchain, AI model, runtime, or provider. Controllers, wallets, endpoints, credentials, and infrastructure can change without changing the underlying identity.

## Trust, not just identity

ALMA is designed for systems where knowing who an actor is isn't enough.

An application may need to determine whether an actor is trustworthy for a particular interaction.

```
Identity
    +
Principal
    +
Delegated Authority
    +
Credentials
    +
Relationships
    +
Economic Evidence
    ↓
Trust Evaluation
    ↓
ALLOW / DENY / REQUIRE PROOF / REQUIRE APPROVAL
```

ALMA therefore does not define a universal reputation score.

Instead, it exposes verifiable evidence that applications, organizations, and autonomous agents can evaluate according to their own policies.

## Public, Private, Provable

ALMA is designed around three visibility models:

- **Public** — information intended to be openly discoverable and independently verifiable.
- **Private** — information that remains confidential.
- **Provable** — claims that can be proven without revealing the underlying information, using cryptographic credentials and zero-knowledge proofs.

For example, an agent may prove that:

```
principal.isVerifiedBusiness == true
authority.transactionLimit >= $50,000
completedTransactions > 1,000
```

without necessarily revealing the underlying private data.

## On-chain and off-chain

ALMA is blockchain-compatible, but not blockchain-dependent.

On-chain registries can provide portable identity anchors, controllers, commitments, revocations, attestations, and verifiable economic events.

Rich profiles, private credentials, relationship graphs, economic evidence, and rapidly changing metadata can remain off-chain.

```
                  ALMA Identity
                       │
          ┌────────────┴────────────┐
          │                         │
       On-chain                  Off-chain
          │                         │
   identity anchors            profiles
   commitments                 credentials
   attestations                relationships
   revocations                 economic evidence
   transactions                private information
          │                         │
          └────────────┬────────────┘
                       ▼
                  ALMA Resolver
                       │
                       ▼
                Trust Evaluation
```

The objective is not to require applications to trust a single database.

Where possible, ALMA information should be backed by independently verifiable evidence.

## AI agents

For autonomous agents, ALMA separates the agent's identity from the infrastructure executing it.

An agent can change:

- Claude → GPT
- AWS → local runtime
- Safe → another wallet provider
- Base → another blockchain

while retaining the same identity, relationships, authority, credentials, and economic history.

This makes it possible for autonomous agents to establish persistent economic identities and build reputation over time.

## Interoperability

ALMA is intended to complement, not replace, existing infrastructure and standards.

Identity, credentials, agent discovery, wallets, blockchains, payment protocols, and communication protocols can act as sources of identity and trust evidence.

ALMA provides the common layer through which that evidence can be resolved and evaluated.

## Philosophy

The Internet established protocols for determining:

> "Am I communicating with the server I intended to reach?"

Autonomous economic systems introduce a broader question:

> "Should I trust this actor for this particular interaction?"

ALMA is an open protocol for answering that question with verifiable identity, authority, credentials, relationships, and economic evidence.

**Identity is persistent. Authority is delegated. Reputation is earned. Trust is contextual.**

## Repository layout

```text
/ (repo root)            the marketing/docs site — Next.js, deployed at
                         alma.adasouls.io. This is the repo's Vercel
                         project root on purpose: it's the same root the
                         legacy site (see legacy/) deployed from, so the
                         existing Vercel project keeps working unchanged.
packages/
  alma-core/            identifiers, Subject/Principal identity, delegation,
                         credentials, the relationship graph, reputation
                         evidence — the protocol implementation, no network
                         access or persistence of its own
  cli/                  @adasouls/alma-cli — `alma connect` / `delegate` /
                         `evidence add` / `whoami` from the terminal,
                         state kept in the current project's ./.alma/
apps/
  identity-studio/       reference frontend: issue an identity as a human,
                         organization, or agent, and build up relationships
                         and delegations between them — kept entirely in
                         the browser (localStorage), no backend
legacy/
  aldea-soulbound-mint/  an earlier, unrelated Cardano NFT-minting site
                         that used to live at this repo's root — see
                         legacy/README.md
```

## Development

```bash
npm install
npm run dev                    # the site — http://localhost:3000
npm run build                  # production build of the site (what Vercel runs)
npm test                       # alma-core's + cli's test suites
npm run dev:identity-studio    # http://localhost:5173
```

```bash
cd packages/cli && npm run build
node dist/bin.js connect       # try the CLI locally, from any project dir
```

The site's `/developers` page shows real output from `packages/cli` —
every line in its terminal blocks came from an actual run against a
scratch project, not a mockup. If the CLI's behavior changes, that page's
copy needs to be re-verified against a real run, not just edited.

`alma-core` has no external dependencies beyond `zod` (runtime validation)
and no network access or database — see its own tests in
`packages/alma-core/test/`. `identity-studio` and `cli` are thin reference
clients over it; a hosted implementation (e.g. `adasouls-api`) is what
would give identities cross-device persistence and a real API — see
`packages/cli/README.md` for exactly which parts of the CLI vision that
unlocks and aren't built yet.
