import { describe, expect, it } from "vitest";
import { createIdentity } from "../src/subject.js";
import { AlmaValidationError } from "../src/errors.js";
import { isValidIdentifier } from "../src/identifier.js";

describe("createIdentity", () => {
  it("derives an identifier from the display name", () => {
    const identity = createIdentity({ subjectType: "organization", displayName: "Acme Labs" });
    expect(identity.id).toBe("alma:main:organization:acme-labs");
    expect(isValidIdentifier(identity.id)).toBe(true);
    expect(identity.status).toBe("active");
    expect(identity.controllers).toEqual([]);
  });

  it("accepts an explicit local-id", () => {
    const identity = createIdentity({ subjectType: "agent", displayName: "Treasury", localId: "treasury-01" });
    expect(identity.id).toBe("alma:main:agent:treasury-01");
  });

  it("carries a principal reference and controllers", () => {
    const identity = createIdentity({
      subjectType: "agent",
      displayName: "Treasury Agent",
      principal: "alma:main:org:acme-labs",
      controllers: [{ type: "wallet", value: "0xabc" }],
    });
    expect(identity.principal).toBe("alma:main:org:acme-labs");
    expect(identity.controllers).toEqual([{ type: "wallet", value: "0xabc" }]);
  });

  it("rejects an empty display name with a field-attributed error", () => {
    expect(() => createIdentity({ subjectType: "human", displayName: "" })).toThrow(AlmaValidationError);
  });
});
