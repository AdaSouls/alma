import { describe, expect, it } from "vitest";
import { createCredentialEvidence, revokeCredential } from "../src/credential.js";

const ISSUER = "alma:main:org:acme-labs";
const SUBJECT = "alma:main:agent:treasury-01";

describe("createCredentialEvidence", () => {
  it("creates an unverified credential by default", () => {
    const credential = createCredentialEvidence({
      subject: SUBJECT,
      issuer: ISSUER,
      type: "kyb-tier",
      claim: { tier: "verified" },
      format: "w3c-vc",
    });
    expect(credential.verificationStatus).toBe("unverified");
    expect(credential.claim).toEqual({ tier: "verified" });
  });
});

describe("revokeCredential", () => {
  it("is immediate, attributed, and preserves the original claim", () => {
    const credential = createCredentialEvidence({
      subject: SUBJECT,
      issuer: ISSUER,
      type: "kyb-tier",
      claim: { tier: "verified" },
      format: "w3c-vc",
      verificationStatus: "verified",
    });
    const revoked = revokeCredential(credential, ISSUER, "issuer compromised");
    expect(revoked.verificationStatus).toBe("revoked");
    expect(revoked.revocation?.by).toBe(ISSUER);
    expect(revoked.revocation?.reason).toBe("issuer compromised");
    expect(revoked.id).toBe(credential.id);
    expect(revoked.claim).toEqual(credential.claim);
  });
});
