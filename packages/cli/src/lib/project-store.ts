import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AlmaIdentity, Delegation, ReputationEvidence } from "@adasouls/alma-core";

/**
 * Project-local state, the way a `.git` or `.env` file works — this CLI
 * has no server of its own. A hosted implementation (adasouls-api) is
 * what would give an identity cross-device, cross-developer persistence;
 * this is the local-only reference client, same posture as
 * apps/identity-studio but for the terminal instead of the browser.
 */
const DIR_NAME = ".alma";

function dir(cwd: string): string {
  return join(cwd, DIR_NAME);
}

function ensureDir(cwd: string): void {
  if (!existsSync(dir(cwd))) mkdirSync(dir(cwd), { recursive: true });
}

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function identityPath(cwd: string): string {
  return join(dir(cwd), "identity.json");
}
export function delegationsPath(cwd: string): string {
  return join(dir(cwd), "delegations.json");
}
export function evidencePath(cwd: string): string {
  return join(dir(cwd), "evidence.json");
}

export function readIdentity(cwd: string): AlmaIdentity | undefined {
  return readJson<AlmaIdentity>(identityPath(cwd));
}

export function writeIdentity(cwd: string, identity: AlmaIdentity): void {
  ensureDir(cwd);
  writeJson(identityPath(cwd), identity);
}

export function readDelegations(cwd: string): Delegation[] {
  return readJson<Delegation[]>(delegationsPath(cwd)) ?? [];
}

export function addDelegation(cwd: string, delegation: Delegation): void {
  ensureDir(cwd);
  const all = readDelegations(cwd);
  writeJson(delegationsPath(cwd), [...all, delegation]);
}

export function readEvidence(cwd: string): ReputationEvidence[] {
  return readJson<ReputationEvidence[]>(evidencePath(cwd)) ?? [];
}

export function addEvidence(cwd: string, evidence: ReputationEvidence): void {
  ensureDir(cwd);
  const all = readEvidence(cwd);
  writeJson(evidencePath(cwd), [...all, evidence]);
}

export function writeDelegations(cwd: string, delegations: Delegation[]): void {
  ensureDir(cwd);
  writeJson(delegationsPath(cwd), delegations);
}

/** The agent's declared limits, next to its code: the file a person reads and reviews. */
export function manifestPath(cwd: string): string {
  return join(cwd, "alma.yaml");
}
export function issuerKeyPath(cwd: string): string {
  return join(dir(cwd), "issuer.key");
}
export function logPath(cwd: string): string {
  return join(dir(cwd), "log.json");
}
export function receiptsPath(cwd: string): string {
  return join(dir(cwd), "receipts.jsonl");
}

export function readManifestText(cwd: string): string | undefined {
  return existsSync(manifestPath(cwd)) ? readFileSync(manifestPath(cwd), "utf-8") : undefined;
}
export function writeManifestText(cwd: string, yaml: string): void {
  writeFileSync(manifestPath(cwd), yaml, "utf-8");
}

/** The local transparency log: its right edge (enough to extend it and compute its root) and every leaf, for proofs. */
export interface LocalLog {
  log: string;
  size: number;
  /** Subtree roots, hex, leftmost first (alma-core's Frontier). */
  frontier: string[];
  /** Leaf hashes, hex, in position order. */
  leaves: string[];
}

export function readLog(cwd: string): LocalLog | undefined {
  return readJson<LocalLog>(logPath(cwd));
}
export function writeLog(cwd: string, log: LocalLog): void {
  ensureDir(cwd);
  writeJson(logPath(cwd), log);
}

/** A receipt this project signed itself. `selfAttested` is always true here: nobody else vouched for it. */
export interface LocalReceipt {
  id: string;
  statement: unknown;
  mint: unknown;
  selfAttested: true;
}

export function readReceipts(cwd: string): LocalReceipt[] {
  if (!existsSync(receiptsPath(cwd))) return [];
  return readFileSync(receiptsPath(cwd), "utf-8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as LocalReceipt);
}
export function appendReceipt(cwd: string, receipt: LocalReceipt): void {
  ensureDir(cwd);
  appendFileSync(receiptsPath(cwd), JSON.stringify(receipt) + "\n", "utf-8");
}

export { ensureDir };
export const STORE_DIR_NAME = DIR_NAME;
