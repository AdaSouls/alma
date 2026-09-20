import { parse as parseYamlText } from "yaml";
import { unwrap } from "@adasouls/alma-core";
import { agentManifestSchema, type AgentManifest } from "./schema.js";

/**
 * `adasouls agent apply treasury-agent.yaml`'s first step
 * (docs/21-developer-experience.md) -- parses and validates, fails
 * loudly and specifically (which field, why) rather than a generic YAML
 * or schema error, matching alma-core's own AlmaValidationError
 * convention (unwrap()).
 */
export function parseManifestYaml(yamlText: string): AgentManifest {
  const raw = parseYamlText(yamlText);
  return unwrap(agentManifestSchema.safeParse(raw), "manifest");
}
