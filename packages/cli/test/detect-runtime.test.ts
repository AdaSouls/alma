import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectRuntime } from "../src/lib/detect-runtime.js";

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function withPackageJson(deps: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), "alma-cli-test-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: deps }));
  return dir;
}

describe("detectRuntime", () => {
  it("detects OpenAI", () => {
    expect(detectRuntime(withPackageJson({ openai: "^4.0.0" }))).toBe("OpenAI Agents SDK");
  });

  it("detects Claude/Anthropic", () => {
    expect(detectRuntime(withPackageJson({ "@anthropic-ai/sdk": "^0.30.0" }))).toBe("Claude / Anthropic SDK");
  });

  it("detects LangGraph", () => {
    expect(detectRuntime(withPackageJson({ "@langchain/langgraph": "^0.2.0" }))).toBe("LangGraph");
  });

  it("falls back to custom when nothing matches", () => {
    expect(detectRuntime(withPackageJson({ express: "^4.0.0" }))).toBe("custom runtime");
  });

  it("falls back when there's no package.json at all", () => {
    dir = mkdtempSync(join(tmpdir(), "alma-cli-test-"));
    expect(detectRuntime(dir)).toBe("custom runtime (no package.json found)");
  });
});
