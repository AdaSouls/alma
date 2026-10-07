import { loadIssuer, signedHead } from "../lib/history.js";
import { describeLimits, readManifest } from "../lib/limits.js";
import { readIdentity, readDelegations, readEvidence, readReceipts } from "../lib/project-store.js";
import { bold, dim, fail } from "../lib/format.js";

export async function whoamiCommand(): Promise<void> {
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

  // What it may spend: declared in ./alma.yaml.
  try {
    const manifest = readManifest(cwd);
    if (manifest) {
      console.log("My declared limits:");
      for (const line of describeLimits(manifest)) console.log(`  • ${line}`);
      // Nothing here has checked what enforces them, so the honest level is the lowest one.
      console.log(`  • Enforcement: advisory ${dim("(until `npx @adasouls/alma-verifier doctor` says otherwise)")}`);
    } else {
      console.log(dim("No limits declared yet — run `alma connect` or `alma limits`."));
    }
  } catch (err) {
    console.log(dim(`./alma.yaml isn't a valid manifest: ${err instanceof Error ? err.message : String(err)}`));
  }
  console.log();

  // What it signed itself.
  const receipts = readReceipts(cwd);
  const signer = await loadIssuer(cwd);
  if (signer) {
    const head = await signedHead(cwd, identity.id, signer);
    console.log("My signed history (self-attested):");
    console.log(`  • ${receipts.length} signed receipt${receipts.length === 1 ? "" : "s"}`);
    console.log(`  • Log head: ${head.payload.treeSize} entr${Number(head.payload.treeSize) === 1 ? "y" : "ies"}, root ${head.payload.rootHash.slice(0, 16)}…, key ${head.payload.kid}`);
  } else {
    console.log(dim("No signed history yet — run `alma connect` to create this project's signing key."));
  }
  console.log();

  const evidence = readEvidence(cwd).filter((e) => e.subject === identity.id);
  if (evidence.length) {
    console.log("Notes I recorded (unsigned):");
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
    console.log(dim("No unsigned notes recorded."));
  }
}
