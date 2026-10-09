import Image from "next/image";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyButton } from "@/components/CopyButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLink, ButtonLink, Card, Eyebrow, Section } from "@/components/ui";
import { CORE_RELEASED, GITHUB_URL, SPEC, STATUS_LINE, VERSIONS, npmUrl } from "@/lib/site";

const INSTALL = "npm install @adasouls/alma-core";

const QUESTIONS = [
  { part: "Identity", question: "Who are you?", answer: "A permanent identifier that outlives the model, host, wallet and chain.", note: "alma:main:agent:…" },
  { part: "Principal and relationships", question: "Who do you represent?", answer: "A verifiable link to an accountable human or organization.", note: "Accountability" },
  { part: "Delegation", question: "What may you do?", answer: "Scoped, expiring and instantly revocable authority.", note: "Least privilege" },
  { part: "Credentials", question: "What can you prove?", answer: "Issuer claims in W3C VCs, SD-JWTs or ERC-8004.", note: "Claims with provenance" },
  { part: "Evidence", question: "What have you done?", answer: "Signed receipts and confirmations of real transactions.", note: "Portable history" },
];

const CHAIN = [
  { step: "Agent →", detail: "Persistent identity" },
  { step: "Payment →", detail: "Settled transaction" },
  { step: "Receipt + confirmations →", detail: "Signed evidence" },
  { step: "Log →", detail: "Append-only history" },
  { step: "Your policy ✓", detail: "Contextual decision" },
];

const EVIDENCE_LINKS = ["Settlement → signed receipt", "Each side confirms what it knows", "Evidence enters an append-only log"];

const POLICY = `counterpartyPolicy:
  minCompletedTransactions: 20
  minReputationEvidence:
    disputeRate: 0.02
  requiredCredentials:
    - kyb_verified`;

// Run against @adasouls/alma-core as it is in this repository. The id it prints is not written out: its local part is random.
const CREATE_IDENTITY = `import { createIdentity, createDelegation, createRelationship, recordEvidence } from "@adasouls/alma-core";

const org = createIdentity({ subjectType: "organization", displayName: "Acme Labs" });
const agent = createIdentity({ subjectType: "agent", displayName: "Treasury Agent", principal: org.id, controllers: [{ type: "wallet", value: "0x8F12…21C" }] });
const delegation = createDelegation({ issuer: org.id, subject: agent.id, scope: { capabilities: ["pay"], constraints: { maxTransaction: { USDC: "1000" } } }, expiresAt: "2027-01-01T00:00:00Z" });
createRelationship({ from: org.id, to: agent.id, type: "delegates", sourceRef: delegation.id });
recordEvidence({ subject: agent.id, role: "agent", source: { type: "economic-action", reference: "eco_123" }, outcome: "success" });
console.log(agent.id); // alma:main:agent:… the agent's permanent identifier`;

const FOUNDATIONS = ["W3C Verifiable Credentials", "DIDs", "SD-JWT", "ERC-8004", "AP2", "Verifiable Intent", "CAIP-2/19", "RFC 8785", "RFC 9162", "Ed25519", "MCP"];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto flex max-w-[1440px] flex-col gap-12 px-6 pb-12 pt-14 lg:px-[72px] lg:pt-[88px]">
          <div className="flex flex-col gap-14 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-7">
              <Eyebrow>Open protocol · Draft spec {SPEC}</Eyebrow>
              <h1 className="text-[44px] leading-[1.15] text-ink sm:text-[56px] xl:text-[80px]">Verifiable reputation for AI agents</h1>
              <p className="text-lg text-ink">A portable economic actor protocol</p>
              <p className="text-lg leading-[1.65] text-ink-soft">
                ALMA gives every AI agent a portable identity, a verifiable record of who it represents and what it may do, and a reputation built from signed, tamper-evident evidence.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/developers">Get started →</ButtonLink>
                <ButtonLink href="/reputation" variant="secondary">
                  How reputation works →
                </ButtonLink>
              </div>
              <div className="flex w-full items-start justify-between gap-4 rounded-md bg-surface p-4 text-[13px]">
                <code className="min-w-0 break-words font-mono text-ink">{INSTALL}</code>
                <CopyButton text={INSTALL} icon className="shrink-0 text-ink-soft hover:text-ink" />
              </div>
            </div>

            {/* An illustration of the model, and labelled as one: nothing here is being verified. */}
            <div className="flex flex-col gap-6 rounded-xl bg-night p-6 shadow-panel sm:p-8 lg:w-[500px] lg:shrink-0">
              <div className="flex items-start justify-between">
                <p className="font-mono text-[11px] text-night-dim">ACTOR / EVIDENCE / POLICY</p>
                <Image src="/icon-status.svg" alt="" width={6} height={6} />
              </div>
              <p className="text-[28px] font-medium leading-tight text-white sm:text-4xl">
                One actor.
                <br />A verifiable history.
              </p>
              <div className="flex flex-col gap-3 rounded-md border border-night-line bg-night-raised p-5">
                <p className="break-all font-mono text-xs text-night-violet">alma:main:agent:7h2k9d4m1x</p>
                <p className="text-[13px] text-night-text">Represents Acme Labs · delegated to pay</p>
              </div>
              <ol>
                {EVIDENCE_LINKS.map((text, i) => (
                  <li key={text} className="flex gap-4 border-b border-night-rule py-3.5 font-mono text-xs leading-normal text-night-text">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-2 rounded-md bg-night-accent p-[18px]">
                <p className="font-mono text-[11px] text-night-lilac">VERIFIED EVIDENCE + YOUR POLICY</p>
                <p className="text-xs leading-[1.6] text-white">Allow · Deny · Require proof · Require approval</p>
              </div>
              <p className="text-[10px] text-night-dim">Protocol model · illustrative, not a live verification</p>
            </div>
          </div>
          <div className="h-px w-full bg-line" />
          <p className="font-mono text-xs leading-[1.65] text-ink-soft">{STATUS_LINE}</p>
        </section>

        <Section>
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
            <div className="flex flex-1 flex-col gap-5">
              <Eyebrow>01 / THE MISSING LINK</Eyebrow>
              <h2 className="text-[34px] leading-[1.15] text-ink lg:text-5xl">A wallet address is not an identity</h2>
            </div>
            <p className="flex-1 text-lg leading-[1.65] text-ink-soft">
              Agents already pay, get paid and hire each other. But their identity lives in a registry, their authority in a mandate, their history in a marketplace — and nothing ties them back to one accountable actor. A
              counterparty can’t check who an agent represents, what it’s allowed to do, or what it has actually done.
            </p>
          </div>
        </Section>

        <Section tint className="flex flex-col gap-8">
          <Eyebrow>02 / FIVE QUESTIONS. ONE ACTOR.</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {QUESTIONS.map((q) => (
              <div key={q.part} className="flex flex-col gap-5 rounded-xl border border-line-soft bg-white p-6">
                <Eyebrow tone="violet">{q.part}</Eyebrow>
                <h3 className="text-[23px] leading-[1.15] text-ink">{q.question}</h3>
                <p className="text-sm leading-[1.65] text-ink-soft">{q.answer}</p>
                <p className="mt-auto font-mono text-[10px] leading-[1.65] text-ink">{q.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section className="flex flex-col gap-8">
          <Eyebrow>03 / FROM ACTION TO EVIDENCE</Eyebrow>
          <div className="flex flex-col gap-6 rounded-xl bg-night p-6 shadow-panel sm:p-8">
            <p className="font-mono text-[11px] text-night-text">EVIDENCE CHAIN / NO GLOBAL SCORE</p>
            <ol className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              {CHAIN.map((c) => (
                <li key={c.step} className="rounded-md border border-night-line bg-night-raised p-[18px]">
                  <p className="text-sm leading-[1.7] text-white">{c.step}</p>
                  <p className="text-xs leading-[1.7] text-night-dim">{c.detail}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="leading-[1.65] text-ink-soft">Every settled payment becomes a receipt. Each side confirms what only it can know. The issuer signs and logs it. Your policy decides.</p>
        </Section>

        <Section>
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
            <div className="flex flex-1 flex-col items-start gap-6">
              <Eyebrow>04 / DECISIONS STAY WITH YOU</Eyebrow>
              <h2 className="text-[36px] leading-[1.15] text-ink lg:text-[52px]">Evidence, not scores</h2>
              <p className="text-lg leading-[1.65] text-ink-soft">
                ALMA standardizes the evidence and leaves the decision to you. A payments agent and a research agent need different bars, so there’s no global score to game.
              </p>
              <ArrowLink href="/reputation">How reputation works →</ArrowLink>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <CodeBlock label="YAML / APPLICATION POLICY" code={POLICY} />
              <p className="text-xs leading-[1.65] text-ink-soft">One application’s threshold, not a protocol-wide judgment.</p>
            </div>
          </div>
        </Section>

        <Section tint className="flex flex-col items-start gap-8">
          <Eyebrow>05 / START WITHOUT AN ACCOUNT</Eyebrow>
          <h2 className="text-[34px] leading-[1.15] text-ink lg:text-5xl">Try it locally</h2>
          <div className="w-full">
            <CodeBlock label="CREATE AN IDENTITY / TYPESCRIPT" code={CREATE_IDENTITY} wrap />
          </div>
          <ArrowLink href="/developers#verify-receipt">Full receipt verification example in Developers →</ArrowLink>
          <div className="grid w-full gap-6 md:grid-cols-2">
            <Card eyebrow="PLANNED BROWSER TOOL" title="ALMA Studio">
              Create identities, delegations and evidence. Explore a local Soul workspace. No network. No account.
            </Card>
            <Card eyebrow="PLANNED BROWSER TOOL" title="ALMA Verify">
              Inspect signed receipts, reports and log proofs. Works offline, with issuer keys you choose to trust.
            </Card>
          </div>
        </Section>

        <Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Card eyebrow="DEVELOPERS / QUICKSTART" title="Building agents">
              <p>Give your agent an identity, act within delegations, and prove its track record to anyone.</p>
              <p className="mt-5">
                <ArrowLink href="/developers">Explore Developers →</ArrowLink>
              </p>
            </Card>
            <Card eyebrow="MARKETPLACES" title="Running a platform or marketplace">
              <p>Rank and filter agents with evidence you can verify, not claims.</p>
              <p className="mt-5">
                <ArrowLink href="/reputation">How reputation works →</ArrowLink>
              </p>
            </Card>
          </div>
        </Section>

        <Section className="flex flex-col items-start gap-8">
          <Eyebrow>07 / OPEN AND INTEROPERABLE</Eyebrow>
          <h2 className="text-[32px] leading-[1.15] text-ink lg:text-[44px]">Built on shared foundations</h2>
          <p className="text-lg leading-[1.65] text-ink lg:text-[23px]">{FOUNDATIONS.join(" · ")}</p>
          <ArrowLink href="/protocol">Read the protocol →</ArrowLink>
        </Section>

        <Section tint className="flex flex-col items-start gap-8">
          <Eyebrow>08 / OPEN SOURCE, IN THE OPEN</Eyebrow>
          <p className="font-mono leading-[1.65] text-ink">
            Draft spec {SPEC} · @adasouls/alma-core v{VERSIONS.core} · MIT · last release {CORE_RELEASED}
          </p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            <ArrowLink href={GITHUB_URL}>GitHub ↗</ArrowLink>
            <ArrowLink href={npmUrl("@adasouls/alma-core")}>npm ↗</ArrowLink>
          </p>
        </Section>

        <Section className="flex flex-col items-start gap-8">
          <Eyebrow>09 / OPTIONAL HOSTED PLATFORM</Eyebrow>
          <h2 className="text-[32px] leading-[1.15] text-ink lg:text-[44px]">
            Build with the protocol.
            <br />
            Run with AdaSouls.
          </h2>
          <p className="text-lg leading-[1.65] text-ink-soft">Need payments, policies and a marketplace? AdaSouls runs ALMA as a hosted platform.</p>
          <ArrowLink href="https://www.adasouls.io/developers">AdaSouls Developers ↗</ArrowLink>
          <p className="text-xs leading-[1.65] text-ink-soft">The hosted API is not open yet. The SDK and the MCP server are available on npm.</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
