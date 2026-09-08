import { z } from "zod";
import { unwrap } from "./errors.js";
import { randomLocalId } from "./identifier.js";

/**
 * ALMA defines what a delegation means inside an economic actor's
 * authority graph — not the cryptographic format used to prove it. See
 * the ALMA whitepaper §4.1.
 */
export const PROOF_FORMATS = ["ap2-mandate", "verifiable-intent", "w3c-vc", "alma-native"] as const;
export type ProofFormat = (typeof PROOF_FORMATS)[number];

export const proofSchema = z.object({
  format: z.enum(PROOF_FORMATS),
  reference: z.string().min(1).optional(),
});
export type Proof = z.infer<typeof proofSchema>;

export const DELEGATION_STATUSES = ["active", "revoked", "expired"] as const;
export type DelegationStatus = (typeof DELEGATION_STATUSES)[number];

export const delegationScopeSchema = z.object({
  capabilities: z.array(z.string().min(1)).min(1),
  constraints: z.record(z.unknown()).optional(),
});
export type DelegationScope = z.infer<typeof delegationScopeSchema>;

export const revocationSchema = z.object({
  at: z.string().datetime(),
  by: z.string().min(1),
  reason: z.string().min(1).optional(),
});
export type Revocation = z.infer<typeof revocationSchema>;

export const delegationSchema = z.object({
  id: z.string().min(1),
  issuer: z.string().min(1),
  subject: z.string().min(1),
  scope: delegationScopeSchema,
  status: z.enum(DELEGATION_STATUSES),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  revocation: revocationSchema.optional(),
  proof: proofSchema.optional(),
});
export type Delegation = z.infer<typeof delegationSchema>;

export interface CreateDelegationInput {
  issuer: string;
  subject: string;
  scope: DelegationScope;
  expiresAt?: string;
  proof?: Proof;
}

export function createDelegation(input: CreateDelegationInput): Delegation {
  return unwrap(
    delegationSchema.safeParse({
      id: `del_${randomLocalId(12)}`,
      issuer: input.issuer,
      subject: input.subject,
      scope: input.scope,
      status: "active",
      issuedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      proof: input.proof,
    }),
    "delegation"
  );
}

/**
 * Revocation is immediate, attributed, and non-retroactive: it changes the
 * status going forward, never rewrites history (nothing in ALMA is ever
 * hard-deleted). Returns a new object rather than mutating the input.
 */
export function revokeDelegation(delegation: Delegation, by: string, reason?: string): Delegation {
  return unwrap(
    delegationSchema.safeParse({
      ...delegation,
      status: "revoked",
      revocation: { at: new Date().toISOString(), by, reason },
    }),
    "delegation"
  );
}

/**
 * A narrower delegation must not exceed what its issuer holds. ALMA
 * defines this constraint; enforcing it against live authority data is a
 * policy-engine concern (see the ALMA whitepaper §4.1) — this helper only
 * checks capability containment given two scopes, as a building block.
 */
export function isNarrowerScope(narrower: DelegationScope, broader: DelegationScope): boolean {
  return narrower.capabilities.every((c) => broader.capabilities.includes(c));
}
