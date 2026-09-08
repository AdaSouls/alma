import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface RuntimeMatch {
  label: string;
  packages: string[];
}

/**
 * Best-effort detection only — informational, per ALMA's own model
 * (`docs/12-agent-lifecycle.md`): the runtime/model a project uses is
 * never something ALMA needs to trust or validate for authorization, it's
 * just a label for the person running this command.
 */
const RUNTIMES: RuntimeMatch[] = [
  { label: "OpenAI Agents SDK", packages: ["openai", "@openai/agents"] },
  { label: "Claude / Anthropic SDK", packages: ["@anthropic-ai/sdk", "@anthropic-ai/claude-agent-sdk"] },
  { label: "LangGraph", packages: ["@langchain/langgraph"] },
  { label: "LangChain", packages: ["langchain", "@langchain/core"] },
  { label: "CrewAI-style (Python)", packages: [] },
];

export function detectRuntime(cwd: string): string {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return "custom runtime (no package.json found)";

  let deps: Record<string, string> = {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return "custom runtime (package.json unreadable)";
  }

  for (const runtime of RUNTIMES) {
    if (runtime.packages.some((p) => p in deps)) return runtime.label;
  }
  return "custom runtime";
}
