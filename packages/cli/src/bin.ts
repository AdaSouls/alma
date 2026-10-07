#!/usr/bin/env node
import { Command } from "commander";
import { connectCommand } from "./commands/connect.js";
import { delegateCommand } from "./commands/delegate.js";
import { evidenceAddCommand } from "./commands/evidence.js";
import { limitsCommand } from "./commands/limits.js";
import { logHeadCommand } from "./commands/log.js";
import { whoamiCommand } from "./commands/whoami.js";

const program = new Command();

program
  .name("alma")
  .description(
    "Give a working agent an ALMA identity, declared limits and a signed history.\n" +
      "Everything here is local to the project: nothing is sent anywhere, and the\n" +
      "limits are declared, not enforced."
  )
  .version("0.1.0");

program
  .command("connect")
  .description("Create (or inspect) this project's ALMA identity")
  .option("--agent <name>", "Display name for the agent")
  .option("--org <almaId>", "The alma: id of the principal (org or human) this agent represents")
  .option("--wallet <address>", "Bind a wallet address as a controller")
  .option("--did <did>", "Bind a DID as a controller")
  .option("--capabilities <list>", "What it may do, comma-separated, e.g. pay,swap")
  .option("--max-tx <amounts>", "Most per transaction, e.g. USDC=100")
  .option("--daily <amounts>", "Most per day, e.g. USDC=500")
  .option("--approve-above <amounts>", "A person approves payments above this, e.g. USDC=50")
  .option("--assets <list>", "Assets it may use (default: the ones with a limit)")
  .option("--counterparty-min-tx <n>", "Counterparties need at least this many completed transactions")
  .option("--expires <when>", "When the delegation ends: a number of days like 90d, or a date (default 90d)")
  .option("--write-mcp-config", "Add the adasouls server to the MCP client configurations found on this machine")
  .option("-y, --yes", "Don't prompt; accept defaults for anything not passed as a flag")
  .option("--force", "Issue a new identity and limits even if this project already has them")
  .action(connectCommand);

program
  .command("limits")
  .description("Show this agent's declared limits, or change them (a change issues a new delegation and revokes the old one)")
  .option("--capabilities <list>")
  .option("--max-tx <amounts>")
  .option("--daily <amounts>")
  .option("--approve-above <amounts>")
  .option("--assets <list>")
  .option("--counterparty-min-tx <n>")
  .option("--expires <when>")
  .action(limitsCommand);

const log = program.command("log").description("This project's signed history");
log
  .command("head")
  .description("Print the signed head of the history (its size and root), to share or anchor")
  .option("--json", "The signed head itself")
  .action(logHeadCommand);

program
  .command("delegate")
  .description("Grant capabilities to this project's agent (or another subject)")
  .requiredOption("--capabilities <list>", "Comma-separated capabilities, e.g. pay,swap")
  .option("--issuer <almaId>", "Defaults to this identity's principal")
  .option("--subject <almaId>", "Defaults to this project's own identity")
  .option("--proof-format <format>", "ap2-mandate | verifiable-intent | w3c-vc | alma-native")
  .option("--proof-reference <ref>", "A reference into that proof format's own record")
  .action(delegateCommand);

const evidence = program.command("evidence").description("Record reputation evidence for this agent");
evidence
  .command("add")
  .requiredOption("--outcome <outcome>", "success | failure | disputed")
  .option("--counterparty <almaId>")
  .option("--amount <number>", "For a signed receipt: a whole number in the asset's base units (5 USDC = 5000000)")
  .option("--tx-hash <hash>", "The payment's transaction: with --chain, --asset, --to, --counterparty and --amount it becomes a signed receipt")
  .option("--chain <caip2>", "e.g. eip155:84532")
  .option("--asset <caip19>", "e.g. eip155:84532/erc20:0x036c...")
  .option("--to <address>", "The address that was paid")
  .option("--capability <name>", "pay (default), hire...")
  .option("--env <env>", "mainnet | testnet | mock, when the chain isn't one this CLI knows")
  .option("--role <role>", "principal | agent", "agent")
  .option("--source-type <type>", "erc8004 | economic-action | marketplace | credential | external", "economic-action")
  .action(evidenceAddCommand);

program
  .command("whoami")
  .description("Have the agent describe itself from its local ALMA record")
  .action(whoamiCommand);

program.parseAsync(process.argv);
