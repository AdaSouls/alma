import { describe, expect, it } from "vitest";
import { createCredentialEvidence, revokeCredential } from "@adasouls/alma-core";
import { stubVerifier } from "../src/verifier.js";

const ISSUER = "alma:main:org:acme-labs";
const SUBJECT = "alma:main:agent:treasury-01";
const fixedNow = () => new Date("2026-01-01T00:00:00.000Z");

describe("stubVerifier", () => {
  it("verifies an alma-native credential trivially", async () => {
    const credential = createCredentialEvidence({
      subject: SUBJECT,
      issuer: ISSUER,
      type: "kyb-tier",
      claim: { tier: "verified" },
      format: "alma-native",
    });
    const result = await stubVerifier.verifyCredential(credential, { now: fixedNow });
    expect(result.status).toBe("verified");
  });

  it("leaves every other format unverified", async () => {
    for (const format of ["w3c-vc", "sd-jwt", "erc8004"] as const) {
      const credential = createCredentialEvidence({
        subject: SUBJECT,
        issuer: ISSUER,
        type: "kyb-tier",
        claim: { tier: "verified" },
        format,
      });
      const result = await stubVerifier.verifyCredential(credential, { now: fixedNow });
      expect(result.status).toBe("unverified");
      expect(result.reason).toContain(format);
    }
  });

  it("reports a revoked credential as revoked regardless of format", async () => {
    const credential = createCredentialEvidence({
      subject: SUBJECT,
      issuer: ISSUER,
      type: "kyb-tier",
      claim: { tier: "verified" },
      format: "alma-native",
    });
    const revoked = revokeCredential(credential, ISSUER, "issuer compromised");
    const result = await stubVerifier.verifyCredential(revoked, { now: fixedNow });
    expect(result.status).toBe("revoked");
  });

  it("reports an expired credential as expired", async () => {
    const credential = createCredentialEvidence({
      subject: SUBJECT,
      issuer: ISSUER,
      type: "kyb-tier",
      claim: { tier: "verified" },
      format: "alma-native",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    const result = await stubVerifier.verifyCredential(credential, { now: fixedNow });
    expect(result.status).toBe("expired");
  });
});
