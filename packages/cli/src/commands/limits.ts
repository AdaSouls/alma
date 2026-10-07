import { createDelegation, revokeDelegation, AlmaValidationError } from "@adasouls/alma-core";
import { constraintsOf, describeLimits, limitsFromFlags, manifestOf, readManifest, writeManifest, type LimitFlags } from "../lib/limits.js";
import { readDelegations, readIdentity, writeDelegations } from "../lib/project-store.js";
import { bold, dim, fail, ok, pending } from "../lib/format.js";

const amounts = (r: Record<string, string> | undefined) => (r ? Object.entries(r).map(([asset, amount]) => `${asset}=${amount}`).join(",") : undefined);

/**
 * Shows the agent's declared limits, or changes them. A change is never
 * an edit in place: the delegation that carried the old limits is
 * revoked and a new one is issued, so the record shows what was allowed
 * and when.
 */
export function limitsCommand(opts: LimitFlags): void {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  if (!identity) {
    fail("No ALMA identity in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }

  let manifest;
  try {
    manifest = readManifest(cwd);
  } catch (err) {
    fail(`./alma.yaml isn't a valid manifest: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
    return;
  }

  const changing = Object.values(opts).some((v) => v !== undefined);
  if (!changing) {
    if (!manifest) {
      pending("No limits declared yet — run `alma connect`, or pass them here (e.g. --max-tx USDC=100 --daily USDC=500 --approve-above USDC=50)");
      return;
    }
    console.log(bold("Declared limits (./alma.yaml):"));
    for (const line of describeLimits(manifest)) console.log(`  ${line}`);
    const active = readDelegations(cwd).filter((d) => d.subject === identity.id && d.status === "active");
    console.log();
    if (active.length) for (const d of active) console.log(dim(`Delegated by ${d.issuer}${d.expiresAt ? `, until ${d.expiresAt.slice(0, 10)}` : ", with no expiry"}`));
    else console.log(dim("No active delegation carries them."));
    console.log(dim("Declared, not enforced: `npx @adasouls/alma-verifier doctor` says what would enforce them."));
    return;
  }

  // What isn't passed keeps its current value.
  const a = manifest?.authority;
  const current = {
    capabilities: manifest?.capabilities.join(","),
    maxTx: amounts(a?.maxTransaction),
    daily: amounts(a?.dailySpend),
    approveAbove: amounts(a?.humanApprovalThreshold),
    assets: opts.maxTx ? undefined : a?.allowedAssets?.join(","),
    counterpartyMinTx: manifest?.counterpartyPolicy?.minCompletedTransactions?.toString(),
  };
  const merged = { ...current, ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined)) } as LimitFlags;
  const missing = (["capabilities", "maxTx", "daily", "approveAbove"] as const).filter((k) => !merged[k]);
  if (missing.length) {
    fail(`Nothing declared yet for: ${missing.join(", ")}. Pass them, or run \`alma connect\`.`);
    process.exitCode = 1;
    return;
  }

  const all = readDelegations(cwd);
  const old = all.filter((d) => d.subject === identity.id && d.status === "active");
  const issuer = old[0]?.issuer ?? identity.principal;
  try {
    const limits = limitsFromFlags({ ...merged, capabilities: merged.capabilities!, maxTx: merged.maxTx!, daily: merged.daily!, approveAbove: merged.approveAbove!, expires: opts.expires ?? "90d" });
    const name = manifest?.metadata.name ?? identity.displayName ?? "agent";
    writeManifest(cwd, name, limits);
    ok("Limits updated in ./alma.yaml");
    for (const line of describeLimits(manifestOf(name, limits))) console.log(dim(`    ${line}`));

    if (!issuer) {
      pending("No delegation recorded: this agent has no principal to delegate from (run `alma connect --org ...`)");
      return;
    }
    const revoked = new Set(old.map((d) => d.id));
    const next = createDelegation({ issuer, subject: identity.id, scope: { capabilities: limits.capabilities, constraints: constraintsOf(limits) }, expiresAt: limits.expiresAt });
    writeDelegations(cwd, [...all.map((d) => (revoked.has(d.id) ? revokeDelegation(d, issuer, "limits changed") : d)), next]);
    if (old.length) ok(`Revoked ${old.length} earlier delegation(s)`);
    ok(`${issuer} delegates [${limits.capabilities.join(", ")}] with the new limits, until ${limits.expiresAt.slice(0, 10)}`);
  } catch (err) {
    fail(err instanceof AlmaValidationError ? `${err.field} — ${err.reason}` : err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
