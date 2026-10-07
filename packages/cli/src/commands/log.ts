import { loadIssuer, signedHead } from "../lib/history.js";
import { readIdentity } from "../lib/project-store.js";
import { bold, dim, fail } from "../lib/format.js";

/**
 * Prints the signed head of this project's history: its size and root,
 * signed with the project's key. Share it or anchor it: anyone holding
 * an older head can later check that the history only grew.
 */
export async function logHeadCommand(opts: { json?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const identity = readIdentity(cwd);
  const signer = identity ? await loadIssuer(cwd) : undefined;
  if (!identity || !signer) {
    fail("No signed history in this project yet — run `alma connect` first.");
    process.exitCode = 1;
    return;
  }
  const head = await signedHead(cwd, identity.id, signer);
  if (opts.json) {
    console.log(JSON.stringify(head, null, 2));
    return;
  }
  console.log(`${bold("Log")}   ${head.payload.log}`);
  console.log(`${bold("Size")}  ${head.payload.treeSize} entr${Number(head.payload.treeSize) === 1 ? "y" : "ies"}`);
  console.log(`${bold("Root")}  ${head.payload.rootHash}`);
  console.log(`${bold("Key")}   ${head.payload.kid}`);
  console.log(dim("Signed by this project's own key: self-attested. Pass --json for the signed head itself."));
}
