import { buildManifest, parseManifestYaml, stringifyManifest, type AgentManifest } from "@adasouls/alma-manifest";
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
export interface Limits {
  capabilities: string[];
  maxTransaction: Record<string, string>;
  dailySpend: Record<string, string>;
  humanApprovalThreshold: Record<string, string>;
  allowedAssets: string[];
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
}

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

export function limitsFromFlags(flags: Required<Pick<LimitFlags, "capabilities" | "maxTx" | "daily" | "approveAbove" | "expires">> & LimitFlags, now = new Date()): Limits {
  const maxTransaction = parseAmounts(flags.maxTx, "--max-tx");
  const minTx = flags.counterpartyMinTx === undefined || flags.counterpartyMinTx === "" ? undefined : Number(flags.counterpartyMinTx);
  if (minTx !== undefined && (!Number.isInteger(minTx) || minTx < 0)) throw new Error("--counterparty-min-tx: must be a whole number");
  const capabilities = list(flags.capabilities);
  if (capabilities.length === 0) throw new Error("--capabilities: give at least one, e.g. pay");
  return {
    capabilities,
    maxTransaction,
    dailySpend: parseAmounts(flags.daily, "--daily"),
    humanApprovalThreshold: parseAmounts(flags.approveAbove, "--approve-above"),
    // By default, the assets it has a limit for.
    allowedAssets: flags.assets ? list(flags.assets).map((a) => a.toUpperCase()) : Object.keys(maxTransaction),
    counterpartyMinTx: minTx,
    expiresAt: parseExpiry(flags.expires, now),
  };
}

/** The delegation's constraints: what its issuer allows, in the policy engine's own terms. */
export function constraintsOf(limits: Limits): Record<string, unknown> {
  return { maxTransaction: limits.maxTransaction, dailySpend: limits.dailySpend, humanApprovalThreshold: limits.humanApprovalThreshold, allowedAssets: limits.allowedAssets };
}

export function manifestOf(name: string, limits: Limits): AgentManifest {
  return buildManifest({
    name,
    capabilities: limits.capabilities,
    selfPolicy: constraintsOf(limits) as never,
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
  const a = manifest.authority ?? {};
  return [
    `Capabilities: ${manifest.capabilities.join(", ")}`,
    `Per transaction: ${amounts(a.maxTransaction)}`,
    `Per day: ${amounts(a.dailySpend)}`,
    `A person approves above: ${amounts(a.humanApprovalThreshold)}`,
    `Assets: ${a.allowedAssets?.join(", ") ?? "any"}`,
    ...(manifest.counterpartyPolicy?.minCompletedTransactions !== undefined ? [`Counterparties need at least ${manifest.counterpartyPolicy.minCompletedTransactions} completed transaction(s)`] : []),
  ];
}
