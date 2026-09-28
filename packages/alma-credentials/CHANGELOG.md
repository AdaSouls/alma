# @adasouls/alma-credentials

## 0.1.2

### Patch Changes

- [#5](https://github.com/AdaSouls/alma/pull/5) [`8aca05e`](https://github.com/AdaSouls/alma/commit/8aca05e41abbac874e68786f64a079afbd487679) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Open source under MIT and publish to the public npm registry.
  
  alma-core: accept `org` as the short form of the `organization` subject type (`alma:main:org:acme-labs`), as the
  spec's own example and the on-chain AlmaAnchorRegistry already use. Parsing normalizes `subjectType` to
  `organization` and reports the literal in `subjectTypeSegment`; formatting preserves it, so identifiers round-trip.
- Updated dependencies [[`8aca05e`](https://github.com/AdaSouls/alma/commit/8aca05e41abbac874e68786f64a079afbd487679)]:
  - @adasouls/alma-core@0.3.0

## 0.1.1

### Patch Changes

- [`299263d`](https://github.com/AdaSouls/alma/commit/299263d28e1cdc9c4079c4dd72b5ccc9ab41a6f6) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - First release to the private GitHub Packages registry (Phase 1, M6):
  identifier format, Subject/Delegation/Credential/Relationship/
  ReputationEvidence types with revocation, and the alma-credentials
  stub verifier.
- Updated dependencies [[`299263d`](https://github.com/AdaSouls/alma/commit/299263d28e1cdc9c4079c4dd72b5ccc9ab41a6f6)]:
  - @adasouls/alma-core@0.1.1
