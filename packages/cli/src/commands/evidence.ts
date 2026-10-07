import { randomUUID } from "node:crypto";
import {
  buildReceiptStatement,
  receiptDigest,
  recordEvidence,
  signReceiptMint,
  AlmaValidationError,
  type EvidenceOutcome,
  type EvidenceRole,
  type EvidenceSourceType,
  type ReceiptEnv,
} from "@adasouls/alma-core";
import { appendToLog, loadIssuer, localIssuer } from "../lib/history.js";
import { addEvidence, appendReceipt, readIdentity } from "../lib/project-store.js";
import { ok, fail, dim, pending } from "../lib/format.js";

export interface EvidenceOptions {
  outcome: EvidenceOutcome;
  counterparty?: string;
  amount?: string;
  role?: EvidenceRole;
  sourceType?: EvidenceSourceType;
  txHash?: string;
  chain?: string;
  asset?: string;
  to?: string;
  capability?: string;
  env?: ReceiptEnv;
}

/** Chains whose kind is known. Anything else needs --env: a receipt never guesses "mainnet". */
const ENVS: Record<string, ReceiptEnv> = { "eip155:1": "mainnet", "eip155:8453": "mainnet", "eip155:10": "mainnet", "eip155:42161": "mainnet", "eip155:84532": "testnet", "eip155:11155111": "testnet" };

const RECEIPT_FIELDS = ["counterparty", "amount", "txHash", "chain", "asset", "to"] as const;
const FLAG: Record<(typeof RECEIPT_FIELDS)[number], string> = { counterparty: "--counterparty", amount: "--amount", txHash: "--tx-hash", chain: "--chain", asset: "--asset", to: "--to" };

/**
 * Records something this agent did. A payment with its transaction
 * becomes a **signed receipt** in the project's own log; anything else
 * is a plain note, as before. Either way it is self-attested: the
 * project says so itself, and it never counts as confirmed by the
 * counterparty.
 */
export async function evidenceAddCommand(opts: EvidenceOptions): Promise<void> {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  if (!identity) {
    fail("No ALMA identity in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }

  const signer = await loadIssuer(cwd);
  const missing = RECEIPT_FIELDS.filter((f) => !opts[f]);
  const payment = opts.outcome === "success" && missing.length === 0;

  try {
    if (signer && payment) {
      const env = opts.env ?? ENVS[opts.chain!];
      if (!env) throw new Error(`--env: say whether ${opts.chain} is mainnet, testnet or mock`);
      const action = `act_${randomUUID()}`;
      const statement = buildReceiptStatement({
        issuer: localIssuer(identity.id),
        env,
        action,
        payer: identity.id,
        payee: opts.counterparty!,
        capability: opts.capability ?? "pay",
        chain: opts.chain!,
        asset: opts.asset!,
        amount: opts.amount!,
        to: opts.to!,
        txHash: opts.txHash!,
      });
      const id = `rcp_${action}`;
      // Not independent: the payer is the one signing. Nobody else vouched for this.
      const mint = await signReceiptMint(signer, { iss: localIssuer(identity.id), receipt: id, digest: await receiptDigest(statement), independent: false });
      appendReceipt(cwd, { id, statement, mint, selfAttested: true });
      const position = await appendToLog(cwd, identity.id, mint);
      ok(`Signed receipt ${id}: paid ${opts.counterparty} (position ${position} in this project's log)`);
      console.log(dim("Self-attested: signed with this project's own key. It doesn't count as confirmed by the counterparty."));
      console.log(dim("Saved to ./.alma/receipts.jsonl"));
      return;
    }

    const evidence = recordEvidence({
      subject: identity.id,
      role: opts.role ?? "agent",
      source: { type: opts.sourceType ?? "economic-action" },
      outcome: opts.outcome,
      detail: {
        ...(opts.counterparty ? { counterparty: opts.counterparty } : {}),
        ...(opts.amount ? { amount: Number(opts.amount) } : {}),
      },
    });
    addEvidence(cwd, evidence);
    ok(`Recorded ${opts.outcome}${opts.counterparty ? ` with ${opts.counterparty}` : ""}`);
    console.log(dim("Saved to ./.alma/evidence.json — a note you recorded, unsigned; not a live feed."));
    if (opts.outcome === "success") {
      if (!signer) pending("Not signed: this project has no signing key (run `alma connect`)");
      else pending(`Not signed: a signed receipt also needs ${missing.map((f) => FLAG[f]).join(", ")}`);
    }
  } catch (err) {
    if (err instanceof AlmaValidationError) fail(`${err.field} — ${err.reason}`);
    else fail(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
