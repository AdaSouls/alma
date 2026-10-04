/**
 * RFC 8785 (JCS) for a flat object of printable-ASCII strings: keys sorted
 * by UTF-16 code units, no whitespace, JSON string escaping. Callers
 * validate the shape first; with those values JCS reduces to this.
 */
export function canonicalJson(value: Record<string, string>): string {
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(value[k])}`).join(",")}}`;
}

/**
 * RFC 8785 (JCS) for any JSON value: object keys sorted by UTF-16 code
 * units, no whitespace, and numbers and strings as ECMAScript
 * serializes them (which is what JCS specifies). Two parties holding the
 * same JSON value get the same bytes, whatever order or spacing it
 * arrived in. Rejects what JSON can't carry (undefined, functions,
 * NaN, Infinity), rather than letting JSON.stringify turn it into
 * something else.
 */
export function canonicalJsonValue(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("a canonical JSON value can't hold NaN or Infinity");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJsonValue).join(",")}]`;
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJsonValue(object[k])}`)
      .join(",")}}`;
  }
  throw new Error(`a canonical JSON value can't hold a ${typeof value}`);
}

/** SHA-256 of a JSON value's canonical bytes, lowercase hex: a commitment to it that reveals nothing of it. */
export async function jsonDigest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJsonValue(value));
  return toHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)));
}

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** Unpadded base64url (RFC 4648 §5). No Buffer, so it runs in browsers too. */
export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Strict: rejects padding, standard-alphabet characters and impossible lengths instead of guessing. */
export function fromBase64Url(text: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return undefined;
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "="));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return toBase64Url(bytes) === text ? bytes : undefined;
}
