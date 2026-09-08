import { z } from "zod";
import { AlmaValidationError, unwrap } from "./errors.js";

/**
 * The ALMA relationship graph. Economic actors own, represent, delegate
 * to, operate, transact with, and are hired by one another — see the
 * ALMA whitepaper §5.1.
 */
export const RELATIONSHIP_TYPES = [
  "owns",
  "represents",
  "delegates",
  "operates",
  "member_of",
  "hired",
  "paid",
  "transacted_with",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * hired/paid/transacted_with edges must trace back to a concrete piece of
 * evidence — nothing is asserted into the graph without something that
 * happened to justify it. sourceRef is required at the type level for
 * exactly these three edge types.
 */
const EVIDENCE_REQUIRED_TYPES = new Set<RelationshipType>(["hired", "paid", "transacted_with"]);

export const relationshipSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    type: z.enum(RELATIONSHIP_TYPES),
    timestamp: z.string().datetime(),
    /** An EconomicAction or Delegation id justifying this edge. */
    sourceRef: z.string().min(1).optional(),
  })
  .superRefine((edge, ctx) => {
    if (edge.from === edge.to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "a Subject cannot have this relationship with itself" });
    }
    if (EVIDENCE_REQUIRED_TYPES.has(edge.type) && !edge.sourceRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceRef"],
        message: `"${edge.type}" edges must reference the EconomicAction or event that justifies them`,
      });
    }
  });
export type Relationship = z.infer<typeof relationshipSchema>;

export interface CreateRelationshipInput {
  from: string;
  to: string;
  type: RelationshipType;
  sourceRef?: string;
  timestamp?: string;
}

export function createRelationship(input: CreateRelationshipInput): Relationship {
  return unwrap(
    relationshipSchema.safeParse({
      from: input.from,
      to: input.to,
      type: input.type,
      timestamp: input.timestamp ?? new Date().toISOString(),
      sourceRef: input.sourceRef,
    }),
    "relationship"
  );
}

/**
 * A treasury agent handing a bounded sub-budget to a specialist trading
 * agent is fine; Agent A delegating to Agent B who (transitively)
 * delegates back to Agent A is not. Checks only "delegates" edges.
 */
export function wouldCreateDelegationCycle(existing: Relationship[], candidate: CreateRelationshipInput): boolean {
  if (candidate.type !== "delegates") return false;
  const edges = existing.filter((r) => r.type === "delegates");
  // Does a path already exist from candidate.to back to candidate.from?
  const visited = new Set<string>();
  const stack = [candidate.to];
  while (stack.length) {
    const current = stack.pop()!;
    if (current === candidate.from) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.from === current) stack.push(edge.to);
    }
  }
  return false;
}

export function assertNoDelegationCycle(existing: Relationship[], candidate: CreateRelationshipInput): void {
  if (wouldCreateDelegationCycle(existing, candidate)) {
    throw new AlmaValidationError(
      "relationship.to",
      `adding "${candidate.from} delegates ${candidate.to}" would create a delegation cycle`
    );
  }
}

export function hasRelationship(
  edges: Relationship[],
  from: string,
  to: string,
  types?: RelationshipType[]
): boolean {
  return edges.some(
    (e) => e.from === from && e.to === to && (!types || types.includes(e.type))
  );
}

/**
 * BFS reachability along one or more edge types — e.g. "has any agent my
 * organization operates ever transacted with this counterparty," the
 * exact example from the ALMA spec's counterparty-policy discussion.
 */
export function findPath(
  edges: Relationship[],
  from: string,
  to: string,
  types?: RelationshipType[]
): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (types && !types.includes(e.type)) continue;
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from)!.push(e.to);
  }

  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === to) return path;
    for (const next of adjacency.get(last) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}
