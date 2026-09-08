#!/usr/bin/env node
import { Command } from "commander";
import { connectCommand } from "./commands/connect.js";
import { delegateCommand } from "./commands/delegate.js";
import { evidenceAddCommand } from "./commands/evidence.js";
import { whoamiCommand } from "./commands/whoami.js";

const program = new Command();

program
  .name("alma")
  .description(
    "Give your agent a portable ALMA identity from the terminal.\n" +
      "This is the ALMA-protocol slice only — wallet/policy/marketplace commands\n" +
      "need the AdaSouls platform (not built yet) and aren't included here."
  )
  .version("0.1.0");

program
  .command("connect")
  .description("Create (or inspect) this project's ALMA identity")
  .option("--agent <name>", "Display name for the agent")
  .option("--org <almaId>", "The alma: id of the principal (org or human) this agent represents")
  .option("--wallet <address>", "Bind a wallet address as a controller")
  .option("--did <did>", "Bind a DID as a controller")
  .option("-y, --yes", "Don't prompt; accept defaults for anything not passed as a flag")
  .option("--force", "Issue a new identity even if this project already has one")
  .action(connectCommand);

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
  .option("--amount <number>")
  .option("--role <role>", "principal | agent", "agent")
  .option("--source-type <type>", "erc8004 | economic-action | marketplace | credential | external", "economic-action")
  .action(evidenceAddCommand);

program
  .command("whoami")
  .description("Have the agent describe itself from its local ALMA record")
  .action(whoamiCommand);

program.parseAsync(process.argv);
