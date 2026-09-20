import type { DelegationScope } from "@adasouls/alma-core";
import type { AgentManifest, ManifestCounterpartyPolicyRules, ManifestSelfPolicyRules } from "./schema.js";

/**
 * The output side of "produces the same agent/delegation/policy/
 * provider-connection state as the step-by-step SDK calls"
 * (docs/21-developer-experience.md). Deliberately NOT a network call --
 * alma-manifest has no dependency on adasouls-api (must not depend
 * upward, docs/02-system-architecture.md) -- this only produces the
 * request payloads a caller (a future `adasouls` CLI, or
 * reference-agents/treasury-agent's own setup, see that repo's
 * src/setup.ts) would send to the real REST endpoints.
 */
export interface CompiledManifest {
  agent: { displayName: string };
  delegation: { scope: DelegationScope };
  selfPolicy?: { kind: "self"; rules: ManifestSelfPolicyRules };
  counterpartyPolicy?: { kind: "counterparty"; rules: ManifestCounterpartyPolicyRules };
  integrations?: { wallet?: string; chain?: string };
}

export function compileManifest(manifest: AgentManifest): CompiledManifest {
  const compiled: CompiledManifest = {
    agent: { displayName: manifest.metadata.name },
    delegation: { scope: { capabilities: manifest.capabilities } },
  };

  if (manifest.authority) {
    compiled.selfPolicy = { kind: "self", rules: manifest.authority };
  }
  if (manifest.counterpartyPolicy) {
    compiled.counterpartyPolicy = { kind: "counterparty", rules: manifest.counterpartyPolicy };
  }
  if (manifest.integrations) {
    compiled.integrations = manifest.integrations;
  }

  return compiled;
}
