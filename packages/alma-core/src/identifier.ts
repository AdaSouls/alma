import { AlmaValidationError } from "./errors.js";

/**
 * ALMA v1's Subject types are a closed set — adding a fourth is a spec
 * version bump, not something an implementation should extend locally.
 * See spec/alma-v1/00-identity-model.md.
 */
export const SUBJECT_TYPES = ["human", "organization", "agent"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export interface ParsedIdentifier {
  network: string;
  subjectType: SubjectType;
  localId: string;
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
  assertValidNetwork(parts.network);
  assertValidSubjectType(parts.subjectType);
  assertValidLocalId(parts.localId);
  return `alma:${parts.network}:${parts.subjectType}:${parts.localId}`;
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
  const [, network, subjectType, localId] = segments;
  assertValidNetwork(network);
  assertValidSubjectType(subjectType);
  assertValidLocalId(localId);
  return { network, subjectType: subjectType as SubjectType, localId };
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

function assertValidSubjectType(subjectType: string): asserts subjectType is SubjectType {
  if (!SUBJECT_TYPES.includes(subjectType as SubjectType)) {
    throw new AlmaValidationError(
      "identifier.subjectType",
      `must be one of ${SUBJECT_TYPES.join(", ")}, got "${subjectType}"`
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
