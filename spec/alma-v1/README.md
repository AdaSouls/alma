# ALMA spec — v1 (draft)

The canonical, versioned specification for the ALMA protocol. This is the
source of truth: `packages/alma-core` is a reference TypeScript
implementation of it, not the other way around.

- [`00-identity-model.md`](./00-identity-model.md) — Subject types, the
  `alma:<network>:<subject-type>:<local-id>` identifier format, the
  minimal identity record shape.
- [`01-authority-and-trust.md`](./01-authority-and-trust.md) — Delegation,
  Credential, the relationship graph, reputation evidence.
- [`02-revocation-portability-interop.md`](./02-revocation-portability-interop.md)
  — revocation semantics, portability, spec versioning rules,
  interoperability posture (ERC-8004, W3C VCs, DIDs), privacy, and
  on-chain vs. off-chain decisions.

## Versioning

The spec versions as `alma/v1`, `alma/v2`, etc., independent of the
`@adasouls/alma-core` npm package's own SemVer and independent of any
REST API version an implementation exposes — see
`02-revocation-portability-interop.md`'s "Versioning" section for the
full rule. A version bump requires a written rationale and a migration
mapping for existing instance data; there is no `alma/v1` → `alma/v2`
bump yet.

## A note on cross-references

A few sections reference AdaSouls's own internal architecture docs and
ADRs (e.g. `docs/11-policy-model.md`, ADR-010) for the rationale behind a
design decision or how AdaSouls's own implementation applies it — those
aren't included in this repo, since they're planning material for one
implementation, not part of the protocol definition. The spec itself is
self-contained for what it defines; those references are supplementary
context, not required reading to implement ALMA.

## History

Moved here from an internal planning workspace on 2026-09-08 to become
the canonical copy (Phase 1, M5). The prior location is superseded —
this repo is the source of truth going forward.
