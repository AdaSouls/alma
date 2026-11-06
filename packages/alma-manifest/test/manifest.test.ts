import { describe, expect, it } from "vitest";
import { AlmaValidationError } from "@adasouls/alma-core";
import { parseManifestYaml, compileManifest, buildManifest, stringifyManifest, agentManifestSchema, GOVERNANCE_ACTION_TYPES } from "../src/index.js";

const treasuryAgentYaml = `
kind: Agent
version: alma/v1
metadata:
  name: treasury-agent
identity:
  type: agent
capabilities:
  - pay
authority:
  maxTransaction:
    USDC: "1000"
counterpartyPolicy:
  minCompletedTransactions: 1
integrations:
  wallet: crossmint
  chain: base
`;

describe("parseManifestYaml", () => {
  it("parses the documented example exactly (docs/21-developer-experience.md)", () => {
    const manifest = parseManifestYaml(treasuryAgentYaml);
    expect(manifest).toMatchObject({
      kind: "Agent",
      version: "alma/v1",
      metadata: { name: "treasury-agent" },
      identity: { type: "agent" },
      capabilities: ["pay"],
      authority: { maxTransaction: { USDC: "1000" } },
      counterpartyPolicy: { minCompletedTransactions: 1 },
      integrations: { wallet: "crossmint", chain: "base" },
    });
  });

  it("fails loudly and specifically on an invalid manifest, not a generic YAML error", () => {
    expect(() => parseManifestYaml("kind: NotAnAgent\nversion: alma/v1\n")).toThrow(AlmaValidationError);
  });

  it("rejects a manifest with no capabilities", () => {
    const invalid = `
kind: Agent
version: alma/v1
metadata: { name: x }
identity: { type: agent }
capabilities: []
`;
    expect(() => parseManifestYaml(invalid)).toThrow(AlmaValidationError);
  });
});

describe("compileManifest", () => {
  it("compiles capabilities into a DelegationScope", () => {
    const manifest = parseManifestYaml(treasuryAgentYaml);
    const compiled = compileManifest(manifest);
    expect(compiled.delegation.scope).toEqual({ capabilities: ["pay"] });
  });

  it("compiles authority into a self policy and counterpartyPolicy into a counterparty policy", () => {
    const manifest = parseManifestYaml(treasuryAgentYaml);
    const compiled = compileManifest(manifest);
    expect(compiled.selfPolicy).toEqual({ kind: "self", rules: { maxTransaction: { USDC: "1000" } } });
    expect(compiled.counterpartyPolicy).toEqual({ kind: "counterparty", rules: { minCompletedTransactions: 1 } });
  });

  it("omits selfPolicy/counterpartyPolicy entirely when the manifest doesn't specify them", () => {
    const manifest = parseManifestYaml(`
kind: Agent
version: alma/v1
metadata: { name: minimal-agent }
identity: { type: agent }
capabilities: [pay]
`);
    const compiled = compileManifest(manifest);
    expect(compiled.selfPolicy).toBeUndefined();
    expect(compiled.counterpartyPolicy).toBeUndefined();
  });
});

describe("buildManifest / stringifyManifest -- the reverse direction", () => {
  it("round-trips: buildManifest(...) -> compileManifest(...) reproduces the original configuration", () => {
    const built = buildManifest({
      name: "treasury-agent",
      capabilities: ["pay"],
      selfPolicy: { maxTransaction: { USDC: "1000" } },
      counterpartyPolicy: { minCompletedTransactions: 1 },
      integrations: { wallet: "crossmint", chain: "base" },
    });

    expect(agentManifestSchema.safeParse(built).success).toBe(true);

    const compiled = compileManifest(built);
    expect(compiled).toEqual({
      agent: { displayName: "treasury-agent" },
      delegation: { scope: { capabilities: ["pay"] } },
      selfPolicy: { kind: "self", rules: { maxTransaction: { USDC: "1000" } } },
      counterpartyPolicy: { kind: "counterparty", rules: { minCompletedTransactions: 1 } },
      integrations: { wallet: "crossmint", chain: "base" },
    });
  });

  it("stringifyManifest -> parseManifestYaml round-trips to an equivalent manifest", () => {
    const built = buildManifest({ name: "treasury-agent", capabilities: ["pay"], selfPolicy: { maxTransaction: { USDC: "1000" } } });
    const yamlText = stringifyManifest(built);
    const reparsed = parseManifestYaml(yamlText);
    expect(reparsed).toEqual(built);
  });
});

describe("governance -- an agent that works on Cardano governance and never pays", () => {
  const governanceYaml = `kind: Agent
version: alma/v1
metadata:
  name: governance-analyst
identity:
  type: agent
capabilities:
  - analyze
  - attest
governance:
  networks: [cardano:mainnet]
  actionTypes: [TreasuryWithdrawals, InfoAction]
  humanDecides: [vote]
  publish: after-decision
`;

  it("parses a manifest with no payment authority and a governance section", () => {
    const m = parseManifestYaml(governanceYaml);
    expect(m.authority).toBeUndefined();
    expect(m.governance).toEqual({ networks: ["cardano:mainnet"], actionTypes: ["TreasuryWithdrawals", "InfoAction"], humanDecides: ["vote"], publish: "after-decision" });
    expect(compileManifest(m).governancePolicy).toEqual({ kind: "governance", rules: m.governance });
  });

  it("rejects an unknown action type, a non-cardano network, and unknown keys", () => {
    expect(() => parseManifestYaml(governanceYaml.replace("InfoAction]", "Spending]"))).toThrow();
    expect(() => parseManifestYaml(governanceYaml.replace("cardano:mainnet", "eip155:1"))).toThrow();
    expect(() => parseManifestYaml(governanceYaml.replace("publish: after-decision", "publish: after-decision\n  vote: true"))).toThrow();
  });

  it("round-trips through buildManifest and stringifyManifest", () => {
    const built = buildManifest({ name: "governance-analyst", capabilities: ["analyze", "attest"], governance: { networks: ["cardano:mainnet"], humanDecides: ["vote"] } });
    expect(parseManifestYaml(stringifyManifest(built))).toEqual(built);
    expect(GOVERNANCE_ACTION_TYPES).toHaveLength(7);
  });
});
