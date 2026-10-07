import { mkdtempSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashToHex, hexToHash, inclusionProof, envelopeLeafHash, verifyInclusion, verifyReceipt, verifyTreeHead, type Delegation } from "@adasouls/alma-core";
import { parseManifestYaml } from "@adasouls/alma-manifest";
import { connectCommand } from "../src/commands/connect.js";
import { evidenceAddCommand } from "../src/commands/evidence.js";
import { limitsCommand } from "../src/commands/limits.js";
import { logHeadCommand } from "../src/commands/log.js";
import { whoamiCommand } from "../src/commands/whoami.js";
import { loadIssuer, localIssuer, localKeyset, localLogName, signedHead } from "../src/lib/history.js";
import { addServer } from "../src/lib/mcp-clients.js";
import { readDelegations, readIdentity, readLog, readReceipts } from "../src/lib/project-store.js";

let dir: string;
let previous: string;
let out: string[];

beforeEach(() => {
  previous = process.cwd();
  dir = mkdtempSync(join(tmpdir(), "alma-cli-"));
  // A scratch project that looks like a real agent.
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "shopper", dependencies: { "@anthropic-ai/sdk": "^0.30.0" } }));
  process.chdir(dir);
  process.exitCode = 0;
  out = [];
  vi.spyOn(console, "log").mockImplementation((...args) => void out.push(args.join(" ")));
});
afterEach(() => {
  process.chdir(previous);
  process.exitCode = 0;
  vi.restoreAllMocks();
});

const checks = () => out.filter((l) => l.startsWith("✓"));
const text = () => out.join("\n");
const connect = (over: Record<string, unknown> = {}) =>
  connectCommand({ agent: "shopper", org: "alma:main:org:acme", capabilities: "pay", maxTx: "USDC=100", daily: "USDC=500", approveAbove: "USDC=50", yes: true, ...over });

const payment = { outcome: "success" as const, counterparty: "alma:main:agent:vendor", amount: "5000000", txHash: "0xabc", chain: "eip155:84532", asset: "eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e", to: "0x1111111111111111111111111111111111111111" };

describe("alma connect", () => {
  it("takes a working agent to an identity, declared limits and a signed history in one run", async () => {
    await connect();
    expect(process.exitCode).toBe(0);

    const identity = readIdentity(dir)!;
    expect(identity).toMatchObject({ subjectType: "agent", principal: "alma:main:org:acme" });

    const [delegation] = readDelegations(dir);
    expect(delegation).toMatchObject({
      issuer: "alma:main:org:acme",
      subject: identity.id,
      status: "active",
      scope: { capabilities: ["pay"], constraints: { maxTransaction: { USDC: "100" }, dailySpend: { USDC: "500" }, humanApprovalThreshold: { USDC: "50" }, allowedAssets: ["USDC"] } },
    });
    const days = (Date.parse(delegation.expiresAt!) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(89);
    expect(days).toBeLessThanOrEqual(90);

    const manifest = parseManifestYaml(readFileSync(join(dir, "alma.yaml"), "utf-8"));
    expect(manifest).toMatchObject({ kind: "Agent", capabilities: ["pay"], authority: { maxTransaction: { USDC: "100" }, dailySpend: { USDC: "500" } } });

    expect(statSync(join(dir, ".alma", "issuer.key")).mode & 0o777).toBe(0o600);
    expect(readFileSync(join(dir, ".gitignore"), "utf-8")).toContain(".alma/issuer.key");
    expect(readLog(dir)).toEqual({ log: localLogName(identity.id), size: 0, frontier: [], leaves: [] });

    expect(text()).toContain("Claude / Anthropic SDK");
    expect(text()).toContain((await loadIssuer(dir))!.kid);
    expect(out.at(-1)).toContain("Limits: declared (advisory)");
    expect(out.at(-1)).toContain("npx @adasouls/alma-verifier doctor");
  });

  it("never prints a check for something that didn't happen", async () => {
    await connect({ org: undefined });
    // No principal: nothing was delegated, and routing through AdaSouls isn't done by this command.
    expect(checks().join("\n")).not.toMatch(/delegates|Route through|Linked to principal/);
    expect(text()).toContain("○ No delegation recorded");
    expect(text()).toContain("○ Route through AdaSouls (needs a running adasouls-api)");
    expect(text()).not.toContain("not built yet");
    expect(readDelegations(dir)).toEqual([]);
    expect(existsSync(join(dir, "alma.yaml"))).toBe(true);
  });

  it("run again, it keeps the identity, the limits and the key", async () => {
    await connect();
    const before = { id: readIdentity(dir)!.id, yaml: readFileSync(join(dir, "alma.yaml"), "utf-8"), key: readFileSync(join(dir, ".alma", "issuer.key")), gitignore: readFileSync(join(dir, ".gitignore"), "utf-8") };
    out = [];
    await connect({ maxTx: "USDC=999999" });
    expect(readIdentity(dir)!.id).toBe(before.id);
    expect(readFileSync(join(dir, "alma.yaml"), "utf-8")).toBe(before.yaml);
    expect(readFileSync(join(dir, ".alma", "issuer.key")).equals(before.key)).toBe(true);
    expect(readFileSync(join(dir, ".gitignore"), "utf-8")).toBe(before.gitignore);
    expect(readDelegations(dir)).toHaveLength(1);
    expect(text()).toContain("Limits already declared");
  });

  it("refuses limits it can't read, with what is wrong", async () => {
    for (const bad of [{ maxTx: "a lot" }, { daily: "USDC" }, { expires: "soon" }, { expires: "2000-01-01" }, { counterpartyMinTx: "1.5" }]) {
      process.chdir(mkdtempSync(join(tmpdir(), "alma-cli-")));
      process.exitCode = 0;
      await connect(bad);
      expect(process.exitCode, JSON.stringify(bad)).toBe(1);
      expect(existsSync(join(process.cwd(), "alma.yaml"))).toBe(false);
    }
  });

  it("writes to an MCP client's configuration only when asked, and never over an existing entry", async () => {
    writeFileSync(join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { other: { command: "x" } } }));
    await connect();
    expect(JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8")).mcpServers).toEqual({ other: { command: "x" } });
    expect(text()).toContain('"@adasouls/mcp"');

    const path = join(dir, ".mcp.json");
    expect(addServer(path)).toBe("written");
    const written = JSON.parse(readFileSync(path, "utf-8")).mcpServers;
    expect(Object.keys(written)).toEqual(["other", "adasouls"]);
    expect(addServer(path)).toBe("already there");
    writeFileSync(path, "{ not json");
    expect(addServer(path)).toBe("unreadable");
    expect(readFileSync(path, "utf-8")).toBe("{ not json");
  });
});

describe("signed history", () => {
  it("a payment with its transaction becomes a receipt that verifies against the project's own key, in a log whose head verifies", async () => {
    await connect();
    const identity = readIdentity(dir)!;
    out = [];
    await evidenceAddCommand(payment);
    await evidenceAddCommand({ ...payment, txHash: "0xdef" });
    expect(process.exitCode).toBe(0);
    expect(text()).toContain("Self-attested");

    const signer = (await loadIssuer(dir))!;
    const keyset = await localKeyset(identity.id, signer);
    const receipts = readReceipts(dir);
    expect(receipts).toHaveLength(2);
    for (const r of receipts) {
      const v = await verifyReceipt({ id: r.id, statement: r.statement, mint: r.mint }, keyset);
      if (!v.ok) throw new Error(v.reason);
      // Signed by the payer itself: never an independent, counterparty-confirmed record.
      expect(v.payload).toMatchObject({ independent: false, payment: null, delivery: null, statement: { payer: identity.id, payee: payment.counterparty, amount: "5000000", env: "testnet", issuer: localIssuer(identity.id) } });
    }

    const head = await signedHead(dir, identity.id, signer);
    const checked = await verifyTreeHead(head, keyset, localLogName(identity.id));
    if (!checked.ok) throw new Error(checked.reason);
    expect(checked.payload.treeSize).toBe(2);
    const log = readLog(dir)!;
    const leaves = log.leaves.map(hexToHash);
    expect(hashToHex(await envelopeLeafHash(receipts[1].mint))).toBe(log.leaves[1]);
    expect(await verifyInclusion(leaves[1], 1, 2, await inclusionProof(leaves, 1), checked.payload.rootHash)).toBe(true);

    // The same head, as the command prints it.
    out = [];
    await logHeadCommand({ json: true });
    expect((await verifyTreeHead(JSON.parse(text()), keyset, localLogName(identity.id))).ok).toBe(true);
  });

  it("without its transaction, a payment is an unsigned note, and the command says so", async () => {
    await connect();
    out = [];
    await evidenceAddCommand({ outcome: "success", counterparty: "alma:main:agent:vendor", amount: "5" });
    expect(readReceipts(dir)).toEqual([]);
    expect(text()).toContain("unsigned");
    expect(text()).toMatch(/○ Not signed: a signed receipt also needs --tx-hash, --chain, --asset, --to/);
    expect(checks().join("\n")).not.toContain("Signed receipt");
  });

  it("a chain it doesn't know needs its kind said, rather than guessed", async () => {
    await connect();
    await evidenceAddCommand({ ...payment, chain: "eip155:999999", asset: "eip155:999999/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e" });
    expect(process.exitCode).toBe(1);
    expect(readReceipts(dir)).toEqual([]);
    process.exitCode = 0;
    await evidenceAddCommand({ ...payment, chain: "eip155:999999", asset: "eip155:999999/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e", env: "mock" });
    expect(readReceipts(dir)).toHaveLength(1);
  });
});

describe("alma limits and whoami", () => {
  it("changing limits revokes the delegation that carried the old ones and issues a new one", async () => {
    await connect();
    const [first] = readDelegations(dir);
    out = [];
    limitsCommand({ daily: "USDC=200" });
    expect(process.exitCode).toBe(0);

    const all = readDelegations(dir) as Delegation[];
    expect(all).toHaveLength(2);
    expect(all[0]).toMatchObject({ id: first.id, status: "revoked", revocation: { by: "alma:main:org:acme", reason: "limits changed" } });
    // What wasn't passed is kept; the old record is untouched.
    expect(all[0].scope).toEqual(first.scope);
    expect(all[1]).toMatchObject({ status: "active", scope: { constraints: { maxTransaction: { USDC: "100" }, dailySpend: { USDC: "200" }, humanApprovalThreshold: { USDC: "50" } } } });
    expect(parseManifestYaml(readFileSync(join(dir, "alma.yaml"), "utf-8")).authority?.dailySpend).toEqual({ USDC: "200" });

    out = [];
    limitsCommand({});
    expect(text()).toContain("Per day: 200 USDC");
    expect(text()).toContain("Declared, not enforced");
  });

  it("whoami describes the limits, the signed history and the honest enforcement level", async () => {
    await connect();
    await evidenceAddCommand(payment);
    out = [];
    await whoamiCommand();
    expect(text()).toContain("Per transaction: 100 USDC");
    expect(text()).toContain("Enforcement: advisory");
    expect(text()).toContain("1 signed receipt");
    expect(text()).toMatch(/Log head: 1 entry, root [0-9a-f]{16}…/);
  });

  it("a project with nothing yet says what to run", async () => {
    mkdirSync(join(dir, "empty"));
    process.chdir(join(dir, "empty"));
    await logHeadCommand({});
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
    limitsCommand({});
    expect(process.exitCode).toBe(1);
  });
});
