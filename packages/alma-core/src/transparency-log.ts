import { z } from "zod";
import { canonicalJson, fromBase64Url, toBase64Url, toHex } from "./canonical.js";
import { AlmaValidationError, unwrap } from "./errors.js";
import {
  ISSUER_SIGNATURE_ALG,
  agentReportPayloadSchema,
  receiptAttestationPayloadSchema,
  receiptMintPayloadSchema,
  type IssuerKeyset,
  type IssuerSigner,
  type VerifyResult,
} from "./issuer-signature.js";

/**
 * An append-only Merkle log of the issuer's signed envelopes (ADR-021),
 * following RFC 9162 (Certificate Transparency v2) §2.1:
 * leaf = SHA-256(0x00 ‖ data), node = SHA-256(0x01 ‖ left ‖ right),
 * with inclusion and consistency proofs. The issuer signs tree heads with
 * the same key as receipts, and anchors them externally, so removing or
 * reordering an entry breaks a commitment someone else holds.
 *
 * Hashes are 32-byte Uint8Arrays internally and lowercase hex in signed
 * payloads and APIs.
 */

export type Hash = Uint8Array;

const subtle = () => globalThis.crypto.subtle;
const sha256 = async (...parts: Uint8Array[]): Promise<Hash> => {
  const buf = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    buf.set(p, o);
    o += p.length;
  }
  return new Uint8Array(await subtle().digest("SHA-256", buf));
};
const LEAF = Uint8Array.of(0x00);
const NODE = Uint8Array.of(0x01);

export const hashLeaf = (data: Uint8Array): Promise<Hash> => sha256(LEAF, data);
export const hashChildren = (left: Hash, right: Hash): Promise<Hash> => sha256(NODE, left, right);

export function hexToHash(hex: string): Hash {
  if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error("hash must be 64 lowercase hex characters");
  return Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16));
}
export const hashToHex = (h: Hash): string => toHex(h);
const equal = (a: Hash, b: Hash) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---------- Leaves ----------

const envelopeSchema = z.object({ payload: z.unknown(), alg: z.literal(ISSUER_SIGNATURE_ALG), sig: z.string() }).strict();

/**
 * The bytes a signed envelope is logged as: JCS of { alg, payload, sig }
 * with the payload canonicalized too. Committing to the signature means
 * only holders of the envelope can compute its leaf -- a published leaf
 * hash says nothing about a receipt's contents.
 */
export function envelopeLeafData(envelope: unknown): Uint8Array {
  const env = unwrap(envelopeSchema.safeParse(envelope), "envelope");
  // Each payload type has its own `t`, so at most one schema accepts it.
  const known = [receiptMintPayloadSchema, receiptAttestationPayloadSchema, agentReportPayloadSchema] as const;
  let payload: Record<string, string> | undefined;
  for (const schema of known) {
    const parsed = schema.safeParse(env.payload);
    if (parsed.success) payload = parsed.data;
  }
  if (payload === undefined) throw new AlmaValidationError("envelope.payload", "must be a receipt mint, a receipt attestation or an agent report");
  if (!fromBase64Url(env.sig)) throw new Error("envelope.sig: must be base64url");
  return new TextEncoder().encode(`{"alg":${JSON.stringify(env.alg)},"payload":${canonicalJson(payload)},"sig":${JSON.stringify(env.sig)}}`);
}

export const envelopeLeafHash = (envelope: unknown): Promise<Hash> => hashLeaf(envelopeLeafData(envelope));

// ---------- Tree (RFC 9162 §2.1.1) ----------

/** Largest power of two strictly less than n (n > 1). */
const split = (n: number) => 2 ** Math.floor(Math.log2(n - 1));

/** MTH over leaf hashes. The empty tree's hash is SHA-256 of nothing. */
export async function merkleRoot(leaves: Hash[]): Promise<Hash> {
  if (leaves.length === 0) return sha256();
  if (leaves.length === 1) return leaves[0];
  const k = split(leaves.length);
  return hashChildren(await merkleRoot(leaves.slice(0, k)), await merkleRoot(leaves.slice(k)));
}

/**
 * The right edge of the tree: roots of its maximal perfect subtrees, left
 * to right. Enough to append leaves and compute the root without reading
 * the whole log, so the sequencer stores it with each tree head.
 */
export interface Frontier {
  size: number;
  /** Subtree roots, largest (leftmost) first; their sizes are the set bits of `size`. */
  nodes: Hash[];
}

export const emptyFrontier = (): Frontier => ({ size: 0, nodes: [] });

export async function appendToFrontier(frontier: Frontier, leaf: Hash): Promise<Frontier> {
  const nodes = [...frontier.nodes, leaf];
  let size = frontier.size;
  // Each trailing 1-bit of the old size is a same-sized subtree to merge with.
  while (size & 1) {
    const right = nodes.pop()!;
    const left = nodes.pop()!;
    nodes.push(await hashChildren(left, right));
    size >>= 1;
  }
  return { size: frontier.size + 1, nodes };
}

export async function frontierRoot(frontier: Frontier): Promise<Hash> {
  if (frontier.size === 0) return sha256();
  let h = frontier.nodes[frontier.nodes.length - 1];
  for (let i = frontier.nodes.length - 2; i >= 0; i--) h = await hashChildren(frontier.nodes[i], h);
  return h;
}

// ---------- Inclusion (RFC 9162 §2.1.3) ----------

/** PATH(m, D[n]): the audit path for the leaf at `index`. */
export async function inclusionProof(leaves: Hash[], index: number): Promise<Hash[]> {
  if (!Number.isInteger(index) || index < 0 || index >= leaves.length) throw new Error("index out of range");
  if (leaves.length === 1) return [];
  const k = split(leaves.length);
  return index < k
    ? [...(await inclusionProof(leaves.slice(0, k), index)), await merkleRoot(leaves.slice(k))]
    : [...(await inclusionProof(leaves.slice(k), index - k)), await merkleRoot(leaves.slice(0, k))];
}

/**
 * RFC 9162 §2.1.3.2. `treeSize` and `root` must come together from a
 * verified tree head: the path alone doesn't authenticate the size.
 */
export async function verifyInclusion(leaf: Hash, index: number, treeSize: number, proof: Hash[], root: Hash): Promise<boolean> {
  if (!Number.isInteger(index) || !Number.isInteger(treeSize) || index < 0 || index >= treeSize) return false;
  let fn = index;
  let sn = treeSize - 1;
  let r = leaf;
  for (const p of proof) {
    if (sn === 0) return false;
    if (fn & 1 || fn === sn) {
      r = await hashChildren(p, r);
      if (!(fn & 1)) {
        while (!(fn & 1) && fn !== 0) {
          fn >>= 1;
          sn >>= 1;
        }
      }
    } else {
      r = await hashChildren(r, p);
    }
    fn >>= 1;
    sn >>= 1;
  }
  return sn === 0 && equal(r, root);
}

// ---------- Consistency (RFC 9162 §2.1.4) ----------

async function subproof(m: number, leaves: Hash[], complete: boolean): Promise<Hash[]> {
  const n = leaves.length;
  if (m === n) return complete ? [] : [await merkleRoot(leaves)];
  const k = split(n);
  return m <= k
    ? [...(await subproof(m, leaves.slice(0, k), complete)), await merkleRoot(leaves.slice(k))]
    : [...(await subproof(m - k, leaves.slice(k), false)), await merkleRoot(leaves.slice(0, k))];
}

/** PROOF(m, D[n]): proves the tree of size m is a prefix of the tree of all `leaves`. */
export async function consistencyProof(leaves: Hash[], m: number): Promise<Hash[]> {
  if (!Number.isInteger(m) || m < 0 || m > leaves.length) throw new Error("size out of range");
  if (m === 0 || m === leaves.length) return [];
  return subproof(m, leaves, true);
}

/** RFC 9162 §2.1.4.2. Sizes 0 and m = n need an empty proof and (for m = n) equal roots. */
export async function verifyConsistency(m: number, n: number, oldRoot: Hash, newRoot: Hash, proof: Hash[]): Promise<boolean> {
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 0 || m > n) return false;
  if (m === 0) return proof.length === 0;
  if (m === n) return proof.length === 0 && equal(oldRoot, newRoot);
  if (proof.length === 0) return false;
  const path = (m & (m - 1)) === 0 ? [oldRoot, ...proof] : proof;
  if (path.length === 0) return false;
  let fn = m - 1;
  let sn = n - 1;
  while (fn & 1) {
    fn >>= 1;
    sn >>= 1;
  }
  let fr = path[0];
  let sr = path[0];
  for (const c of path.slice(1)) {
    if (sn === 0) return false;
    if (fn & 1 || fn === sn) {
      fr = await hashChildren(c, fr);
      sr = await hashChildren(c, sr);
      if (!(fn & 1)) {
        while (!(fn & 1) && fn !== 0) {
          fn >>= 1;
          sn >>= 1;
        }
      }
    } else {
      sr = await hashChildren(sr, c);
    }
    fn >>= 1;
    sn >>= 1;
  }
  return sn === 0 && equal(fr, oldRoot) && equal(sr, newRoot);
}

// ---------- Signed tree heads ----------

export const TREE_HEAD_TYPE = "alma-log-sth/1";

const ascii = z.string().min(1).regex(/^[\x20-\x7e]*$/, "must be printable ASCII");
export const treeHeadPayloadSchema = z
  .object({
    t: z.literal(TREE_HEAD_TYPE),
    iss: ascii,
    kid: z.string().regex(/^ed25519-[0-9a-f]{32}$/),
    /** Which log, e.g. "adasouls-receipts-mainnet": a head can't be replayed onto another log. */
    log: z.string().regex(/^[a-z0-9][-a-z0-9]{0,63}$/, "must be a lowercase log name"),
    treeSize: z.string().regex(/^(0|[1-9][0-9]{0,15})$/, "must be a non-negative integer"),
    rootHash: z.string().regex(/^[0-9a-f]{64}$/),
    timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  })
  .strict();
export type TreeHeadPayload = z.infer<typeof treeHeadPayloadSchema>;

export interface TreeHead {
  payload: TreeHeadPayload;
  alg: typeof ISSUER_SIGNATURE_ALG;
  sig: string;
}

export async function signTreeHead(
  signer: IssuerSigner,
  input: { iss: string; log: string; treeSize: number; rootHash: Hash; timestamp?: Date }
): Promise<TreeHead> {
  const payload = unwrap(
    treeHeadPayloadSchema.safeParse({
      t: TREE_HEAD_TYPE,
      iss: input.iss,
      kid: signer.kid,
      log: input.log,
      treeSize: String(input.treeSize),
      rootHash: hashToHex(input.rootHash),
      timestamp: (input.timestamp ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z"),
    }),
    "treeHead"
  );
  const sig = await signer.sign(new TextEncoder().encode(canonicalJson(payload)));
  if (sig.length !== 64) throw new Error(`signer ${signer.kid} returned a ${sig.length}-byte signature, expected 64`);
  return { payload, alg: ISSUER_SIGNATURE_ALG, sig: toBase64Url(sig) };
}

/** Checks the signature by a trusted key of the named issuer, and (optionally) which log it's for. */
export async function verifyTreeHead(head: unknown, keyset: IssuerKeyset, log?: string): Promise<VerifyResult<{ log: string; treeSize: number; rootHash: Hash; timestamp: string }>> {
  const shape = z.object({ payload: z.unknown(), alg: z.literal(ISSUER_SIGNATURE_ALG), sig: z.string() }).strict().safeParse(head);
  if (!shape.success) return { ok: false, reason: "malformed tree head" };
  const parsed = treeHeadPayloadSchema.safeParse(shape.data.payload);
  if (!parsed.success) return { ok: false, reason: "malformed tree head payload" };
  const p = parsed.data;
  if (log !== undefined && p.log !== log) return { ok: false, reason: `tree head is for log ${p.log}, not ${log}` };
  const key = keyset.get(p.kid);
  if (!key) return { ok: false, reason: `untrusted key ${p.kid}` };
  if (key.iss !== p.iss) return { ok: false, reason: `key ${key.kid} does not sign for ${p.iss}` };
  const sig = fromBase64Url(shape.data.sig);
  if (!sig || sig.length !== 64) return { ok: false, reason: "malformed signature" };
  const valid = await subtle().verify({ name: "Ed25519" }, key.cryptoKey, new Uint8Array(sig), new TextEncoder().encode(canonicalJson(p)));
  if (!valid) return { ok: false, reason: "bad signature" };
  const treeSize = Number(p.treeSize);
  if (!Number.isSafeInteger(treeSize)) return { ok: false, reason: "tree size too large" };
  return { ok: true, payload: { log: p.log, treeSize, rootHash: hexToHash(p.rootHash), timestamp: p.timestamp } };
}
