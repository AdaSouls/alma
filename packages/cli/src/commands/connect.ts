import { basename } from "node:path";
import { almaIdentitySchema, createDelegation, createIdentity, AlmaValidationError, type AlmaIdentity, type Controller } from "@adasouls/alma-core";
import { detectRuntime } from "../lib/detect-runtime.js";
import { emptyLog, ignoreIssuerKey, loadOrCreateIssuer } from "../lib/history.js";
import { DEFAULTS, constraintsOf, describeLimits, limitsFromFlags, manifestOf, readManifest, writeManifest, type LimitFlags, type Limits } from "../lib/limits.js";
import { addServer, detectMcpClients, snippet } from "../lib/mcp-clients.js";
import { addDelegation, readDelegations, readIdentity, readLog, writeIdentity, writeLog } from "../lib/project-store.js";
import { promptText } from "../lib/prompt.js";
import { ok, pending, bold, dim, fail } from "../lib/format.js";

export interface ConnectOptions extends LimitFlags {
  agent?: string;
  org?: string;
  wallet?: string;
  did?: string;
  yes?: boolean;
  force?: boolean;
  writeMcpConfig?: boolean;
}

/** A value from its flag, or asked for with its default; with --yes, the default. */
async function ask(value: string | undefined, question: string, fallback: string, yes: boolean | undefined): Promise<string> {
  return value ?? (yes ? fallback : await promptText(question, fallback));
}

/**
 * Takes a working agent to an identity, declared limits and a signed
 * history in one run, with no hosted service. Each step prints a check
 * only for what it actually did, and says plainly who enforces the
 * limits: nobody yet. They are declared.
 */
export async function connectCommand(opts: ConnectOptions): Promise<void> {
  const cwd = process.cwd();
  console.log(bold("Connecting your agent to ALMA...\n"));

  // ---- 1. Identity
  let identity: AlmaIdentity;
  const existing = readIdentity(cwd);
  if (existing && !opts.force) {
    identity = existing;
    ok(`Already has an ALMA identity: ${existing.id}`);
    // The identity is kept, and a wallet or DID passed now is added to it: this is how a wallet gets bound after the first run.
    const asked: Controller[] = [...(opts.wallet ? [{ type: "wallet" as const, value: opts.wallet }] : []), ...(opts.did ? [{ type: "did" as const, value: opts.did }] : [])];
    const added = asked.filter((a) => !existing.controllers.some((c) => c.type === a.type && c.value.toLowerCase() === a.value.toLowerCase()));
    if (added.length) {
      const bound = almaIdentitySchema.safeParse({ ...existing, controllers: [...existing.controllers, ...added] });
      if (!bound.success) {
        fail("That wallet or DID can't be bound to the identity");
        process.exitCode = 1;
        return;
      }
      identity = bound.data;
      writeIdentity(cwd, identity);
      for (const c of added) ok(`Bound ${c.type} ${c.value} to the identity`);
    }
  } else {
    ok(`Agent runtime detected: ${detectRuntime(cwd)}`);
    const defaultName = basename(cwd);
    const displayName = opts.agent ?? (opts.yes ? defaultName : await promptText("Agent display name", defaultName));
    const controllers: Controller[] = [];
    if (opts.wallet) controllers.push({ type: "wallet", value: opts.wallet });
    if (opts.did) controllers.push({ type: "did", value: opts.did });
    try {
      identity = createIdentity({ subjectType: "agent", displayName, principal: opts.org, controllers });
    } catch (err) {
      fail(err instanceof AlmaValidationError ? `${err.field} — ${err.reason}` : String(err));
      process.exitCode = 1;
      return;
    }
    writeIdentity(cwd, identity);
    ok("ALMA identity created");
    if (controllers.length) ok(`Bound ${controllers.length} controller(s)`);
    else pending("No wallet/DID bound yet — pass --wallet 0x... or --did did:...");
  }
  if (identity.principal) ok(`Linked to principal ${identity.principal}`);
  else pending("No principal linked yet — pass --org alma:main:org:... (without one, nobody has delegated anything to this agent)");

  // ---- 2. Limits
  let limits: Limits | undefined;
  try {
    if (readManifest(cwd) && !opts.force) {
      ok("Limits already declared in ./alma.yaml (change them with `alma limits`)");
    } else {
      limits = limitsFromFlags({
        ...opts,
        capabilities: await ask(opts.capabilities, "Capabilities", DEFAULTS.capabilities, opts.yes),
        maxTx: await ask(opts.maxTx, "Most it may pay in one transaction", DEFAULTS.maxTx, opts.yes),
        daily: await ask(opts.daily, "Most it may pay in a day", DEFAULTS.daily, opts.yes),
        approveAbove: await ask(opts.approveAbove, "A person approves payments above", DEFAULTS.approveAbove, opts.yes),
        expires: opts.expires ?? DEFAULTS.expires,
      });
      writeManifest(cwd, identity.displayName ?? basename(cwd), limits);
      ok("Limits declared in ./alma.yaml");
      for (const line of describeLimits(manifestOf(identity.displayName ?? basename(cwd), limits))) console.log(dim(`    ${line}`));
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  if (limits) {
    if (identity.principal) {
      try {
        const delegation = createDelegation({
          issuer: identity.principal,
          subject: identity.id,
          scope: { capabilities: limits.capabilities, constraints: constraintsOf(limits) },
          expiresAt: limits.expiresAt,
        });
        addDelegation(cwd, delegation);
        ok(`${identity.principal} delegates [${limits.capabilities.join(", ")}] with those limits, until ${limits.expiresAt.slice(0, 10)}`);
      } catch (err) {
        fail(err instanceof AlmaValidationError ? `${err.field} — ${err.reason}` : String(err));
        process.exitCode = 1;
        return;
      }
    } else {
      pending("No delegation recorded: there is no principal to delegate from");
    }
  } else if (!readDelegations(cwd).some((d) => d.subject === identity.id && d.status === "active")) {
    pending("No active delegation recorded for this agent");
  }

  // ---- 3. History
  const { signer, created } = await loadOrCreateIssuer(cwd);
  if (created) ok(`Signing key created in ./.alma/issuer.key (key id ${signer.kid})`);
  else ok(`Signing key already present (key id ${signer.kid})`);
  if (ignoreIssuerKey(cwd)) ok("Added .alma/issuer.key to .gitignore");
  if (!readLog(cwd)) {
    writeLog(cwd, emptyLog(identity.id));
    ok("Empty signed history started in ./.alma/log.json");
  }

  // ---- 4. Wiring
  const clients = detectMcpClients(cwd);
  if (opts.writeMcpConfig) {
    if (clients.length === 0) pending("No MCP client configuration found to write to");
    for (const client of clients) {
      const outcome = addServer(client.path);
      if (outcome === "written") ok(`Added the adasouls server to ${client.name}: ${client.path} (put your agent's api key in it)`);
      else pending(`${client.name}: ${outcome === "already there" ? "already has an adasouls server; left as it is" : "its configuration couldn't be read; left as it is"}`);
    }
  }
  pending("Route through AdaSouls (needs a running adasouls-api): payments are checked before anything is signed");
  if (!opts.writeMcpConfig) {
    console.log(dim(clients.length ? `    MCP client(s) found: ${clients.map((c) => c.name).join(", ")}. Add this server to them, or re-run with --write-mcp-config:` : "    To do it over MCP, add this server to your client's configuration:"));
    for (const line of snippet().split("\n")) console.log(dim(`    ${line}`));
  }

  console.log();
  console.log("ALMA ID:");
  console.log(bold(identity.id));
  console.log();
  console.log(`Limits: declared (advisory). Run ${bold("npx @adasouls/alma-verifier doctor")} to see what would enforce them.`);
}
