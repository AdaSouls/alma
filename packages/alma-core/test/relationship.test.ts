import { describe, expect, it } from "vitest";
import {
  createRelationship,
  wouldCreateDelegationCycle,
  assertNoDelegationCycle,
  findPath,
  hasRelationship,
  type Relationship,
} from "../src/relationship.js";
import { AlmaValidationError } from "../src/errors.js";

const A = "alma:main:agent:a";
const B = "alma:main:agent:b";
const C = "alma:main:agent:c";

describe("createRelationship", () => {
  it("rejects a self-loop", () => {
    expect(() => createRelationship({ from: A, to: A, type: "owns" })).toThrow(AlmaValidationError);
  });

  it("requires sourceRef for evidence-bearing edge types", () => {
    expect(() => createRelationship({ from: A, to: B, type: "hired" })).toThrow(AlmaValidationError);
    expect(() =>
      createRelationship({ from: A, to: B, type: "hired", sourceRef: "eco_123" })
    ).not.toThrow();
  });

  it("does not require sourceRef for structural edges", () => {
    expect(() => createRelationship({ from: A, to: B, type: "owns" })).not.toThrow();
  });
});

describe("delegation cycle detection", () => {
  it("detects a direct cycle", () => {
    const edges: Relationship[] = [createRelationship({ from: A, to: B, type: "delegates" })];
    expect(wouldCreateDelegationCycle(edges, { from: B, to: A, type: "delegates" })).toBe(true);
  });

  it("detects a transitive cycle", () => {
    const edges: Relationship[] = [
      createRelationship({ from: A, to: B, type: "delegates" }),
      createRelationship({ from: B, to: C, type: "delegates" }),
    ];
    expect(wouldCreateDelegationCycle(edges, { from: C, to: A, type: "delegates" })).toBe(true);
    expect(() => assertNoDelegationCycle(edges, { from: C, to: A, type: "delegates" })).toThrow(
      AlmaValidationError
    );
  });

  it("allows a legitimate chain with no cycle", () => {
    const edges: Relationship[] = [createRelationship({ from: A, to: B, type: "delegates" })];
    expect(wouldCreateDelegationCycle(edges, { from: B, to: C, type: "delegates" })).toBe(false);
  });

  it("ignores non-delegates edges entirely", () => {
    const edges: Relationship[] = [
      createRelationship({ from: A, to: B, type: "hired", sourceRef: "eco_1" }),
    ];
    expect(wouldCreateDelegationCycle(edges, { from: B, to: A, type: "hired", sourceRef: "eco_2" })).toBe(
      false
    );
  });
});

describe("graph traversal", () => {
  const edges: Relationship[] = [
    createRelationship({ from: A, to: B, type: "operates" }),
    createRelationship({ from: B, to: C, type: "transacted_with", sourceRef: "eco_1" }),
  ];

  it("finds a direct edge", () => {
    expect(hasRelationship(edges, A, B, ["operates"])).toBe(true);
    expect(hasRelationship(edges, A, C)).toBe(false);
  });

  it("finds a multi-hop path — e.g. 'has any agent my org operates transacted with X'", () => {
    expect(findPath(edges, A, C)).toEqual([A, B, C]);
  });

  it("returns null when no path exists", () => {
    expect(findPath(edges, C, A)).toBeNull();
  });
});
