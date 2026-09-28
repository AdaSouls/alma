/**
 * RFC 8785 (JCS) for a flat object of printable-ASCII strings: keys sorted
 * by UTF-16 code units, no whitespace, JSON string escaping. Callers
 * validate the shape first; with those values JCS reduces to this.
 */
export function canonicalJson(value: Record<string, string>): string {
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(value[k])}`).join(",")}}`;
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
