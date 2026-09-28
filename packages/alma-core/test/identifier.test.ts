import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  formatIdentifier,
  parseIdentifier,
  isValidIdentifier,
  slugifyLocalId,
  randomLocalId,
  SUBJECT_TYPES,
  canonicalSubjectType,
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

  it("accepts org as the short form of organization (AlmaAnchorRegistry, ALDEA World)", () => {
    expect(isValidIdentifier("alma:main:org:tribu-raes")).toBe(true);
    expect(parseIdentifier("alma:main:org:tribu-raes")).toEqual({
      network: "main",
      subjectType: "organization",
      localId: "tribu-raes",
      subjectTypeSegment: "org",
    });
  });

  it("preserves the org segment when formatting (identifiers are immutable)", () => {
    const id = "alma:main:org:aldea-world";
    expect(formatIdentifier(parseIdentifier(id))).toBe(id);
    expect(formatIdentifier({ network: "main", subjectType: "organization", localId: "acme" })).toBe(
      "alma:main:organization:acme"
    );
  });

  it("rejects a segment that does not denote the declared subject type", () => {
    expect(() =>
      formatIdentifier({ network: "main", subjectType: "human", localId: "x", subjectTypeSegment: "org" })
    ).toThrow(AlmaValidationError);
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

// Arbitraries built to satisfy each field's regex directly, rather than
// filtering fc.string() down to valid values — NETWORK_RE/LOCAL_ID_RE are
// restrictive enough that filtering would discard most generated cases.
const validNetwork = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), { maxLength: 31 })
  )
  .map(([first, rest]) => first + rest.join(""));

const validLocalId = fc
  .array(
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-".split("")),
    { minLength: 1, maxLength: 128 }
  )
  .map((chars) => chars.join(""));

const validSubjectType = fc.constantFrom(...SUBJECT_TYPES);

describe("identifier format — property-based (fast-check)", () => {
  it("round-trips: parse(format(x)) === x for any well-formed parts", () => {
    fc.assert(
      fc.property(validNetwork, validSubjectType, validLocalId, (network, subjectType, localId) => {
        const formatted = formatIdentifier({ network, subjectType, localId });
        expect(parseIdentifier(formatted)).toEqual({ network, subjectType, localId });
      })
    );
  });

  it("round-trips: format(parse(x)) === x for any well-formed identifier string", () => {
    fc.assert(
      fc.property(validNetwork, validSubjectType, validLocalId, (network, subjectType, localId) => {
        const original = `alma:${network}:${subjectType}:${localId}`;
        expect(formatIdentifier(parseIdentifier(original))).toBe(original);
      })
    );
  });

  it("rejects any network not matching the reserved character set", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^[a-z][a-z0-9-]{0,31}$/.test(s)),
        (network) => {
          expect(() => formatIdentifier({ network, subjectType: "agent", localId: "x" })).toThrow(
            AlmaValidationError
          );
        }
      )
    );
  });

  it("rejects any local-id not matching the reserved character set", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^[A-Za-z0-9._-]{1,128}$/.test(s)),
        (localId) => {
          expect(() => formatIdentifier({ network: "main", subjectType: "agent", localId })).toThrow(
            AlmaValidationError
          );
        }
      )
    );
  });

  it("rejects any subject type outside the closed set", () => {
    fc.assert(
      fc.property(
        validNetwork,
        fc.string().filter((s) => canonicalSubjectType(s) === undefined && !s.includes(":")),
        validLocalId,
        (network, subjectType, localId) => {
          expect(() => parseIdentifier(`alma:${network}:${subjectType}:${localId}`)).toThrow(
            AlmaValidationError
          );
        }
      )
    );
  });
});
