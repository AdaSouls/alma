import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

export const STORE_DIR_NAME = DIR_NAME;
