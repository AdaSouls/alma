---
"@adasouls/alma-core": minor
---

Agent reports: figures only the agent knows (compute cost, model, tokens, duration), declared by the agent and signed by the issuer as `alma-agent-report/1` envelopes (`signAgentReport`, `verifyAgentReport`). `envelopeLeafHash` accepts them, so they enter the transparency log next to receipts.
