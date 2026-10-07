import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LocalSigner,
  appendToFrontier,
  createIssuerKeyset,
  envelopeLeafHash,
  frontierRoot,
  hashToHex,
  hexToHash,
  signTreeHead,
  type IssuerKeyset,
  type TreeHead,
} from "@adasouls/alma-core";
import { ensureDir, issuerKeyPath, readLog, writeLog, type LocalLog } from "./project-store.js";

/**
 * The project's own signed history: a local issuer key and a local
 * transparency log, the same construction AdaSouls uses for the receipts
 * it issues. With no hosted service involved, the project is its own
 * issuer, so everything here is **self-attested**: it proves the record
 * wasn't edited afterwards, not that a counterparty agrees with it.
 */

/** Who signs here: this project, for this agent. Never the name of a hosted issuer. */
export const localIssuer = (almaId: string) => `self:${almaId}`;
/** A log name may only hold lowercase letters, digits and dashes: "alma:main:agent:shopper" -> "local-main-agent-shopper". */
export const localLogName = (almaId: string) =>
  `local-${almaId.replace(/^alma:/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`.slice(0, 64);

export async function loadIssuer(cwd: string): Promise<LocalSigner | undefined> {
  const path = issuerKeyPath(cwd);
  return existsSync(path) ? LocalSigner.fromPkcs8(new Uint8Array(readFileSync(path))) : undefined;
}

/** Creates the key (PKCS#8, readable by its owner only) unless there is one. Returns it and whether it is new. */
export async function loadOrCreateIssuer(cwd: string): Promise<{ signer: LocalSigner; created: boolean }> {
  const existing = await loadIssuer(cwd);
  if (existing) return { signer: existing, created: false };
  const signer = await LocalSigner.generate();
  ensureDir(cwd);
  writeFileSync(issuerKeyPath(cwd), await signer.exportPkcs8(), { mode: 0o600, flag: "wx" });
  chmodSync(issuerKeyPath(cwd), 0o600);
  return { signer, created: true };
}

const IGNORED = ".alma/issuer.key";

/** Keeps the signing key out of version control. Returns true when it changed .gitignore. */
export function ignoreIssuerKey(cwd: string): boolean {
  const path = join(cwd, ".gitignore");
  const text = existsSync(path) ? readFileSync(path, "utf-8") : "";
  if (text.split("\n").some((line) => line.trim() === IGNORED || line.trim() === ".alma/" || line.trim() === ".alma")) return false;
  writeFileSync(path, `${text}${text === "" || text.endsWith("\n") ? "" : "\n"}# The ALMA signing key of this project: never commit it.\n${IGNORED}\n`, "utf-8");
  return true;
}

export function emptyLog(almaId: string): LocalLog {
  return { log: localLogName(almaId), size: 0, frontier: [], leaves: [] };
}

/** Appends a signed envelope to the log and returns its position. */
export async function appendToLog(cwd: string, almaId: string, envelope: unknown): Promise<number> {
  const log = readLog(cwd) ?? emptyLog(almaId);
  const leaf = await envelopeLeafHash(envelope);
  const next = await appendToFrontier({ size: log.size, nodes: log.frontier.map(hexToHash) }, leaf);
  writeLog(cwd, { log: log.log, size: next.size, frontier: next.nodes.map(hashToHex), leaves: [...log.leaves, hashToHex(leaf)] });
  return log.size;
}

/** The log's current size and root, signed with the project's key. */
export async function signedHead(cwd: string, almaId: string, signer: LocalSigner): Promise<TreeHead> {
  const log = readLog(cwd) ?? emptyLog(almaId);
  const rootHash = await frontierRoot({ size: log.size, nodes: log.frontier.map(hexToHash) });
  return signTreeHead(signer, { iss: localIssuer(almaId), log: log.log, treeSize: log.size, rootHash });
}

/** The keys this project's own records are checked against: its own. */
export const localKeyset = (almaId: string, signer: LocalSigner): Promise<IssuerKeyset> => createIssuerKeyset([{ iss: localIssuer(almaId), publicKey: Buffer.from(signer.publicKey).toString("base64url") }]);
