import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Terminal } from "@/components/Terminal";

export const metadata: Metadata = { title: "Developers" };

export default function DevelopersPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-text mb-4">Developers</p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-tight text-balance">
          Give a working agent an identity, limits and a signed history
        </h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[58ch]">
          <code className="font-mono bg-paper-raised border border-line rounded px-1.5 py-0.5">@adasouls/alma-cli</code>{" "}
          is local to your project: no server, no account, nothing sent anywhere. State lives in{" "}
          <code className="font-mono">./.alma/</code> and the limits in <code className="font-mono">./alma.yaml</code>, next to
          your code. The limits it writes are <strong>declared, not enforced</strong>: it says so, and says how to find out
          what would enforce them.
        </p>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">1. Connect</p>
          <Terminal
            prompt="npx @adasouls/alma-cli connect --org alma:main:org:acme-labs --wallet 0x8F12...21Cd --capabilities pay --max-tx USDC=100 --daily USDC=500 --approve-above USDC=50 -y"
            lines={[
              { text: "" },
              { text: "Connecting your agent to ALMA...", kind: "bold" },
              { text: "" },
              { text: "✓ Agent runtime detected: Claude / Anthropic SDK", kind: "ok" },
              { text: "✓ ALMA identity created", kind: "ok" },
              { text: "✓ Bound 1 controller(s)", kind: "ok" },
              { text: "✓ Linked to principal alma:main:org:acme-labs", kind: "ok" },
              { text: "✓ Limits declared in ./alma.yaml", kind: "ok" },
              { text: "    Capabilities: pay", kind: "dim" },
              { text: "    Per transaction: 100 USDC", kind: "dim" },
              { text: "    Per day: 500 USDC", kind: "dim" },
              { text: "    A person approves above: 50 USDC", kind: "dim" },
              { text: "    Assets: USDC", kind: "dim" },
              { text: "✓ alma:main:org:acme-labs delegates [pay] with those limits, until 2027-01-05", kind: "ok" },
              { text: "✓ Signing key created in ./.alma/issuer.key (key id ed25519-c35485e9338292ab6931da71059f1fea)", kind: "ok" },
              { text: "✓ Added .alma/issuer.key to .gitignore", kind: "ok" },
              { text: "✓ Empty signed history started in ./.alma/log.json", kind: "ok" },
              { text: "○ Route through AdaSouls (needs a running adasouls-api): payments are checked before anything is signed", kind: "pending" },
              { text: "    To do it over MCP, add this server to your client's configuration:", kind: "dim" },
              { text: "    {", kind: "dim" },
              { text: "      \"mcpServers\": {", kind: "dim" },
              { text: "        \"adasouls\": {", kind: "dim" },
              { text: "          \"command\": \"npx\",", kind: "dim" },
              { text: "          \"args\": [", kind: "dim" },
              { text: "            \"-y\",", kind: "dim" },
              { text: "            \"@adasouls/mcp\"", kind: "dim" },
              { text: "          ],", kind: "dim" },
              { text: "          \"env\": {", kind: "dim" },
              { text: "            \"ADASOULS_API_KEY\": \"<your agent's api key>\",", kind: "dim" },
              { text: "            \"ADASOULS_API_URL\": \"http://localhost:3000/v1\"", kind: "dim" },
              { text: "          }", kind: "dim" },
              { text: "        }", kind: "dim" },
              { text: "      }", kind: "dim" },
              { text: "    }", kind: "dim" },
              { text: "" },
              { text: "ALMA ID:", kind: "dim" },
              { text: "alma:main:agent:demo-treasury-agent", kind: "bold" },
              { text: "" },
              { text: "Limits: declared (advisory). Run npx @adasouls/alma-verifier doctor to see what would enforce them.", kind: "plain" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">2. Record a payment, signed</p>
          <Terminal
            prompt="alma evidence add --outcome success --counterparty alma:main:agent:research-02 --amount 5000000 --tx-hash 0x5c1f...6677 --chain eip155:84532 --asset eip155:84532/erc20:0x036c...cf7e --to 0x1111...1111"
            lines={[
              { text: "✓ Signed receipt rcp_act_c4f9b78d-202d-4c68-9b2a-68f187755c32: paid alma:main:agent:research-02 (position 0 in this project's log)", kind: "ok" },
              { text: "Self-attested: signed with this project's own key. It doesn't count as confirmed by the counterparty.", kind: "dim" },
              { text: "Saved to ./.alma/receipts.jsonl", kind: "dim" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">3. Change a limit</p>
          <Terminal
            prompt="alma limits --daily USDC=300"
            lines={[
              { text: "✓ Limits updated in ./alma.yaml", kind: "ok" },
              { text: "    Capabilities: pay", kind: "dim" },
              { text: "    Per transaction: 100 USDC", kind: "dim" },
              { text: "    Per day: 300 USDC", kind: "dim" },
              { text: "    A person approves above: 50 USDC", kind: "dim" },
              { text: "    Assets: USDC", kind: "dim" },
              { text: "✓ Revoked 1 earlier delegation(s)", kind: "ok" },
              { text: "✓ alma:main:org:acme-labs delegates [pay] with the new limits, until 2027-01-05", kind: "ok" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">4. Ask your agent who it is</p>
          <Terminal
            prompt="alma whoami"
            lines={[
              { text: "" },
              { text: "I am alma:main:agent:demo-treasury-agent.", kind: "bold" },
              { text: "I represent alma:main:org:acme-labs.", kind: "plain" },
              { text: "" },
              { text: "I am authorized to:", kind: "bold" },
              { text: "  • pay", kind: "plain" },
              { text: "" },
              { text: "My identity is linked to:", kind: "plain" },
              { text: "  • wallet: 0x8F1234567890abcdef1234567890ABCDEF1221Cd", kind: "plain" },
              { text: "" },
              { text: "My declared limits:", kind: "plain" },
              { text: "  • Capabilities: pay", kind: "plain" },
              { text: "  • Per transaction: 100 USDC", kind: "plain" },
              { text: "  • Per day: 300 USDC", kind: "plain" },
              { text: "  • A person approves above: 50 USDC", kind: "plain" },
              { text: "  • Assets: USDC", kind: "plain" },
              { text: "  • Enforcement: advisory (until `npx @adasouls/alma-verifier doctor` says otherwise)", kind: "plain" },
              { text: "" },
              { text: "My signed history (self-attested):", kind: "plain" },
              { text: "  • 1 signed receipt", kind: "plain" },
              { text: "  • Log head: 1 entry, root 79411ea4750c7eaa…, key ed25519-c35485e9338292ab6931da71059f1fea", kind: "plain" },
              { text: "" },
              { text: "No unsigned notes recorded.", kind: "dim" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">5. Share the head of its history</p>
          <Terminal
            prompt="alma log head"
            lines={[
              { text: "Log   local-main-agent-demo-treasury-agent", kind: "plain" },
              { text: "Size  1 entry", kind: "plain" },
              { text: "Root  79411ea4750c7eaa28e6cc6ad5f5e7449c2552167763c4000344a667cd5267c9", kind: "plain" },
              { text: "Key   ed25519-c35485e9338292ab6931da71059f1fea", kind: "plain" },
              { text: "Signed by this project's own key: self-attested. Pass --json for the signed head itself.", kind: "dim" },
            ]}
          />
          <p className="text-sm text-ink-soft mt-3 max-w-[60ch]">
            Every line above came from an actual run of the CLI against a scratch project — nothing on this page is a mockup.
          </p>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-display font-semibold text-2xl mb-3">What this does and doesn&apos;t do</h2>
          <p className="text-ink-soft max-w-[62ch] mb-4">
            It gives the agent an identity, writes its limits where you can review them, and starts a history signed with
            the project&apos;s own key. That history is <strong>self-attested</strong>: it shows a record wasn&apos;t edited
            afterwards, not that a counterparty agrees with it. And the limits bind only an agent whose code consults them.
            What makes them hold is where the agent&apos;s keys live: a service that checks before anything is signed, or
            the chain itself. This CLI never prints a check for something it didn&apos;t do.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://github.com/AdaSouls/alma/tree/develop/packages/cli"
              className="px-4 py-2 rounded border border-line text-sm font-medium hover:border-accent hover:text-accent-text transition-colors"
            >
              packages/cli on GitHub
            </Link>
            <Link
              href="/protocol"
              className="px-4 py-2 rounded border border-line text-sm font-medium hover:border-accent hover:text-accent-text transition-colors"
            >
              Read the protocol
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
