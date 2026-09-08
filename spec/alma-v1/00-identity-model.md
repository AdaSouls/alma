# ALMA v1 — 00: Identity Model & Identifier Format

Status: Draft spec, versioned independently of the `alma` package's own
SemVer (see `02-revocation-portability-interop.md`).

## Subject types

ALMA describes exactly three kinds of Subject. This set is closed in v1 —
adding a fourth (e.g., "Device" or "Service") is a spec version bump, not
an extension point applications should invent locally, so that every ALMA
implementation agrees on what a Subject can be.

```text
Human          a person
Organization   a legal or informal entity that can hold Principals/agents
Agent          an AI agent — the thing that can be given economic authority
               and act on behalf of a Principal
```

## Identifier format

```text
alma:<network>:<subject-type>:<local-id>

examples:
  alma:main:human:8f2a...          a human
  alma:main:org:acme-labs          an organization
  alma:main:agent:treasury-01      an agent
```

- **`<network>`** is a namespace, not a blockchain — `main` for AdaSouls's
  hosted implementation, allowing other ALMA implementations to use their
  own namespace without collision. This is deliberately close to (but not
  identical to) a DID method string, so a `did:alma:...` mapping is a
  straightforward addition later rather than a redesign — see
  `02-revocation-portability-interop.md`.
- **`<subject-type>`** is one of the three closed types above.
- **`<local-id>`** is implementation-defined (AdaSouls uses a ULID or a
  human-chosen slug for organizations); ALMA does not mandate a specific
  ID generation scheme, only that it is unique within `<network>` and,
  once issued, **immutable** — an identifier is never reassigned to a
  different Subject, even after that Subject is retired.

## Why not just use a DID directly in v1

DIDs solve a broader problem (fully decentralized, self-sovereign
resolution) than v1 needs, and committing to a specific DID method now
would front-load a decision better made once there's a real
interoperability partner asking for it. The chosen format is intentionally
DID-shaped so that `did:alma:main:agent:treasury-01` is a plausible,
low-friction future DID method — not a coincidence, a design constraint.

## What Identity answers

Per `docs/01-domain-model.md`, an ALMA identity record answers, at minimum:

```text
Who are you?              -> identifier, subject type, display metadata
Who do you represent?     -> current Principal relationship(s)
What credentials do you have? -> Credential[] (see 01-authority-and-trust.md)
What authority has been delegated to you? -> Delegation[] (see 01-)
What have you done before? -> ReputationEvidence[] (see 01-)
```

An identity record does **not** answer "how much money do you have" or
"what wallet do you use" — that's `ProviderConnection`/`Capability` data
owned by the hosting implementation (`adasouls-api`), not part of the
portable identity itself. Keeping funds/wallet data out of the identity
record is what makes an identity genuinely portable across providers
(`docs/12-agent-lifecycle.md`).

## Minimal identity record shape

```ts
interface AlmaIdentity {
  id: string;                 // alma:main:agent:treasury-01
  subjectType: "human" | "organization" | "agent";
  displayName: string;
  createdAt: string;
  status: "active" | "suspended" | "retired";
  // Everything else (principal links, delegations, credentials,
  // reputation) is queried separately, not embedded, to keep the core
  // identity record small and cheap to resolve.
}
```
