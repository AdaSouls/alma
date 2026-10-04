import { describe, expect, it } from "vitest";
import {
  AlmaValidationError,
  LocalSigner,
  createIssuerKeyset,
  envelopeLeafData,
  envelopeLeafHash,
  hashToHex,
  signAgentReport,
  signReceiptMint,
  verifyAgentReport,
  verifyReceiptMint,
  type SignAgentReportInput,
} from "../src/index.js";
import { canonicalJson, toBase64Url } from "../src/canonical.js";

const at = new Date("2026-10-04T12:00:00.789Z");
const cost: SignAgentReportInput = {
  iss: "adasouls",
  report: "arp_1",
  agent: "alma:main:agent:a1b2c3d4e5",
  about: "action",
  ref: "ea_1",
  metric: "compute_cost",
  value: "0.0421",
  unit: "USD",
  reportedAt: at,
};

async function setup() {
  const signer = await LocalSigner.generate();
  const keyset = await createIssuerKeyset([{ iss: "adasouls", publicKey: toBase64Url(signer.publicKey) }]);
  return { signer, keyset };
}

describe("agent reports", () => {
  it("signs a flat canonical payload that names the agent, the subject and the figure", async () => {
    const { signer, keyset } = await setup();
    const env = await signAgentReport(signer, cost);
    expect(canonicalJson(env.payload)).toBe(
      `{"about":"action","agent":"alma:main:agent:a1b2c3d4e5","iss":"adasouls","kid":"${signer.kid}","metric":"compute_cost",` +
        `"ref":"ea_1","report":"arp_1","reportedAt":"2026-10-04T12:00:00Z","t":"alma-agent-report/1","unit":"USD","value":"0.0421"}`
    );
    const v = await verifyAgentReport(env, keyset);
    expect(v.ok && v.payload.value).toBe("0.0421");
  });

  it("a metric without a unit has no unit key at all", async () => {
    const { signer, keyset } = await setup();
    const env = await signAgentReport(signer, { ...cost, metric: "input_tokens", value: "1820", unit: undefined });
    expect("unit" in env.payload).toBe(false);
    expect((await verifyAgentReport(env, keyset)).ok).toBe(true);
    const model = await signAgentReport(signer, { ...cost, metric: "model", value: "claude-sonnet-5", unit: undefined });
    expect("unit" in model.payload).toBe(false);
  });

  it("rejects values and units that don't fit the metric, and unknown metrics", async () => {
    const { signer } = await setup();
    const bad: Partial<SignAgentReportInput>[] = [
      { value: "1,5" },
      { value: "-1" },
      { value: "01.5" },
      { value: "1.", },
      { unit: undefined },
      { unit: "usd" },
      { metric: "input_tokens", value: "12" }, // unit present
      { metric: "input_tokens", value: "1.5", unit: undefined },
      { metric: "model", value: " leading-space", unit: undefined },
      { metric: "model", value: "x".repeat(129), unit: undefined },
      { metric: "reasoning_quality" as never, value: "9", unit: undefined },
      { about: "receipt" as never },
      { agent: "agént" },
    ];
    for (const change of bad) await expect(signAgentReport(signer, { ...cost, ...change })).rejects.toThrow(AlmaValidationError);
  });

  it("any edit breaks the signature; another issuer's or an untrusted key doesn't verify", async () => {
    const { signer, keyset } = await setup();
    const env = await signAgentReport(signer, cost);
    for (const change of [{ value: "0.0001" }, { agent: "alma:main:agent:zzzzzzzzzz" }, { ref: "ea_2" }, { reportedAt: "2025-01-01T00:00:00Z" }]) {
      const v = await verifyAgentReport({ ...env, payload: { ...env.payload, ...change } }, keyset);
      expect(v).toEqual({ ok: false, reason: "bad signature" });
    }
    const other = await LocalSigner.generate();
    expect(await verifyAgentReport(await signAgentReport(other, cost), keyset)).toEqual({ ok: false, reason: `untrusted key ${other.kid}` });
    expect((await verifyAgentReport(await signAgentReport(signer, { ...cost, iss: "someone-else" }), keyset)).ok).toBe(false);
  });

  it("is its own envelope type: a report never verifies as a receipt mint, nor a mint as a report", async () => {
    const { signer, keyset } = await setup();
    const report = await signAgentReport(signer, cost);
    const mint = await signReceiptMint(signer, { iss: "adasouls", receipt: "rcp_1", digest: "a".repeat(64), independent: true, signedAt: at });
    expect(await verifyReceiptMint(report, keyset)).toEqual({ ok: false, reason: "malformed payload" });
    expect(await verifyAgentReport(mint, keyset)).toEqual({ ok: false, reason: "malformed payload" });
  });

  it("can be logged: its leaf is canonical and commits to the signature", async () => {
    const { signer } = await setup();
    const env = await signAgentReport(signer, cost);
    const data = new TextDecoder().decode(envelopeLeafData(env));
    expect(data.startsWith('{"alg":"Ed25519","payload":{"about":"action"')).toBe(true);
    expect(data.endsWith(`"sig":"${env.sig}"}`)).toBe(true);
    const reordered = { sig: env.sig, payload: Object.fromEntries(Object.entries(env.payload).reverse()), alg: env.alg };
    expect(hashToHex(await envelopeLeafHash(reordered))).toBe(hashToHex(await envelopeLeafHash(env)));
    expect(() => envelopeLeafData({ ...env, payload: { ...env.payload, t: "alma-something/1" } })).toThrow(AlmaValidationError);
    expect(() => envelopeLeafData({ ...env, payload: { ...env.payload, extra: "1" } })).toThrow(AlmaValidationError);
  });
});
