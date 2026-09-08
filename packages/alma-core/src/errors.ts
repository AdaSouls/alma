/**
 * ALMA fails loudly and specifically: every validation error names the
 * field and the reason, since consumers (a UI, another service) rely on
 * this for user-facing error messages, not just "invalid input."
 */
export class AlmaValidationError extends Error {
  readonly field: string;
  readonly reason: string;

  constructor(field: string, reason: string) {
    super(`${field}: ${reason}`);
    this.name = "AlmaValidationError";
    this.field = field;
    this.reason = reason;
  }
}

import type { SafeParseReturnType } from "zod";

export function unwrap<T>(result: SafeParseReturnType<unknown, T>, context: string): T {
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.length ? `${context}.${issue.path.join(".")}` : context;
  throw new AlmaValidationError(field, issue?.message ?? "invalid value");
}
