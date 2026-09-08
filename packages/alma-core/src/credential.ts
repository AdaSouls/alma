import { z } from "zod";
import { unwrap } from "./errors.js";
import { randomLocalId } from "./identifier.js";

/**
 * ALMA does not define a new credential format. A credential's proof MAY
 * be a W3C Verifiable Credential (the default, recommended format), an
 * SD-JWT-based credential, a protocol-specific attestation, or another
 * independently verifiable format. See the ALMA whitepaper §4.2.
 */
export const CREDENTIAL_FORMATS = ["w3c-vc", "sd-jwt", "erc8004", "alma-native"] as const;
export type CredentialFormat = (typeof CREDENTIAL_FORMATS)[number];

export const VERIFICATION_STATUSES = ["unverified", "verified", "expired", "revoked"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const credentialEvidenceSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  issuer: z.string().min(1),
  type: z.string().min(1),
  claim: z.record(z.unknown()),
  format: z.enum(CREDENTIAL_FORMATS),
  artifact: z.string().min(1).optional(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
});
export type CredentialEvidence = z.infer<typeof credentialEvidenceSchema>;

export interface CreateCredentialInput {
  subject: string;
  issuer: string;
  type: string;
  claim: Record<string, unknown>;
  format: CredentialFormat;
  artifact?: string;
  expiresAt?: string;
  verificationStatus?: VerificationStatus;
}

export function createCredentialEvidence(input: CreateCredentialInput): CredentialEvidence {
  return unwrap(
    credentialEvidenceSchema.safeParse({
      id: `cred_${randomLocalId(12)}`,
      subject: input.subject,
      issuer: input.issuer,
      type: input.type,
      claim: input.claim,
      format: input.format,
      artifact: input.artifact,
      issuedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      verificationStatus: input.verificationStatus ?? "unverified",
    }),
    "credential"
  );
}
