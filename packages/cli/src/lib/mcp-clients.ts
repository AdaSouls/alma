import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/** An MCP client's configuration file this machine has. */
export interface McpClient {
  name: string;
  path: string;
  /** Inside the project: safe to write without asking. Outside: only with --write-mcp-config. */
  inProject: boolean;
}

function claudeDesktopConfig(): string {
  const home = homedir();
  if (platform() === "darwin") return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  if (platform() === "win32") return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  return join(home, ".config", "Claude", "claude_desktop_config.json");
}

/** Which MCP clients are set up here: a project's .mcp.json, Cursor's, Claude Desktop's. Only files that exist. */
export function detectMcpClients(cwd: string): McpClient[] {
  const candidates: McpClient[] = [
    { name: "this project (.mcp.json)", path: join(cwd, ".mcp.json"), inProject: true },
    { name: "Cursor (this project)", path: join(cwd, ".cursor", "mcp.json"), inProject: true },
    { name: "Cursor", path: join(homedir(), ".cursor", "mcp.json"), inProject: false },
    { name: "Claude Desktop", path: claudeDesktopConfig(), inProject: false },
  ];
  return candidates.filter((c) => existsSync(c.path));
}

export const SERVER_NAME = "adasouls";

/** The entry that routes an agent's payments through AdaSouls. The key is the agent's own, from the AdaSouls console. */
export const serverEntry = () => ({ command: "npx", args: ["-y", "@adasouls/mcp"], env: { ADASOULS_API_KEY: "<your agent's api key>", ADASOULS_API_URL: "http://localhost:3000/v1" } });

export const snippet = () => JSON.stringify({ mcpServers: { [SERVER_NAME]: serverEntry() } }, null, 2);

export type WriteOutcome = "written" | "already there" | "unreadable";

/** Adds the entry to a client's file. Never replaces an existing "adasouls" entry, and never touches a file it can't parse. */
export function addServer(path: string): WriteOutcome {
  let config: { mcpServers?: Record<string, unknown> } & Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(path, "utf-8") || "{}");
  } catch {
    return "unreadable";
  }
  if (typeof config !== "object" || config === null || Array.isArray(config)) return "unreadable";
  if (config.mcpServers && SERVER_NAME in config.mcpServers) return "already there";
  config.mcpServers = { ...(config.mcpServers ?? {}), [SERVER_NAME]: serverEntry() };
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf-8");
  return "written";
}
