import { GOVERNANCE_ACTION_TYPES, buildManifest, governancePolicySchema, parseManifestYaml, stringifyManifest, type AgentManifest, type ManifestGovernancePolicy } from "@adasouls/alma-manifest";
import { readManifestText, writeManifestText } from "./project-store.js";

/**
 * An agent's declared limits, as the CLI takes them from flags and
 * writes them to alma.yaml and to the delegation's constraints (the same
 * keys as the policy engine's self-policy rules).
 *
 * Declared is not enforced: these are configuration the agent's own code
 * may or may not consult. What would enforce them is the verifier's
 * question, not this command's.
 */
/** Money limits: declared only for an agent that pays (its capabilities include `pay`). */
export interface PaymentLimits {
  maxTransaction: Record<string, string>;
  dailySpend: Record<string, string>;
  humanApprovalThreshold: Record<string, string>;
  allowedAssets: string[];
}

export interface Limits {
  capabilities: string[];
  payments?: PaymentLimits;
  governance?: ManifestGovernancePolicy;
  counterpartyMinTx?: number;
  expiresAt: string;
}

export interface LimitFlags {
  capabilities?: string;
  maxTx?: string;
  daily?: string;
  approveAbove?: string;
  assets?: string;
  counterpartyMinTx?: string;
  expires?: string;
  /** Governance: comma-separated cardano networks, e.g. cardano:mainnet. */
  govNetworks?: string;
  /** Governance action types it may work on, comma-separated (default: all). */
  govTypes?: string;
  /** Decisions only a person takes, e.g. vote. */
  humanDecides?: string;
  /** When its analyses become public: after-decision or immediately. */
  publish?: string;
}

/** An agent pays when one of its capabilities is `pay`; only then are money limits asked for. */
export const paysWith = (capabilities: string[]) => capabilities.includes("pay");

/** A governance section is declared when any governance flag is given. */
export const hasGovernanceFlags = (f: LimitFlags) => [f.govNetworks, f.govTypes, f.humanDecides, f.publish].some((v) => v !== undefined && v !== "");

export const DEFAULTS = { capabilities: "pay", maxTx: "USDC=100", daily: "USDC=500", approveAbove: "USDC=50", expires: "90d" } as const;

const list = (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean);

/** "USDC=100,DAI=50" -> { USDC: "100", DAI: "50" }. Amounts stay strings: money is never a float. */
export function parseAmounts(text: string, flag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of list(text)) {
    const m = /^([A-Za-z][A-Za-z0-9]{0,15})=(\d+(?:\.\d+)?)$/.exec(part);
    if (!m) throw new Error(`${flag}: "${part}" must look like USDC=100`);
    out[m[1].toUpperCase()] = m[2];
  }
  if (Object.keys(out).length === 0) throw new Error(`${flag}: give at least one ASSET=amount`);
  return out;
}

/** "90d" (days from now) or an ISO date. Always in the future. */
export function parseExpiry(text: string, now = new Date()): string {
  const days = /^(\d{1,4})d$/.exec(text.trim());
  const at = days ? new Date(now.getTime() + Number(days[1]) * 86_400_000) : new Date(text);
  if (Number.isNaN(at.getTime())) throw new Error(`--expires: "${text}" must be a number of days like 90d, or a date`);
  if (at <= now) throw new Error("--expires: must be in the future");
  return at.toISOString();
}

export function limitsFromFlags(flags: LimitFlags & { capabilities: string; expires: string }, now = new Date()): Limits {
  const minTx = flags.counterpartyMinTx === undefined || flags.counterpartyMinTx === "" ? undefined : Number(flags.counterpartyMinTx);
  if (minTx !== undefined && (!Number.isInteger(minTx) || minTx < 0)) throw new Error("--counterparty-min-tx: must be a whole number");
  const capabilities = list(flags.capabilities);
  if (capabilities.length === 0) throw new Error("--capabilities: give at least one, e.g. pay");
  let payments: PaymentLimits | undefined;
  if (paysWith(capabilities)) {
    for (const [k, flag] of [["maxTx", "--max-tx"], ["daily", "--daily"], ["approveAbove", "--approve-above"]] as const) {
      if (!flags[k]) throw new Error(`${flag}: an agent that pays needs it (e.g. USDC=100)`);
    }
    const maxTransaction = parseAmounts(flags.maxTx!, "--max-tx");
    payments = {
      maxTransaction,
      dailySpend: parseAmounts(flags.daily!, "--daily"),
      humanApprovalThreshold: parseAmounts(flags.approveAbove!, "--approve-above"),
      // By default, the assets it has a limit for.
      allowedAssets: flags.assets ? list(flags.assets).map((a) => a.toUpperCase()) : Object.keys(maxTransaction),
    };
  } else if (flags.maxTx || flags.daily || flags.approveAbove) {
    throw new Error("money limits (--max-tx, --daily, --approve-above) only apply to an agent with the `pay` capability");
  }
  return {
    capabilities,
    payments,
    governance: hasGovernanceFlags(flags) ? governanceFromFlags(flags) : undefined,
    counterpartyMinTx: minTx,
    expiresAt: parseExpiry(flags.expires, now),
  };
}

export function governanceFromFlags(flags: LimitFlags): ManifestGovernancePolicy {
  const raw = {
    networks: flags.govNetworks ? list(flags.govNetworks) : ["cardano:mainnet"],
    ...(flags.govTypes ? { actionTypes: list(flags.govTypes) } : {}),
    ...(flags.humanDecides ? { humanDecides: list(flags.humanDecides) } : {}),
    ...(flags.publish ? { publish: flags.publish } : {}),
  };
  const parsed = governancePolicySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const flag = { networks: "--gov-networks", actionTypes: "--gov-types", humanDecides: "--human-decides", publish: "--publish" }[String(issue.path[0])] ?? "governance";
    throw new Error(`${flag}: ${issue.message}${issue.path[0] === "actionTypes" ? ` (one of ${GOVERNANCE_ACTION_TYPES.join(", ")})` : ""}`);
  }
  return parsed.data;
}

/** The delegation's constraints: what its issuer allows, in the policy engine's own terms. */
export function constraintsOf(limits: Limits): Record<string, unknown> {
  return { ...(limits.payments ?? {}), ...(limits.governance ? { governance: limits.governance } : {}) };
}

export function manifestOf(name: string, limits: Limits): AgentManifest {
  return buildManifest({
    name,
    capabilities: limits.capabilities,
    ...(limits.payments ? { selfPolicy: limits.payments } : {}),
    ...(limits.governance ? { governance: limits.governance } : {}),
    ...(limits.counterpartyMinTx !== undefined ? { counterpartyPolicy: { minCompletedTransactions: limits.counterpartyMinTx } } : {}),
  });
}

export function writeManifest(cwd: string, name: string, limits: Limits): void {
  writeManifestText(cwd, stringifyManifest(manifestOf(name, limits)));
}

/** The project's alma.yaml, validated; undefined when there is none. Throws when it is there but invalid. */
export function readManifest(cwd: string): AgentManifest | undefined {
  const text = readManifestText(cwd);
  return text === undefined ? undefined : parseManifestYaml(text);
}

const amounts = (r: Record<string, string> | undefined) => (r && Object.keys(r).length ? Object.entries(r).map(([asset, amount]) => `${amount} ${asset}`).join(", ") : "none declared");

/** The limits as lines a person reads. */
export function describeLimits(manifest: AgentManifest): string[] {
  const lines = [`Capabilities: ${manifest.capabilities.join(", ")}`];
  const a = manifest.authority;
  if (a || paysWith(manifest.capabilities)) {
    lines.push(
      `Per transaction: ${amounts(a?.maxTransaction)}`,
      `Per day: ${amounts(a?.dailySpend)}`,
      `A person approves above: ${amounts(a?.humanApprovalThreshold)}`,
      `Assets: ${a?.allowedAssets?.join(", ") ?? "any"}`
    );
  } else {
    lines.push("Payments: none (it has no `pay` capability)");
  }
  const g = manifest.governance;
  if (g) {
    lines.push(`Governance networks: ${g.networks.join(", ")}`);
    lines.push(`Governance action types: ${g.actionTypes?.join(", ") ?? "all"}`);
    lines.push(`A person decides: ${g.humanDecides?.join(", ") ?? "nothing reserved"}`);
    if (g.publish) lines.push(`Analyses published: ${g.publish}`);
  }
  if (manifest.counterpartyPolicy?.minCompletedTransactions !== undefined) lines.push(`Counterparties need at least ${manifest.counterpartyPolicy.minCompletedTransactions} completed transaction(s)`);
  return lines;
}
