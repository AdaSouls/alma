---
"@adasouls/alma-core": minor
"@adasouls/alma-credentials": patch
"@adasouls/alma-manifest": patch
---

Open source under MIT and publish to the public npm registry.

alma-core: accept `org` as the short form of the `organization` subject type (`alma:main:org:acme-labs`), as the
spec's own example and the on-chain AlmaAnchorRegistry already use. Parsing normalizes `subjectType` to
`organization` and reports the literal in `subjectTypeSegment`; formatting preserves it, so identifiers round-trip.
