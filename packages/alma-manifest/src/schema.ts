import { z } from "zod";

export const MANIFEST_KIND = "Agent" as const;
export const MANIFEST_VERSION = "alma/v1" as const;

/**
 * Mirrors @adasouls/policy-engine's SelfPolicyRules shape (adasouls-
 * engine/packages/policy-engine/src/types.ts) field-for-field, without
 * depending on that package -- alma-manifest/REPOSITORY.md's
 * "Dependencies: None within the ecosystem" (alma must not depend
 * upward on adasouls-engine, docs/02-system-architecture.md). If that
 * shape changes, this needs a matching manual update; there is no
 * automated drift check yet, same known gap as adasouls-worker's
 * hand-maintained schema.ts copy of adasouls-api's.
 */
export const selfPolicyRulesSchema = z.object({
  maxTransaction: z.record(z.string(), z.string()).optional(),
  dailySpend: z.record(z.string(), z.string()).optional(),
  allowedAssets: z.array(z.string()).optional(),
  allowedProtocols: z.array(z.string()).optional(),
  allowedContracts: z.array(z.string()).optional(),
  allowedActions: z.array(z.string()).optional(),
  timeRestrictions: z.object({ timezone: z.string(), allowedHours: z.tuple([z.number(), z.number()]) }).optional(),
  humanApprovalThreshold: z.record(z.string(), z.string()).optional(),
});
export type ManifestSelfPolicyRules = z.infer<typeof selfPolicyRulesSchema>;

/** Mirrors policy-engine's CounterpartyPolicyRules -- same rationale as selfPolicyRulesSchema above. */
export const counterpartyPolicyRulesSchema = z.object({
  minReputationEvidence: z.object({ completedActions: z.number().optional(), disputeRate: z.number().optional() }).optional(),
  requiredCredentials: z.array(z.string()).optional(),
  minTokenHoldings: z.record(z.string(), z.string()).optional(),
  minCompletedTransactions: z.number().optional(),
  organizationVerification: z.literal("required").optional(),
  communityMembership: z.array(z.string()).optional(),
  allowlist: z.array(z.string()).optional(),
  blocklist: z.array(z.string()).optional(),
});
export type ManifestCounterpartyPolicyRules = z.infer<typeof counterpartyPolicyRulesSchema>;

/**
 * The declarative shape from docs/21-developer-experience.md's
 * "Quickstart: Agent Manifest" example:
 *
 *   kind: Agent
 *   version: alma/v1
 *   metadata:
 *     name: treasury-agent
 *   identity:
 *     type: agent
 *   capabilities:
 *     - pay
 *   authority:
 *     maxTransaction:
 *       USDC: 1000
 *   integrations:
 *     wallet: crossmint
 *     chain: base
 *
 * `authority` is the agent's self-policy (its own risk limits);
 * `counterpartyPolicy` isn't in that doc's minimal example but is real,
 * separate scope (docs/11-policy-model.md's counterparty trust rules) --
 * needed for a manifest to actually reproduce a real agent's full
 * configuration (e.g. reference-agents/treasury-agent's, which has both).
 */
export const agentManifestSchema = z.object({
  kind: z.literal(MANIFEST_KIND),
  version: z.literal(MANIFEST_VERSION),
  metadata: z.object({ name: z.string().min(1) }),
  identity: z.object({ type: z.literal("agent") }),
  capabilities: z.array(z.string().min(1)).min(1),
  authority: selfPolicyRulesSchema.optional(),
  counterpartyPolicy: counterpartyPolicyRulesSchema.optional(),
  integrations: z.object({ wallet: z.string().optional(), chain: z.string().optional() }).optional(),
});
export type AgentManifest = z.infer<typeof agentManifestSchema>;
