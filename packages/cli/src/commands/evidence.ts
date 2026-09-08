import {
  recordEvidence,
  AlmaValidationError,
  type EvidenceOutcome,
  type EvidenceRole,
  type EvidenceSourceType,
} from "@adasouls/alma-core";
import { readIdentity, addEvidence } from "../lib/project-store.js";
import { ok, fail, dim } from "../lib/format.js";

export interface EvidenceOptions {
  outcome: EvidenceOutcome;
  counterparty?: string;
  amount?: string;
  role?: EvidenceRole;
  sourceType?: EvidenceSourceType;
}

export function evidenceAddCommand(opts: EvidenceOptions): void {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  if (!identity) {
    fail("No ALMA identity in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }

  try {
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
    console.log(dim(`Saved to ./.alma/evidence.json — this is evidence you recorded, not a live feed.`));
  } catch (err) {
    if (err instanceof AlmaValidationError) fail(`${err.field} — ${err.reason}`);
    else fail(String(err));
    process.exitCode = 1;
  }
}
