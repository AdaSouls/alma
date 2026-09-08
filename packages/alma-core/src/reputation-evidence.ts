import { z } from "zod";
import { unwrap } from "./errors.js";
import { randomLocalId } from "./identifier.js";

/**
 * ALMA does not compete with a chain-native reputation registry like
 * ERC-8004 — it consumes one as a single evidence source among several,
 * normalized into the same append-only model as a completed
 * EconomicAction or a marketplace outcome. See the ALMA whitepaper §5.2.
 */
export const EVIDENCE_SOURCE_TYPES = [
  "erc8004",
  "economic-action",
  "marketplace",
  "credential",
  "external",
] as const;
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];

export const EVIDENCE_ROLES = ["principal", "agent"] as const;
export type EvidenceRole = (typeof EVIDENCE_ROLES)[number];

export const EVIDENCE_OUTCOMES = ["success", "failure", "disputed"] as const;
export type EvidenceOutcome = (typeof EVIDENCE_OUTCOMES)[number];

export const evidenceSourceSchema = z.object({
  type: z.enum(EVIDENCE_SOURCE_TYPES),
  reference: z.string().min(1).optional(),
});

export const reputationEvidenceSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  role: z.enum(EVIDENCE_ROLES),
  source: evidenceSourceSchema,
  outcome: z.enum(EVIDENCE_OUTCOMES),
  occurredAt: z.string().datetime(),
  detail: z.record(z.unknown()).optional(),
});
export type ReputationEvidence = z.infer<typeof reputationEvidenceSchema>;

export interface RecordEvidenceInput {
  subject: string;
  role: EvidenceRole;
  source: { type: EvidenceSourceType; reference?: string };
  outcome: EvidenceOutcome;
  occurredAt?: string;
  detail?: Record<string, unknown>;
}

/** Evidence is append-only: this always produces a new record, never mutates one. */
export function recordEvidence(input: RecordEvidenceInput): ReputationEvidence {
  return unwrap(
    reputationEvidenceSchema.safeParse({
      id: `rep_${randomLocalId(12)}`,
      subject: input.subject,
      role: input.role,
      source: input.source,
      outcome: input.outcome,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      detail: input.detail,
    }),
    "reputationEvidence"
  );
}
