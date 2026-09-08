# @adasouls/alma-cli

Give your agent a portable ALMA identity from the terminal.

```bash
npx @adasouls/alma-cli connect
```

```text
Connecting your agent to AdaSouls...

✓ Agent runtime detected: OpenAI Agents SDK
✓ ALMA identity created
✓ Linked to principal alma:main:org:acme-labs
✓ Bound 1 controller(s)
○ Developer authentication (needs a hosted AdaSouls API — not built yet)
○ MCP connection (needs adasouls-mcp — not built yet)
○ Economic API connection (needs adasouls-api — not built yet)

Your agent now has a portable ALMA identity.

ALMA ID:
alma:main:agent:treasury-agent
```

Then ask it who it is:

```bash
npx @adasouls/alma-cli whoami
```

```text
I am alma:main:agent:treasury-agent.
I represent alma:main:org:acme-labs.

I am authorized to:
  • pay
  • swap

My identity is linked to:
  • wallet: 0x8F1234567890abcdef1234567890ABCDEF21C

My economic history:
  • 3 recorded actions
  • 2 success, 1 disputed
  • 2 distinct counterparties
  • 2140 settled (recorded via `alma evidence add`)
```

## What this actually is

A **local-only, ALMA-protocol-only** CLI. It has no server of its own —
state lives in `./.alma/` in whatever project you run it from, the same
way `.git` does. `alma connect` doesn't create "another wallet identity";
it creates the persistent economic actor (an ALMA Subject) that wallets,
DIDs, credentials, and delegations get bound to afterward. See the ALMA
whitepaper for why that distinction matters.

## `○` markers are not bugs

Some `connect` output lines are dim `○`, not green `✓` — those steps
(developer auth, MCP, the Economic API) need `adasouls-api` /
`adasouls-mcp`, which don't exist yet in this workspace. This CLI never
prints a `✓` for something it didn't actually do.

## Commands

| Command | Does |
|---|---|
| `alma connect [--agent] [--org] [--wallet] [--did] [-y] [--force]` | Create this project's ALMA identity (real: `alma-core`). |
| `alma delegate --capabilities <list> [--issuer] [--subject] [--proof-format] [--proof-reference]` | Grant capabilities to this project's agent. |
| `alma evidence add --outcome <success\|failure\|disputed> [--counterparty] [--amount] [--role] [--source-type]` | Record reputation evidence you attest to — not a live feed. |
| `alma whoami` | The agent introspects its own local ALMA record. |

## Non-interactive / CI

```bash
npx @adasouls/alma-cli connect --agent treasury-agent --org alma:main:org:acme-labs --yes
```

## Planned, not built — do not confuse these with the commands above

The full AdaSouls platform CLI vision (`docs/21-developer-experience.md`
in the architecture workspace) includes `status`, `doctor`, `agent
connect`, `policy set`, `wallet connect`, `marketplace publish`, and
authenticated, multi-device identity via a real `adasouls-api`. None of
that is implemented here — it needs the hosted backend (roadmap Phases
3–14), not just the protocol library. This package may be absorbed into
a broader `@adasouls/cli` once that exists, rather than growing those
commands here as stubs.

## Development

```bash
npm install
npm test
npm run build
node dist/bin.js connect
```
