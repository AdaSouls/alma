import { describe, expect, it } from "vitest";
import { createDelegation, revokeDelegation, isNarrowerScope } from "../src/delegation.js";

const ORG = "alma:main:org:acme-labs";
const AGENT = "alma:main:agent:treasury-01";

describe("createDelegation", () => {
  it("creates an active delegation with a proof reference", () => {
    const delegation = createDelegation({
      issuer: ORG,
      subject: AGENT,
      scope: { capabilities: ["pay", "swap"] },
      proof: { format: "ap2-mandate", reference: "mandate_123" },
    });
    expect(delegation.status).toBe("active");
    expect(delegation.proof).toEqual({ format: "ap2-mandate", reference: "mandate_123" });
  });
});

describe("revokeDelegation", () => {
  it("is immediate, attributed, and preserves the original grant", () => {
    const delegation = createDelegation({ issuer: ORG, subject: AGENT, scope: { capabilities: ["pay"] } });
    const revoked = revokeDelegation(delegation, ORG, "wallet rotated");
    expect(revoked.status).toBe("revoked");
    expect(revoked.revocation?.by).toBe(ORG);
    expect(revoked.revocation?.reason).toBe("wallet rotated");
    expect(revoked.id).toBe(delegation.id);
    expect(revoked.scope).toEqual(delegation.scope);
  });
});

describe("isNarrowerScope", () => {
  it("accepts a strict subset", () => {
    expect(isNarrowerScope({ capabilities: ["pay"] }, { capabilities: ["pay", "swap"] })).toBe(true);
  });

  it("rejects a scope that exceeds the issuer's own grant", () => {
    expect(isNarrowerScope({ capabilities: ["pay", "lend"] }, { capabilities: ["pay"] })).toBe(false);
  });
});
