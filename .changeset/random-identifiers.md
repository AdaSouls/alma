---
"@adasouls/alma-core": minor
---

`createIdentity` issues a random local-id when none is given, for humans, organizations and agents alike. It used to derive one from the display name ("Acme Labs" became `alma:main:organization:acme-labs`), which made identifiers collide for Subjects with the same name, let anyone claim a name by registering it first, and put a person's name in a permanent public identifier. Pass `localId` to choose one yourself. Identifiers issued before stay valid: the format is unchanged, and the spec now says a local-id should be random and must not carry personal data for a human.
