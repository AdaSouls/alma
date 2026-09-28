import { AlmaValidationError } from "./errors.js";

/**
 * ALMA v1's Subject types are a closed set — adding a fourth is a spec
 * version bump, not something an implementation should extend locally.
 * See spec/alma-v1/00-identity-model.md.
 */
export const SUBJECT_TYPES = ["human", "organization", "agent"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

/**
 * Short forms accepted in the `<subject-type>` segment. `org` is the form used on-chain by
 * AlmaAnchorRegistry (`alma:main:org:<slug>`) and by ALDEA World; it denotes the same Subject type as
 * `organization`. Identifiers are immutable, so the segment is preserved exactly as written: parsing
 * normalizes `subjectType` to the canonical type and records the literal in `subjectTypeSegment`.
 */
export const SUBJECT_TYPE_ALIASES = { org: "organization" } as const satisfies Record<string, SubjectType>;
export type SubjectTypeSegment = SubjectType | keyof typeof SUBJECT_TYPE_ALIASES;

export interface ParsedIdentifier {
  network: string;
  /** Canonical Subject type (`org` is reported as `organization`). */
  subjectType: SubjectType;
  localId: string;
  /** The literal segment, present only when an alias such as `org` was used. */
  subjectTypeSegment?: SubjectTypeSegment;
}

/** Canonical Subject type for a segment (`org` → `organization`), or undefined if it is not valid. */
export function canonicalSubjectType(segment: string): SubjectType | undefined {
  if ((SUBJECT_TYPES as readonly string[]).includes(segment)) return segment as SubjectType;
  return SUBJECT_TYPE_ALIASES[segment as keyof typeof SUBJECT_TYPE_ALIASES];
}

const NETWORK_RE = /^[a-z][a-z0-9-]{0,31}$/;
const LOCAL_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * alma:<network>:<subject-type>:<local-id>
 *
 * <network> is a namespace, not a blockchain. <local-id> is
 * implementation-defined; ALMA only requires it be unique within
 * <network> and, once issued, immutable — enforcing that uniqueness is a
 * storage-layer concern (out of scope for this package).
 */
export function formatIdentifier(parts: ParsedIdentifier): string {
  const segment = parts.subjectTypeSegment ?? parts.subjectType;
  assertValidNetwork(parts.network);
  assertValidSubjectType(segment);
  if (canonicalSubjectType(segment) !== parts.subjectType) {
    throw new AlmaValidationError(
      "identifier.subjectType",
      `segment "${segment}" does not denote subject type "${parts.subjectType}"`
    );
  }
  assertValidLocalId(parts.localId);
  return `alma:${parts.network}:${segment}:${parts.localId}`;
}

export function parseIdentifier(id: string): ParsedIdentifier {
  if (typeof id !== "string" || id.length === 0) {
    throw new AlmaValidationError("identifier", "must be a non-empty string");
  }
  const segments = id.split(":");
  if (segments.length !== 4 || segments[0] !== "alma") {
    throw new AlmaValidationError(
      "identifier",
      `must have the shape "alma:<network>:<subject-type>:<local-id>", got "${id}"`
    );
  }
  const [, network, segment, localId] = segments;
  assertValidNetwork(network);
  assertValidSubjectType(segment);
  assertValidLocalId(localId);
  const subjectType = canonicalSubjectType(segment) as SubjectType;
  return segment === subjectType
    ? { network, subjectType, localId }
    : { network, subjectType, localId, subjectTypeSegment: segment as SubjectTypeSegment };
}

export function isValidIdentifier(id: string): boolean {
  try {
    parseIdentifier(id);
    return true;
  } catch {
    return false;
  }
}

function assertValidNetwork(network: string): asserts network is string {
  if (!NETWORK_RE.test(network)) {
    throw new AlmaValidationError(
      "identifier.network",
      `must match ${NETWORK_RE} (lowercase letters, digits, hyphens, starting with a letter), got "${network}"`
    );
  }
}

function assertValidSubjectType(subjectType: string): asserts subjectType is SubjectTypeSegment {
  if (canonicalSubjectType(subjectType) === undefined) {
    throw new AlmaValidationError(
      "identifier.subjectType",
      `must be one of ${[...SUBJECT_TYPES, ...Object.keys(SUBJECT_TYPE_ALIASES)].join(", ")}, got "${subjectType}"`
    );
  }
}

function assertValidLocalId(localId: string): asserts localId is string {
  if (!LOCAL_ID_RE.test(localId)) {
    throw new AlmaValidationError(
      "identifier.localId",
      `must match ${LOCAL_ID_RE} (1-128 chars: letters, digits, ".", "_", "-"), got "${localId}"`
    );
  }
}

/** A short, URL-safe random local-id. Callers own uniqueness within a network. */
export function randomLocalId(length = 10): string {
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz"; // Crockford-ish, no ambiguous chars
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** A human-legible local-id derived from a display name, e.g. "Acme Labs" -> "acme-labs". */
export function slugifyLocalId(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new AlmaValidationError("localId", `could not derive a local-id from "${text}"`);
  }
  return slug.slice(0, 128);
}
