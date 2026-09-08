import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Terminal } from "@/components/Terminal";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-14">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text mb-5">
            ALMA — Version 0.1, Draft 0.2
          </p>
          <h1 className="font-display font-semibold text-5xl sm:text-6xl leading-[1.05] tracking-tight text-balance">
            A portable economic actor protocol
          </h1>
          <p className="font-display italic text-xl text-ink-soft mt-4">
            for humans, organizations, and autonomous agents.
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text mt-5">
            Identity · Representation · Authority · Relationships · Evidence · Intent
          </p>

          <p className="mt-8 text-[17px] leading-relaxed max-w-[62ch]">
            Economic agents are accumulating identity, authority, credentials, and
            transaction history across disconnected systems — a wallet here, an
            on-chain registry there, a commerce mandate somewhere else — but there
            is no common model tying those signals back to one persistent economic
            actor.{" "}
            <span className="font-display italic">
              ALMA turns fragmented identity, authority, and economic evidence into
              a persistent economic actor.
            </span>
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/protocol"
              className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors"
            >
              Read the protocol
            </Link>
            <Link
              href="/developers"
              className="px-5 py-2.5 rounded border border-line font-medium text-ink hover:border-accent hover:text-accent-text transition-colors"
            >
              Try it from the terminal
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-20">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
            One command, a real identity
          </p>
          <Terminal
            prompt="npx @adasouls/alma-cli connect"
            lines={[
              { text: "" },
              { text: "Connecting your agent to AdaSouls...", kind: "bold" },
              { text: "" },
              { text: "✓ Agent runtime detected: OpenAI Agents SDK", kind: "ok" },
              { text: "✓ ALMA identity created", kind: "ok" },
              { text: "✓ Linked to principal alma:main:org:acme-labs", kind: "ok" },
              { text: "○ Developer authentication (needs a hosted AdaSouls API — not built yet)", kind: "pending" },
              { text: "○ MCP connection (needs adasouls-mcp — not built yet)", kind: "pending" },
              { text: "" },
              { text: "ALMA ID:", kind: "dim" },
              { text: "alma:main:agent:treasury-agent", kind: "bold" },
            ]}
          />
          <p className="mt-4 text-sm text-ink-soft max-w-[60ch]">
            No fake checkmarks — steps this CLI can&apos;t actually do yet print as{" "}
            <span className="text-neutral-500 font-mono">○</span> pending, not a false{" "}
            <span className="text-emerald-600 font-mono">✓</span>. See the full walkthrough on the{" "}
            <Link href="/developers" className="text-accent-text hover:underline">
              Developers
            </Link>{" "}
            page.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
