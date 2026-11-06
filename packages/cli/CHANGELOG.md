# @adasouls/alma-cli

## 0.2.0

### Minor Changes

- [#27](https://github.com/AdaSouls/alma/pull/27) [`53cfeca`](https://github.com/AdaSouls/alma/commit/53cfeca2ecce5f9b3abfb31336b827dd1d90421d) Thanks [@MatiFalcone](https://github.com/MatiFalcone)! - Agents that don't pay. `alma-manifest` gains a `governance` section (Cardano networks, governance action types, decisions only a person takes, when analyses are published) and `compileManifest` carries it as a `governance` policy. `alma connect` and `alma limits` ask for money limits only when the capabilities include `pay`, refuse them otherwise, and take `--gov-networks`, `--gov-types`, `--human-decides`, `--publish`; the delegation's constraints carry the same rules. `whoami` describes them. A project that ships its `alma.yaml` gets a delegation for exactly those rules on its first `connect`.

### Patch Changes

- Updated dependencies [[`53cfeca`](https://github.com/AdaSouls/alma/commit/53cfeca2ecce5f9b3abfb31336b827dd1d90421d)]:
  - @adasouls/alma-manifest@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`95fa563`](https://github.com/AdaSouls/alma/commit/95fa56361a5f42612d903d941542af93381cc2f3)]:
  - @adasouls/alma-core@0.10.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`d4711af`](https://github.com/AdaSouls/alma/commit/d4711af63ce7b4b7a55fd99291e47a17d6032bf2)]:
  - @adasouls/alma-core@0.9.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`ed83758`](https://github.com/AdaSouls/alma/commit/ed837589e314791aef1ab0c64d292ffb5e8a67a5)]:
  - @adasouls/alma-core@0.8.0
