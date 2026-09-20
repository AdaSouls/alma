---
"@adasouls/alma-manifest": minor
---

First release: Agent Manifest schema, YAML parser (`parseManifestYaml`), compiler (`compileManifest`, into the request payloads adasouls-api's REST endpoints expect), and the reverse direction (`buildManifest`/`stringifyManifest`, expressing a real agent's configuration as a manifest). Phase 9's exit criterion -- reference-agents/treasury-agent's own setup is now driven by treasury-agent.yaml through this package, not hardcoded.
