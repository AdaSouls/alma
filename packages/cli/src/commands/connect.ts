import { basename } from "node:path";
import { createIdentity, AlmaValidationError, type Controller } from "@adasouls/alma-core";
import { detectRuntime } from "../lib/detect-runtime.js";
import { readIdentity, writeIdentity } from "../lib/project-store.js";
import { promptText } from "../lib/prompt.js";
import { ok, pending, bold, dim, fail } from "../lib/format.js";

export interface ConnectOptions {
  agent?: string;
  org?: string;
  wallet?: string;
  did?: string;
  yes?: boolean;
  force?: boolean;
}

export async function connectCommand(opts: ConnectOptions): Promise<void> {
  const cwd = process.cwd();
  console.log(bold("Connecting your agent to AdaSouls...\n"));

  const existing = readIdentity(cwd);
  if (existing && !opts.force) {
    console.log(`Already connected as ${bold(existing.id)}.`);
    console.log(dim("Run `alma whoami` to inspect it, or pass --force to issue a new one."));
    return;
  }

  const runtime = detectRuntime(cwd);
  ok(`Agent runtime detected: ${runtime}`);

  const defaultName = basename(cwd);
  const displayName = opts.agent ?? (opts.yes ? defaultName : await promptText("Agent display name", defaultName));

  const controllers: Controller[] = [];
  if (opts.wallet) controllers.push({ type: "wallet", value: opts.wallet });
  if (opts.did) controllers.push({ type: "did", value: opts.did });

  let identity;
  try {
    identity = createIdentity({
      subjectType: "agent",
      displayName,
      principal: opts.org,
      controllers,
    });
  } catch (err) {
    if (err instanceof AlmaValidationError) fail(`${err.field} — ${err.reason}`);
    else fail(String(err));
    process.exitCode = 1;
    return;
  }

  writeIdentity(cwd, identity);
  ok("ALMA identity created");

  if (opts.org) ok(`Linked to principal ${opts.org}`);
  else pending("No principal linked yet — pass --org alma:main:org:... or run again with it");

  if (controllers.length) ok(`Bound ${controllers.length} controller(s)`);
  else pending("No wallet/DID bound yet — pass --wallet 0x... or --did did:...");

  pending("Developer authentication (needs a hosted AdaSouls API — not built yet)");
  pending("MCP connection (needs adasouls-mcp — not built yet)");
  pending("Economic API connection (needs adasouls-api — not built yet)");

  console.log();
  console.log(bold("Your agent now has a portable ALMA identity."));
  console.log();
  console.log("ALMA ID:");
  console.log(bold(identity.id));
  console.log();
  console.log(dim(`Saved to ./.alma/identity.json — run \`alma whoami\` to see how your agent describes itself.`));
}
