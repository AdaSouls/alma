# ALMA v1 — 02: Revocation, Portability, Versioning, Interoperability, Privacy, On-chain vs Off-chain

## Revocation

Every grant type in ALMA — `Delegation`, `Credential`, `ProviderConnection`
(the last isn't ALMA-owned but interacts with revocation) — has an explicit
`revoked` state, not just an expiry. Revocation is:

- **Immediate in effect**: a revoked Delegation must be rejected by
  `policy-engine` at the next authority check, not just "eventually"
  reflected — there is no propagation delay tolerated for revocation on
  the authorization path (unlike, say, reputation evidence rollups, which
  can tolerate eventual consistency).
- **Attributed**: who revoked it, when, and (optionally) why, so a
  revoked Delegation remains a legible audit artifact rather than a
  deleted row (nothing in ALMA is ever hard-deleted; `status` transitions,
  rows persist — see `docs/08-security-model.md` on audit immutability
  applied to the identity layer too).
- **Non-retroactive**: revoking a Delegation does not undo
  `EconomicAction`s already executed under it — the historical
  `policySnapshot` (`docs/10-economic-action-lifecycle.md`) remains valid
  as a record of what was authorized *at the time*.

## Portability

Portability is the concrete payoff of separating ALMA (protocol) from
AdaSouls (one implementation). Two levels:

1. **Portability across runtimes/providers, within one ALMA
   implementation** — already guaranteed by `docs/12-agent-lifecycle.md`'s
   AgentDefinition/Instance/Runtime split: an agent keeps its identity,
   delegation, and reputation evidence when it changes model, host,
   wallet provider, or chain.
2. **Portability across ALMA implementations** (aspirational, not built in
   v1) — because the identifier format, identity shape, and relationship
   graph are specified independent of AdaSouls's database, a second party
   could in principle stand up their own ALMA-conformant identity service
   and a subject could migrate its identifier's authoritative record from
   one implementation to another. v1 does **not** build the actual
   migration tooling for this — it exists as a design constraint (don't
   couple the spec to AdaSouls-specific fields) that keeps the option
   open. Do not confuse "designed to allow this" with "supported today."

## Versioning

The spec versions as `alma/v1`, `alma/v2`, etc., **independent of**:
- the `alma` npm package's own SemVer (a package patch release fixing a
  bug doesn't change the spec version);
- `adasouls-api`'s REST `/v1`, `/v2` (a REST major version doesn't imply
  an ALMA spec change, and vice versa — see `docs/06-api-contracts.md`).

A spec version bump requires: a written rationale, a migration mapping for
existing instance data (primarily in `adasouls-api`'s database, as the
reference implementation), and a deprecation window before the old version
is no longer accepted by new writes.

## Interoperability

| Standard | v1 posture |
|---|---|
| **ERC-8004** (or successors, for on-chain agent identity/reputation) | Identifier format is DID-shaped and forward-compatible; no on-chain anchoring implemented in v1. Document the mapping (`alma:main:agent:X` ↔ an on-chain identity) without building it. |
| **W3C Verifiable Credentials** | `Credential.proof` shape is VC-compatible; `alma-credentials` can verify a real VC's proof where the issuer is known. Full VC ecosystem tooling (revocation lists, selective disclosure) is future scope. |
| **DID-style identifiers** | Not implemented as literal DIDs in v1 (see `00-identity-model.md`), but designed so a `did:alma:...` method is a straightforward future addition. |
| **External identity/reputation systems** | `ReputationEvidence.sourceType` and `Credential.issuer` are open string fields specifically so an external system's record can be referenced without ALMA needing to model that system's internals. |

## Privacy considerations

- **Identifiers are not, by themselves, PII** — `alma:main:human:8f2a...`
  reveals a subject type and a namespace, nothing else. Display metadata
  (name, org name) is a separate, access-controlled field, not baked into
  the identifier.
- **Relationship graph visibility** is scoped by the querying party's
  authorization, not globally public by default — an organization's
  internal `owns`/`delegates` edges are not exposed to arbitrary
  counterparties; only what's needed for a specific counterparty-policy
  check (e.g., "has this agent completed N transactions") is computable
  without exposing the full graph.
- **Credentials may carry sensitive claims** (e.g., KYB details) — the
  `Credential.claim` payload should store the minimum necessary claim
  (a boolean/tier, not the underlying documents), with any sensitive
  source documents held by the issuer, not duplicated into ALMA storage.
- **Reputation evidence is evidence of economic behavior**, which is
  itself sensitive for some organizations (revealing counterparties,
  volumes). v1's counterparty-policy evaluation should expose aggregates
  needed for a decision, not raw transaction detail, to a counterparty
  performing that check.

## On-chain vs off-chain decisions

| Data | Location | Why |
|---|---|---|
| Identity records, Delegations, Credentials, Relationships, Reputation evidence | **Off-chain** (implementation's database — `adasouls-api`'s Postgres) | Needs to be queryable, updatable (revocation), and privacy-scoped in ways that are awkward and costly on-chain; no current requirement forces on-chain anchoring |
| EconomicAction execution (the actual funds movement) | **On-chain where the chosen chain/protocol requires it** | Determined entirely by the provider/chain the customer selected — ALMA/AdaSouls doesn't choose this, `provider-adapters` routes to wherever the funds actually need to move |
| A future anchoring hash of identity/reputation state | **Deferred** | Could allow external verification of "this reputation evidence existed at time T" without exposing the underlying data — a plausible Phase 16+ addition once real demand exists, not built now |

The guiding rule, stated once: **put something on-chain only when the
chain itself is the thing enforcing or moving value** — identity, policy,
and trust data stay off-chain unless a specific interoperability need
(e.g., an ERC-8004 integration a customer requires) forces otherwise.
