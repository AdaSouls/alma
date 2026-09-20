# @adasouls/alma-manifest

A portable, declarative YAML configuration for an ALMA agent — identity,
capabilities, self/counterparty policy, and provider integrations —
schema + parser/compiler. Phase 9 of `docs/MASTER-ROADMAP.md`.

```yaml
kind: Agent
version: alma/v1
metadata:
  name: treasury-agent
identity:
  type: agent
capabilities:
  - pay
authority:
  maxTransaction:
    USDC: "1000"
counterpartyPolicy:
  minCompletedTransactions: 1
integrations:
  wallet: crossmint
  chain: base
```

```ts
import { parseManifestYaml, compileManifest, buildManifest, stringifyManifest } from "@adasouls/alma-manifest";

const manifest = parseManifestYaml(yamlText); // validates, throws AlmaValidationError on a bad manifest
const compiled = compileManifest(manifest);
// compiled.agent, compiled.delegation.scope, compiled.selfPolicy, compiled.counterpartyPolicy, compiled.integrations
// -- the request payloads a caller sends to adasouls-api's real REST endpoints (this package makes no network calls itself)

// The reverse direction -- an existing agent's real configuration, expressed as a manifest:
const rebuilt = buildManifest({ name: "treasury-agent", capabilities: ["pay"], selfPolicy: { maxTransaction: { USDC: "1000" } } });
const yamlOut = stringifyManifest(rebuilt);
```

See `reference-agents/treasury-agent` (`treasury-agent.yaml` +
`src/setup.ts`) for a real caller: that repo's admin bootstrap script
reads the manifest and drives `adasouls-api`'s REST endpoints from its
compiled output, rather than hardcoding the same values twice.

## Design notes

- `authority` mirrors `@adasouls/policy-engine`'s `SelfPolicyRules` shape
  (and `counterpartyPolicy` mirrors `CounterpartyPolicyRules`) without
  depending on that package — `alma` must not depend upward on
  `adasouls-engine`. If that shape changes there, this needs a matching
  manual update (see `src/schema.ts`'s header comment) — no automated
  drift check exists yet.
- Makes no network calls and knows nothing about `adasouls-api` — it only
  produces/consumes the manifest shape and compiles it into request
  payloads. Applying those payloads (calling the real REST endpoints) is
  the caller's job.

## Local development

```bash
npm install   # from the alma repo root (npm workspaces)
npm run build --workspace @adasouls/alma-manifest
npm run test --workspace @adasouls/alma-manifest
```
