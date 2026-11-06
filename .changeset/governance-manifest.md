---
"@adasouls/alma-manifest": minor
"@adasouls/alma-cli": minor
---

Agents that don't pay. `alma-manifest` gains a `governance` section (Cardano networks, governance action types, decisions only a person takes, when analyses are published) and `compileManifest` carries it as a `governance` policy. `alma connect` and `alma limits` ask for money limits only when the capabilities include `pay`, refuse them otherwise, and take `--gov-networks`, `--gov-types`, `--human-decides`, `--publish`; the delegation's constraints carry the same rules. `whoami` describes them. A project that ships its `alma.yaml` gets a delegation for exactly those rules on its first `connect`.
