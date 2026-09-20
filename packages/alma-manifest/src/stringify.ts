import { stringify } from "yaml";
import type { AgentManifest } from "./schema.js";

/** Renders a validated AgentManifest back to YAML text -- what `adasouls agent export` (a future CLI command, not built here) would write to a file. */
export function stringifyManifest(manifest: AgentManifest): string {
  return stringify(manifest);
}
