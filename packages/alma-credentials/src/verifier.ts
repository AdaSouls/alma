import type { CredentialEvidence, VerificationStatus } from "@adasouls/alma-core";

export interface VerificationResult {
  status: VerificationStatus;
  reason?: string;
  verifiedAt: string;
}

export interface VerifyOptions {
  /** Injectable clock, for deterministic tests. */
  now?: () => Date;
}

/**
 * ALMA doesn't mandate one verification mechanism — a real implementation
 * might check a W3C VC signature, resolve an SD-JWT issuer key, or call
 * an ERC-8004 registry. This interface is what `adasouls-api` (or any
 * other consumer) codes against; only a non-cryptographic reference stub
 * ships here. See alma/REPOSITORY.md "Future scope."
 */
export interface CredentialVerifier {
  verifyCredential(credential: CredentialEvidence, options?: VerifyOptions): Promise<VerificationResult>;
}

/**
 * Reference implementation only — no real cryptographic or registry-based
 * verification. `alma-native` credentials (self-asserted, no external
 * proof format to check) verify trivially; every other format is
 * intentionally left `unverified` until a real verifier exists for it.
 * Already-revoked or expired credentials short-circuit before any format
 * check, since neither state should ever read as "verified."
 */
export const stubVerifier: CredentialVerifier = {
  async verifyCredential(credential, options = {}) {
    const now = options.now ?? (() => new Date());
    const verifiedAt = now().toISOString();

    if (credential.verificationStatus === "revoked") {
      return { status: "revoked", reason: "credential has been revoked", verifiedAt };
    }
    if (credential.expiresAt && credential.expiresAt < verifiedAt) {
      return { status: "expired", reason: "credential has expired", verifiedAt };
    }
    if (credential.format === "alma-native") {
      return { status: "verified", verifiedAt };
    }
    return {
      status: "unverified",
      reason: `no verifier implemented for credential format "${credential.format}"`,
      verifiedAt,
    };
  },
};
