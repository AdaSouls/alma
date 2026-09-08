import { readIdentity, readDelegations, readEvidence } from "../lib/project-store.js";
import { bold, dim, fail } from "../lib/format.js";

export function whoamiCommand(): void {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  if (!identity) {
    fail("No ALMA identity in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }

  console.log(`I am ${bold(identity.id)}.`);
  if (identity.principal) console.log(`I represent ${bold(identity.principal)}.`);
  console.log();

  const activeDelegations = readDelegations(cwd).filter(
    (d) => d.subject === identity.id && d.status === "active"
  );
  if (activeDelegations.length) {
    console.log("I am authorized to:");
    const capabilities = new Set(activeDelegations.flatMap((d) => d.scope.capabilities));
    for (const c of capabilities) console.log(`  • ${c}`);
  } else {
    console.log(dim("No delegation recorded yet — run `alma delegate` to grant capabilities."));
  }
  console.log();

  if (identity.controllers.length) {
    console.log("My identity is linked to:");
    for (const c of identity.controllers) console.log(`  • ${c.type}: ${c.value}`);
  } else {
    console.log(dim("No controllers/bindings recorded yet."));
  }
  console.log();

  const evidence = readEvidence(cwd).filter((e) => e.subject === identity.id);
  if (evidence.length) {
    console.log("My economic history:");
    console.log(`  • ${evidence.length} recorded action${evidence.length === 1 ? "" : "s"}`);
    const outcomes = evidence.reduce<Record<string, number>>((acc, e) => {
      acc[e.outcome] = (acc[e.outcome] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`  • ${Object.entries(outcomes).map(([k, v]) => `${v} ${k}`).join(", ")}`);
    const counterparties = new Set(
      evidence.map((e) => e.detail?.counterparty).filter((c): c is string => typeof c === "string")
    );
    if (counterparties.size) console.log(`  • ${counterparties.size} distinct counterpart${counterparties.size === 1 ? "y" : "ies"}`);
    const total = evidence.reduce((sum, e) => {
      const amount = e.detail?.amount;
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);
    if (total > 0) console.log(`  • ${total} settled (recorded via \`alma evidence add\`)`);
  } else {
    console.log(dim("No economic history recorded yet — run `alma evidence add` to record some."));
  }
}
