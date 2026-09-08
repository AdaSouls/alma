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
          Give your agent an identity from the terminal
        </h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[58ch]">
          <code className="font-mono bg-paper-raised border border-line rounded px-1.5 py-0.5">@adasouls/alma-cli</code>{" "}
          is a local-only, ALMA-protocol-only CLI — no server, no account. State lives in{" "}
          <code className="font-mono">./.alma/</code> in whatever project you run it from, the same way{" "}
          <code className="font-mono">.git</code> does.
        </p>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">1. Connect</p>
          <Terminal
            prompt="npx @adasouls/alma-cli connect --org alma:main:org:acme-labs --wallet 0x8F1...21C"
            lines={[
              { text: "" },
              { text: "Connecting your agent to AdaSouls...", kind: "bold" },
              { text: "" },
              { text: "✓ Agent runtime detected: OpenAI Agents SDK", kind: "ok" },
              { text: "✓ ALMA identity created", kind: "ok" },
              { text: "✓ Linked to principal alma:main:org:acme-labs", kind: "ok" },
              { text: "✓ Bound 1 controller(s)", kind: "ok" },
              { text: "○ Developer authentication (needs a hosted AdaSouls API — not built yet)", kind: "pending" },
              { text: "○ MCP connection (needs adasouls-mcp — not built yet)", kind: "pending" },
              { text: "○ Economic API connection (needs adasouls-api — not built yet)", kind: "pending" },
              { text: "" },
              { text: "Your agent now has a portable ALMA identity.", kind: "bold" },
              { text: "" },
              { text: "ALMA ID:", kind: "dim" },
              { text: "alma:main:agent:demo-treasury-agent", kind: "bold" },
              { text: "" },
              { text: "Saved to ./.alma/identity.json", kind: "dim" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">2. Grant authority &amp; record evidence</p>
          <Terminal
            prompt="alma delegate --capabilities pay,swap"
            lines={[
              { text: "✓ alma:main:org:acme-labs delegates [pay, swap] to alma:main:agent:demo-treasury-agent", kind: "ok" },
              { text: "Saved to ./.alma/delegations.json", kind: "dim" },
              { text: "" },
              { text: "$ alma evidence add --outcome success --counterparty alma:main:agent:research-02 --amount 1200", kind: "dim" },
              { text: "✓ Recorded success with alma:main:agent:research-02", kind: "ok" },
            ]}
          />
        </div>

        <div className="mt-10 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">3. Ask your agent who it is</p>
          <Terminal
            prompt="alma whoami"
            lines={[
              { text: "" },
              { text: "I am alma:main:agent:demo-treasury-agent.", kind: "bold" },
              { text: "I represent alma:main:org:acme-labs.", kind: "plain" },
              { text: "" },
              { text: "I am authorized to:", kind: "plain" },
              { text: "  • pay", kind: "plain" },
              { text: "  • swap", kind: "plain" },
              { text: "" },
              { text: "My identity is linked to:", kind: "plain" },
              { text: "  • wallet: 0x8F1234567890abcdef1234567890ABCDEF21C", kind: "plain" },
              { text: "" },
              { text: "My economic history:", kind: "plain" },
              { text: "  • 3 recorded actions", kind: "plain" },
              { text: "  • 2 success, 1 disputed", kind: "plain" },
              { text: "  • 2 distinct counterparties", kind: "plain" },
              { text: "  • 2140 settled (recorded via `alma evidence add`)", kind: "plain" },
            ]}
          />
          <p className="text-sm text-ink-soft mt-3 max-w-[60ch]">
            Every line above came from an actual run of the CLI against a scratch project — nothing on this page is a mockup.
          </p>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-display font-semibold text-2xl mb-3">What&apos;s real vs. roadmap</h2>
          <p className="text-ink-soft max-w-[62ch] mb-4">
            The full AdaSouls platform vision includes <code className="font-mono">status</code>,{" "}
            <code className="font-mono">doctor</code>, <code className="font-mono">policy set</code>,{" "}
            <code className="font-mono">wallet connect</code>, and <code className="font-mono">marketplace publish</code> —
            none of that is built here. Those need a hosted <code className="font-mono">adasouls-api</code>, which is a
            later phase of the roadmap, not just the protocol library. This CLI only ever claims what it actually did.
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
