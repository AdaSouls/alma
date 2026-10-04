import { describe, expect, it } from "vitest";
import {
  AlmaValidationError,
  LocalSigner,
  canonicalJsonValue,
  createIssuerKeyset,
  envelopeLeafData,
  envelopeLeafHash,
  hashToHex,
  jsonDigest,
  signJobDelivery,
  verifyAgentReport,
  verifyJobDelivery,
  type SignJobDeliveryInput,
} from "../src/index.js";
import { canonicalJson, toBase64Url } from "../src/canonical.js";

const result = { risk: "low", findings: [{ id: 2, note: "ok" }], score: 0.75, reviewed: true, by: null };

async function setup() {
  const signer = await LocalSigner.generate();
  const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(signer.publicKey) }]);
  const input: SignJobDeliveryInput = {
    iss: "adasouls",
    job: "job_1",
    seller: "alma:main:agent:seller0001",
    service: "assess-risk",
    action: "eco_1",
    resultDigest: await jsonDigest(result),
    deliveredAt: new Date("2026-10-05T12:00:00.321Z"),
  };
  return { signer, keyset, input };
}

describe("canonical JSON for any value", () => {
  it("is the same bytes whatever order or spacing the value arrived in", async () => {
    const a = JSON.parse('{"b":[1,{"z":1,"a":2}],"a":"x"}');
    const b = JSON.parse(' { "a" : "x", "b" : [ 1, { "a" : 2, "z" : 1 } ] } ');
    expect(canonicalJsonValue(a)).toBe('{"a":"x","b":[1,{"a":2,"z":1}]}');
    expect(canonicalJsonValue(b)).toBe(canonicalJsonValue(a));
    expect(await jsonDigest(a)).toBe(await jsonDigest(b));
    // Array order is meaning, not formatting.
    expect(await jsonDigest([1, 2])).not.toBe(await jsonDigest([2, 1]));
  });

  it("serializes numbers and strings as ECMAScript does (RFC 8785), and agrees with the flat form", () => {
    expect(canonicalJsonValue({ n: [1.0, 1e21, 0.1, -0, 100] })).toBe('{"n":[1,1e+21,0.1,0,100]}');
    expect(canonicalJsonValue({ s: 'é"\n€' })).toBe('{"s":"é\\"\\n€"}');
    expect(canonicalJsonValue(null)).toBe("null");
    const flat = { t: "x", iss: "adasouls", kid: "k" };
    expect(canonicalJsonValue(flat)).toBe(canonicalJson(flat));
  });

  it("refuses what JSON can't carry instead of changing it", () => {
    for (const bad of [undefined, Number.NaN, Number.POSITIVE_INFINITY, () => 1, { a: undefined }, [1n]]) expect(() => canonicalJsonValue(bad)).toThrow();
  });
});

describe("job deliveries", () => {
  it("signs who delivered which job, and a digest of the result, never the result or the buyer", async () => {
    const { signer, keyset, input } = await setup();
    const env = await signJobDelivery(signer, input);
    expect(canonicalJson(env.payload)).toBe(
      `{"action":"eco_1","deliveredAt":"2026-10-05T12:00:00Z","iss":"adasouls","job":"job_1","kid":"${signer.kid}",` +
        `"resultDigest":"${input.resultDigest}","seller":"alma:main:agent:seller0001","service":"assess-risk","t":"alma-job-delivery/1"}`
    );
    const v = await verifyJobDelivery(env, keyset);
    expect(v.ok && v.payload.resultDigest).toBe(await jsonDigest(result));
    // The same result, reordered, is the one delivered; a changed one isn't.
    expect(await jsonDigest({ by: null, reviewed: true, score: 0.75, findings: [{ note: "ok", id: 2 }], risk: "low" })).toBe(input.resultDigest);
    expect(await jsonDigest({ ...result, risk: "high" })).not.toBe(input.resultDigest);
  });

  it("any edit breaks it, an untrusted key doesn't verify, and it is its own envelope type", async () => {
    const { signer, keyset, input } = await setup();
    const env = await signJobDelivery(signer, input);
    for (const change of [{ seller: "alma:main:agent:someoneelse" }, { resultDigest: "0".repeat(64) }, { job: "job_2" }, { deliveredAt: "2020-01-01T00:00:00Z" }]) {
      expect(await verifyJobDelivery({ ...env, payload: { ...env.payload, ...change } }, keyset)).toEqual({ ok: false, reason: "bad signature" });
    }
    const other = await LocalSigner.generate();
    expect(await verifyJobDelivery(await signJobDelivery(other, input), keyset)).toEqual({ ok: false, reason: `untrusted key ${other.kid}` });
    expect(await verifyAgentReport(env, keyset)).toEqual({ ok: false, reason: "malformed payload" });
    await expect(signJobDelivery(signer, { ...input, resultDigest: "not-a-digest" })).rejects.toThrow(AlmaValidationError);
    await expect(signJobDelivery(signer, { ...input, service: "x".repeat(65) })).rejects.toThrow(AlmaValidationError);
  });

  it("can be logged: its leaf is canonical and commits to the signature", async () => {
    const { signer, input } = await setup();
    const env = await signJobDelivery(signer, input);
    const data = new TextDecoder().decode(envelopeLeafData(env));
    expect(data.startsWith('{"alg":"Ed25519","payload":{"action":"eco_1"')).toBe(true);
    const reordered = { sig: env.sig, payload: Object.fromEntries(Object.entries(env.payload).reverse()), alg: env.alg };
    expect(hashToHex(await envelopeLeafHash(reordered))).toBe(hashToHex(await envelopeLeafHash(env)));
  });
});
