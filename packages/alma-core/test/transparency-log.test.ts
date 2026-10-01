import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  LocalSigner,
  appendToFrontier,
  consistencyProof,
  createIssuerKeyset,
  emptyFrontier,
  envelopeLeafData,
  envelopeLeafHash,
  frontierRoot,
  hashChildren,
  hashLeaf,
  hashToHex,
  inclusionProof,
  merkleRoot,
  signReceiptMint,
  signTreeHead,
  verifyConsistency,
  verifyInclusion,
  verifyTreeHead,
  type Hash,
} from "../src/index.js";
import { toBase64Url } from "../src/canonical.js";

const hex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], (b) => parseInt(b, 16));
const leavesOf = (datas: Uint8Array[]) => Promise.all(datas.map(hashLeaf));

/** Reference: the textbook recursion, nothing shared with the code under test but hashLeaf/hashChildren. */
async function naiveRoot(leaves: Hash[]): Promise<Hash> {
  if (leaves.length === 1) return leaves[0];
  let k = 1;
  while (k * 2 < leaves.length) k *= 2;
  return hashChildren(await naiveRoot(leaves.slice(0, k)), await naiveRoot(leaves.slice(k)));
}

// Leaf inputs from the Certificate Transparency reference test data (RFC 6962 / 9162 hashing).
const CT_INPUTS = ["", "00", "10", "2021", "3031", "40414243", "5051525354555657", "606162636465666768696a6b6c6d6e6f"].map(hex);

describe("transparency log (RFC 9162 hashing)", () => {
  it("matches known answers: empty tree, one empty leaf, and the 8-leaf CT reference tree", async () => {
    expect(hashToHex(await merkleRoot([]))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(hashToHex(await merkleRoot(await leavesOf([new Uint8Array()])))).toBe("6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d");
    expect(hashToHex(await merkleRoot(await leavesOf(CT_INPUTS)))).toBe("5dc9da79a70659a9ad559cb701ded9a2ab9d823aad2f4960cfe370eff4604328");
  });

  it("a leaf can never pass as an inner node (domain-separated prefixes)", async () => {
    const [a, b] = await leavesOf([hex("01"), hex("02")]);
    const asLeaf = await hashLeaf(new Uint8Array([...a, ...b]));
    expect(hashToHex(asLeaf)).not.toBe(hashToHex(await hashChildren(a, b)));
  });

  it("property: root, frontier, inclusion and consistency agree for every size and position", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.uint8Array({ maxLength: 8 }), { minLength: 1, maxLength: 33 }), async (datas) => {
        const leaves = await leavesOf(datas);
        const n = leaves.length;
        const root = await merkleRoot(leaves);
        expect(hashToHex(root)).toBe(hashToHex(await naiveRoot(leaves)));

        let f = emptyFrontier();
        const roots: Hash[] = [];
        for (const leaf of leaves) {
          f = await appendToFrontier(f, leaf);
          roots.push(await frontierRoot(f));
        }
        expect(hashToHex(roots[n - 1])).toBe(hashToHex(root));

        for (let i = 0; i < n; i++) {
          const proof = await inclusionProof(leaves, i);
          expect(await verifyInclusion(leaves[i], i, n, proof, root)).toBe(true);
          expect(await verifyInclusion(await hashLeaf(new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9, 9])), i, n, proof, root)).toBe(false);
        }
        for (let m = 1; m <= n; m++) {
          const proof = await consistencyProof(leaves, m);
          expect(await verifyConsistency(m, n, roots[m - 1], root, proof)).toBe(true);
          if (m < n) {
            const bogus = await hashLeaf(new Uint8Array([9, 9, 9]));
            expect(await verifyConsistency(m, n, bogus, root, proof)).toBe(false);
          }
        }
      }),
      { numRuns: 40 }
    );
  });

  it("rejects proofs for the wrong leaf, index, size or root", async () => {
    const leaves = await leavesOf(CT_INPUTS);
    const root = await merkleRoot(leaves);
    const proof = await inclusionProof(leaves, 5);
    expect(await verifyInclusion(leaves[5], 5, 8, proof, root)).toBe(true);
    expect(await verifyInclusion(leaves[4], 5, 8, proof, root)).toBe(false);
    expect(await verifyInclusion(leaves[5], 4, 8, proof, root)).toBe(false);
    // (The size isn't authenticated by the path itself -- size and root must come together from a verified tree head.)
    expect(await verifyInclusion(leaves[5], 5, 8, proof.slice(1), root)).toBe(false);
    expect(await verifyInclusion(leaves[5], 8, 8, proof, root)).toBe(false);
    const old = await merkleRoot(leaves.slice(0, 3));
    expect(await verifyConsistency(3, 8, old, root, await consistencyProof(leaves, 3))).toBe(true);
    expect(await verifyConsistency(3, 8, old, root, [])).toBe(false);
    expect(await verifyConsistency(4, 8, old, root, await consistencyProof(leaves, 3))).toBe(false);
    // A rolled-back or rewritten history: the old tree isn't a prefix.
    const rewritten = [...leaves.slice(0, 2), await hashLeaf(hex("ff")), ...leaves.slice(3)];
    expect(await verifyConsistency(3, 8, old, await merkleRoot(rewritten), await consistencyProof(rewritten, 3))).toBe(false);
  });

  it("envelope leaves commit to the signature and are canonical", async () => {
    const signer = await LocalSigner.generate();
    const env = await signReceiptMint(signer, { iss: "adasouls", receipt: "rcp_1", digest: "a".repeat(64), independent: true });
    const data = new TextDecoder().decode(envelopeLeafData(env));
    expect(data.startsWith('{"alg":"Ed25519","payload":{"digest":')).toBe(true);
    expect(data.endsWith(`"sig":"${env.sig}"}`)).toBe(true);
    const reordered = JSON.parse(JSON.stringify({ sig: env.sig, payload: Object.fromEntries(Object.entries(env.payload).reverse()), alg: env.alg }));
    expect(hashToHex(await envelopeLeafHash(reordered))).toBe(hashToHex(await envelopeLeafHash(env)));
    expect(() => envelopeLeafData({ ...env, extra: 1 })).toThrow();
  });

  it("signed tree heads verify only for the right key, issuer and log", async () => {
    const signer = await LocalSigner.generate();
    const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(signer.publicKey) }]);
    const rootHash = await merkleRoot(await leavesOf(CT_INPUTS));
    const head = await signTreeHead(signer, { iss: "adasouls", log: "adasouls-receipts-mock", treeSize: 8, rootHash });
    const v = await verifyTreeHead(head, keyset, "adasouls-receipts-mock");
    expect(v.ok && v.payload.treeSize).toBe(8);
    expect((await verifyTreeHead(head, keyset, "adasouls-receipts-mainnet")).ok).toBe(false);
    expect((await verifyTreeHead({ ...head, payload: { ...head.payload, treeSize: "9" } }, keyset)).ok).toBe(false);
    const other = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url((await LocalSigner.generate()).publicKey) }]);
    expect((await verifyTreeHead(head, other)).ok).toBe(false);
  });
});
