import { describe, expect, it } from "vitest";
import {
  formatIdentifier,
  parseIdentifier,
  isValidIdentifier,
  slugifyLocalId,
  randomLocalId,
} from "../src/identifier.js";
import { AlmaValidationError } from "../src/errors.js";

describe("identifier format", () => {
  it("round-trips a well-formed identifier", () => {
    const formatted = formatIdentifier({ network: "main", subjectType: "agent", localId: "treasury-01" });
    expect(formatted).toBe("alma:main:agent:treasury-01");
    expect(parseIdentifier(formatted)).toEqual({
      network: "main",
      subjectType: "agent",
      localId: "treasury-01",
    });
  });

  it.each(["human", "organization", "agent"] as const)("accepts subject type %s", (subjectType) => {
    expect(isValidIdentifier(`alma:main:${subjectType}:x`)).toBe(true);
  });

  it("rejects a subject type outside the closed set", () => {
    expect(isValidIdentifier("alma:main:device:x")).toBe(false);
    expect(() => parseIdentifier("alma:main:device:x")).toThrow(AlmaValidationError);
  });

  it("rejects a malformed shape", () => {
    for (const bad of ["not-alma:main:agent:x", "alma:main:agent", "alma:main:agent:x:extra", ""]) {
      expect(isValidIdentifier(bad)).toBe(false);
    }
  });

  it("names the offending field on failure", () => {
    try {
      parseIdentifier("alma:Main!:agent:x");
      throw new Error("expected parseIdentifier to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AlmaValidationError);
      expect((err as AlmaValidationError).field).toBe("identifier.network");
    }
  });

  it("rejects an empty or overlong local-id", () => {
    expect(isValidIdentifier("alma:main:agent:")).toBe(false);
    expect(isValidIdentifier(`alma:main:agent:${"x".repeat(200)}`)).toBe(false);
  });
});

describe("local-id helpers", () => {
  it("slugifies a display name", () => {
    expect(slugifyLocalId("Acme Labs")).toBe("acme-labs");
    expect(slugifyLocalId("  Treasury  Agent #1  ")).toBe("treasury-agent-1");
  });

  it("random local-ids are well-formed and not obviously colliding", () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomLocalId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(isValidIdentifier(`alma:main:agent:${id}`)).toBe(true);
  });
});

describe("identifier format — property-style fuzzing", () => {
  it("format(parse(x)) === x for 200 random valid identifiers", () => {
    for (let i = 0; i < 200; i++) {
      const localId = randomLocalId(1 + (i % 20));
      const original = formatIdentifier({ network: "main", subjectType: "agent", localId });
      expect(formatIdentifier(parseIdentifier(original))).toBe(original);
    }
  });
});
