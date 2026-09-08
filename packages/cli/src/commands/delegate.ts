import { createDelegation, AlmaValidationError, type ProofFormat } from "@adasouls/alma-core";
import { readIdentity, addDelegation } from "../lib/project-store.js";
import { ok, fail, dim } from "../lib/format.js";

export interface DelegateOptions {
  issuer?: string;
  subject?: string;
  capabilities: string;
  proofFormat?: ProofFormat;
  proofReference?: string;
}

export function delegateCommand(opts: DelegateOptions): void {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  if (!identity) {
    fail("No ALMA identity in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }

  const subject = opts.subject ?? identity.id;
  const issuer = opts.issuer ?? identity.principal;
  if (!issuer) {
    fail("No issuer given and this identity has no principal — pass --issuer alma:main:org:...");
    process.exitCode = 1;
    return;
  }

  const capabilities = opts.capabilities.split(",").map((c) => c.trim()).filter(Boolean);

  try {
    const delegation = createDelegation({
      issuer,
      subject,
      scope: { capabilities },
      proof: opts.proofFormat ? { format: opts.proofFormat, reference: opts.proofReference } : undefined,
    });
    addDelegation(cwd, delegation);
    ok(`${issuer} delegates [${capabilities.join(", ")}] to ${subject}`);
    console.log(dim(`Saved to ./.alma/delegations.json`));
  } catch (err) {
    if (err instanceof AlmaValidationError) fail(`${err.field} — ${err.reason}`);
    else fail(String(err));
    process.exitCode = 1;
  }
}
