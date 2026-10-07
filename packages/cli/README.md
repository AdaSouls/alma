# @adasouls/alma-cli

Give a working agent an ALMA identity, declared limits and a signed
history, from the terminal, in one run.

```bash
npx @adasouls/alma-cli connect --org alma:main:org:acme-labs --wallet 0x8F12...21Cd \
  --capabilities pay --max-tx USDC=100 --daily USDC=500 --approve-above USDC=50 -y
```

```text
Connecting your agent to ALMA...

✓ Agent runtime detected: Claude / Anthropic SDK
✓ ALMA identity created
✓ Bound 1 controller(s)
✓ Linked to principal alma:main:org:acme-labs
✓ Limits declared in ./alma.yaml
    Capabilities: pay
    Per transaction: 100 USDC
    Per day: 500 USDC
    A person approves above: 50 USDC
    Assets: USDC
✓ alma:main:org:acme-labs delegates [pay] with those limits, until 2027-01-05
✓ Signing key created in ./.alma/issuer.key (key id ed25519-c35485e9338292ab6931da71059f1fea)
✓ Added .alma/issuer.key to .gitignore
✓ Empty signed history started in ./.alma/log.json
○ Route through AdaSouls (needs a running adasouls-api): payments are checked before anything is signed
    To do it over MCP, add this server to your client's configuration:
    {
      "mcpServers": {
        "adasouls": {
          "command": "npx",
          "args": [
            "-y",
            "@adasouls/mcp"
          ],
          "env": {
            "ADASOULS_API_KEY": "<your agent's api key>",
            "ADASOULS_API_URL": "http://localhost:3000/v1"
          }
        }
      }
    }

ALMA ID:
alma:main:agent:demo-treasury-agent

Limits: declared (advisory). Run npx @adasouls/alma-verifier doctor to see what would enforce them.
```

Then ask it who it is:

```bash
npx @adasouls/alma-cli whoami
```

```text
I am alma:main:agent:demo-treasury-agent.
I represent alma:main:org:acme-labs.

I am authorized to:
  • pay

My identity is linked to:
  • wallet: 0x8F1234567890abcdef1234567890ABCDEF1221Cd

My declared limits:
  • Capabilities: pay
  • Per transaction: 100 USDC
  • Per day: 300 USDC
  • A person approves above: 50 USDC
  • Assets: USDC
  • Enforcement: advisory (until `npx @adasouls/alma-verifier doctor` says otherwise)

My signed history (self-attested):
  • 1 signed receipt
  • Log head: 1 entry, root 79411ea4750c7eaa…, key ed25519-c35485e9338292ab6931da71059f1fea

No unsigned notes recorded.
```

## What this actually is

A **local** CLI. It has no server: state lives in `./.alma/` and the
limits in `./alma.yaml`, in whatever project you run it from, the way
`.git` does. `alma connect` doesn't create "another wallet identity"; it
creates the persistent economic actor (an ALMA Subject) that wallets,
DIDs, credentials and delegations get bound to. See the ALMA whitepaper
for why that distinction matters.

Three things to keep in mind about what it writes:

- **Limits are declared, not enforced.** They are configuration the
  agent's own code may or may not consult. What makes limits hold is
  where the agent's keys live: a service that checks before anything is
  signed, or the chain itself. `connect` ends by saying so.
- **History is self-attested.** The project signs its own receipts with
  its own key (`.alma/issuer.key`, readable by you only, kept out of
  git). That shows a record wasn't edited afterwards. It never counts as
  confirmed by the counterparty.
- **`○` lines are not bugs.** A dim `○` is a step this command didn't
  do. It never prints a `✓` for something that didn't happen.

## Commands

| Command | Does |
|---|---|
| `alma connect [--agent] [--org] [--wallet] [--did] [limits] [--write-mcp-config] [-y] [--force]` | Identity, then limits (a delegation with constraints and an expiry, and `alma.yaml`), then a signing key and an empty log. Safe to run again: it keeps what is there, and a `--wallet` or `--did` passed then is added to the identity. A verifier only counts a wallet's protection for an agent whose identity names that wallet. |
| `alma limits [limits]` | Show the declared limits, or change them. A change issues a new delegation and revokes the old one; nothing is edited in place. |
| `alma delegate --capabilities <list> [--issuer] [--subject] [--proof-format] [--proof-reference]` | Grant capabilities to this project's agent. |
| `alma evidence add --outcome <success\|failure\|disputed> [...]` | With `--tx-hash --chain --asset --to --counterparty --amount`: a signed receipt in the project's log. Otherwise an unsigned note. |
| `alma log head [--json]` | The signed head of the history (size and root), to share or anchor. |
| `alma whoami` | The agent describes itself: authority, limits, signed history and its enforcement level. |

Limits flags: `--capabilities pay,swap`, `--max-tx USDC=100`,
`--daily USDC=500`, `--approve-above USDC=50`, `--assets USDC`,
`--counterparty-min-tx 1`, `--expires 90d`. Anything not passed is asked
for with a default; `-y` takes the defaults without asking.

`--amount` for a signed receipt is a whole number in the asset's base
units (5 USDC is `5000000`), and `--chain` / `--asset` are CAIP-2 /
CAIP-19 ids, as in every ALMA receipt.

## Routing through AdaSouls

`connect` detects the MCP clients configured on the machine (a project's
`.mcp.json`, Cursor, Claude Desktop) and prints the server entry for
[`@adasouls/mcp`](https://www.npmjs.com/package/@adasouls/mcp). It writes
to those files only with `--write-mcp-config`, and never over an existing
entry. Routing needs a running `adasouls-api`.

## Not here

`alma doctor` lives in `@adasouls/alma-verifier`, which answers "what
enforces these limits?" for an agent. Wallet, policy and marketplace
management are the AdaSouls platform's, not this CLI's.

## Development

```bash
npm install
npm test
npm run build
node dist/bin.js connect
```
