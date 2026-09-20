import { MANIFEST_KIND, MANIFEST_VERSION, agentManifestSchema, type AgentManifest, type ManifestCounterpartyPolicyRules, type ManifestSelfPolicyRules } from "./schema.js";
import { unwrap } from "@adasouls/alma-core";

export interface BuildManifestInput {
  name: string;
  capabilities: string[];
  selfPolicy?: ManifestSelfPolicyRules;
  counterpartyPolicy?: ManifestCounterpartyPolicyRules;
  integrations?: { wallet?: string; chain?: string };
}

/**
 * The inverse of compileManifest() -- "the Treasury Agent's
 * configuration can be expressed as ... a manifest file"
 * (docs/20-roadmap.md's Phase 9 exit criteria), not just compiled
 * forward into one. Takes the same real configuration a running agent
 * has (name, capabilities, self/counterparty policy rules, provider
 * integrations) and produces a validated AgentManifest -- round-trip
 * with compileManifest(buildManifest(x)) reproduces x.
 */
export function buildManifest(input: BuildManifestInput): AgentManifest {
  return unwrap(
    agentManifestSchema.safeParse({
      kind: MANIFEST_KIND,
      version: MANIFEST_VERSION,
      metadata: { name: input.name },
      identity: { type: "agent" },
      capabilities: input.capabilities,
      authority: input.selfPolicy,
      counterpartyPolicy: input.counterpartyPolicy,
      integrations: input.integrations,
    }),
    "manifest"
  );
}
