import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createIdentity, createDelegation } from "@adasouls/alma-core";
import { readIdentity, writeIdentity, addDelegation, readDelegations } from "../src/lib/project-store.js";

let dir: string;

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("project-store", () => {
  it("round-trips an identity through ./.alma/identity.json", () => {
    dir = mkdtempSync(join(tmpdir(), "alma-cli-store-"));
    expect(readIdentity(dir)).toBeUndefined();

    const identity = createIdentity({ subjectType: "agent", displayName: "Treasury Agent" });
    writeIdentity(dir, identity);

    expect(readIdentity(dir)).toEqual(identity);
  });

  it("appends delegations rather than overwriting", () => {
    dir = mkdtempSync(join(tmpdir(), "alma-cli-store-"));
    const a = createDelegation({ issuer: "alma:main:org:acme", subject: "alma:main:agent:t", scope: { capabilities: ["pay"] } });
    const b = createDelegation({ issuer: "alma:main:org:acme", subject: "alma:main:agent:t", scope: { capabilities: ["swap"] } });

    addDelegation(dir, a);
    addDelegation(dir, b);

    expect(readDelegations(dir)).toEqual([a, b]);
  });
});
