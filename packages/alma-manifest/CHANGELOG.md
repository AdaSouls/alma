# @adasouls/alma-manifest

## 0.2.1

### Patch Changes

- [#5](https://github.com/AdaSouls/alma/pull/5) [`8aca05e`](https://github.com/AdaSouls/alma/commit/8aca05e41abbac874e68786f64a079afbd487679) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Open source under MIT and publish to the public npm registry.
  
  alma-core: accept `org` as the short form of the `organization` subject type (`alma:main:org:acme-labs`), as the
  spec's own example and the on-chain AlmaAnchorRegistry already use. Parsing normalizes `subjectType` to
  `organization` and reports the literal in `subjectTypeSegment`; formatting preserves it, so identifiers round-trip.
- Updated dependencies [[`8aca05e`](https://github.com/AdaSouls/alma/commit/8aca05e41abbac874e68786f64a079afbd487679)]:
  - @adasouls/alma-core@0.3.0

## 0.2.0

### Minor Changes

- [`1c5d8e0`](https://github.com/AdaSouls/alma/commit/1c5d8e0e4467dd72085a75aca0a8a87053900cc8) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - First release: Agent Manifest schema, YAML parser (`parseManifestYaml`), compiler (`compileManifest`, into the request payloads adasouls-api's REST endpoints expect), and the reverse direction (`buildManifest`/`stringifyManifest`, expressing a real agent's configuration as a manifest). Phase 9's exit criterion -- reference-agents/treasury-agent's own setup is now driven by treasury-agent.yaml through this package, not hardcoded.
