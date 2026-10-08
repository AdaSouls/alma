import type { Metadata } from "next";
import { CodeBlock } from "@/components/CodeBlock";
import { ArticleSection, DocLayout, PageIntro, Prose } from "@/components/Doc";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Definitions, DocList, Mono, PullQuote, Standout, SubHeading } from "@/components/protocol/parts";
import { RefTable } from "@/components/ui";
import { editUrl } from "@/lib/site";

const TITLE = "An identity, trust, and intent protocol for autonomous economic agents";
const LEAD =
  "Who is this agent? Can it be trusted? What does it actually want to do? — three questions the infrastructure that lets agents move money has never had to answer, until it had to.";

export const metadata: Metadata = {
  title: TITLE,
  description: LEAD,
  alternates: { canonical: "/protocol" },
};

// The anchors are the ones this page has always had, so links to a section keep working.
const SECTIONS = [
  "The Missing Layer",
  "Design Principles",
  "The ALMA Model",
  "The Authority Layer",
  "The Trust Layer",
  "The Intent Layer",
  "Revocation & Lifecycle",
  "Interoperability",
  "Privacy",
  "Governance & Versioning",
  "The Minimum Viable Protocol",
  "Conclusion",
].map((name, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: `s${n}`, label: `${n} ${name}`, title: `${n} / ${name}` };
});

const PRINCIPLES = [
  { term: "Identity outlives runtime", meaning: "An agent's identity, delegated authority, and accumulated reputation must survive a change of model, host, wallet, or chain." },
  { term: "Evidence before scores", meaning: "ALMA stores verifiable, attributable evidence and leaves scoring, if anyone wants it, as something built on top of that evidence — not baked into the protocol." },
  { term: "Protocol, not platform", meaning: "ALMA specifies shapes, identifiers, and semantics — not who hosts the data or what UI configures it." },
  { term: "Intent, not authorization", meaning: "ALMA defines how an agent expresses what it wants to do, not whether that expression is allowed." },
  { term: "Custody-agnostic, execution-agnostic", meaning: "ALMA has no opinion on which wallet, chain, or payment rail eventually moves value." },
  {
    term: "Own the model, not the infrastructure",
    meaning:
      "Authentication is FIDO/WebAuthn's job. Credential formats are W3C VC's. Commerce authorization is AP2's and Verifiable Intent's. On-chain reputation is ERC-8004's. Where the answer is infrastructure, ALMA references it instead of reinventing it.",
  },
];

const SUBJECTS = [
  [<Mono key="t">human</Mono>, "A person."],
  [<Mono key="t">organization</Mono>, "A legal or informal entity."],
  [<Mono key="t">agent</Mono>, "An AI agent — capable of holding delegated authority and expressing economic intent."],
];

const REPUTATION_STREAMS = [
  ["principal reputation", "Has this human or organization been a trustworthy counterparty across everything it authorizes?"],
  ["agent reputation", "Has this specific agent performed reliably?"],
];

const STANDARDS = [
  ["DID", "Identifiers, controllers, resolution.", "Adopt — as a controller mechanism."],
  ["W3C Verifiable Credentials", "Issuer-signed, verifiable claims.", "Adopt — default credential format."],
  ["ERC-8004", "On-chain agent registry & reputation feedback.", "Consume — as an identity binding & evidence source."],
  ["AP2 (Agent Payments Protocol)", "Commerce authorization — checkout & payment mandates.", "Consume — as a delegation/intent proof source."],
  ["Verifiable Intent", "Cryptographic chains linking human-granted scope to agent action.", "Consume — as a delegation/intent proof source."],
];

const IDENTIFIERS = `// alma:<network>:<subject-type>:<local-id>
alma:main:human:8f2a...
alma:main:org:acme-labs
alma:main:agent:treasury-01`;

const BINDINGS = `alma:main:agent:treasury-42
  controller: did:key:z6Mk...
  binding:    erc8004:base:291
  binding:    wallet:0xAbCd...
  binding:    endpoint:https://agent.acme.com/a2a`;

const DELEGATION = `Delegation {
  issuer:  alma:main:org:acme-labs
  subject: alma:main:agent:treasury-01
  scope:   { capabilities: ["pay", "swap"], constraints: [...] }
  status:  active | revoked | expired
  proof:   { format: "ap2-mandate" | "verifiable-intent" | "w3c-vc" | "alma-native", reference: ... }
}`;

const CREDENTIAL = `CredentialEvidence {
  subject:  alma:main:org:acme-labs
  issuer:   alma:main:org:kyb-verifier
  type:     "kyb_verified"
  claim:    { tier: "institutional" }
  format:   "w3c-vc" | "sd-jwt" | "erc8004" | "alma-native"
  artifact: ...
}`;

const GRAPH = `Human    --owns-->      Organization
Organization --delegates--> Agent A
Agent A  --hired-->     Agent B
Agent B  --operated_by--> Organization B
Agent A  --paid-->      Agent B`;

const INTENT = `EconomicIntent {
  actor:               alma:main:agent:treasury-01
  principal:           alma:main:org:acme-labs
  authorityReference:  del_9f3a...
  capability:          "pay"
  parameters:          { amount: "10", asset: "USDC", to: alma:main:agent:research-02 }
  representation:      { format: "ap2-mandate" | "verifiable-intent" | "alma-native", reference: ... }
}`;

export default function ProtocolPage() {
  const [missing, principles, model, authority, trust, intent, revocation, interop, privacy, governance, minimum, conclusion] = SECTIONS;

  return (
    <>
      <Header />
      <main>
        <PageIntro eyebrow="PROTOCOL / ALMA — VERSION 0.1, DRAFT 0.2" title={TITLE} lead={LEAD} />

        <DocLayout contents={SECTIONS} edit={editUrl("src/app/protocol/page.tsx")} updated="8 October 2026">
          <ArticleSection id={missing.id} title={missing.title}>
            <Standout>A wallet address is not an identity.</Standout>
            <Prose>
              Every agent that transacts today answers &quot;how do I move money&quot; by picking a wallet SDK. Almost none can answer, in a way a counterparty could actually verify: who do you represent? What have you done
              before, and can I check it myself? Is what you&apos;re about to do actually something you&apos;re authorized to do, or just something your code happens to be capable of? If I stop trusting you, or you change
              which model or wallet you run on, does any of that history and authority survive?
            </Prose>
            <Prose>
              Zoom out and the deeper problem isn&apos;t any single missing feature — it&apos;s fragmentation. An agent&apos;s identity lives in a registry. Its authorization lives in a mandate. Its credentials live with an
              issuer. Its transaction history lives in a marketplace. Each piece can be individually verifiable and still add up to nothing, because nothing ties them back to the same underlying actor.
            </Prose>
            <Prose>
              This is the gap ALMA fills — not by building another payment rail, identity registry, or credential format, but by giving every economic actor a durable identity connecting what it represents, what it&apos;s
              allowed to do, what it has done, and what it wants to do next.
            </Prose>
          </ArticleSection>

          <ArticleSection id={principles.id} title={principles.title}>
            <Definitions items={PRINCIPLES} />
          </ArticleSection>

          <ArticleSection id={model.id} title={model.title}>
            <SubHeading>3.1 — Subjects</SubHeading>
            <RefTable columns={["Subject", "Definition"]} rows={SUBJECTS} />
            <Prose>
              Treating Human, Organization, and Agent as instances of the same underlying concept — a <strong className="font-semibold">Subject</strong> — is deliberate: no adjacent standard defines this. DID gives you an
              identifier, W3C VC gives you a claim, ERC-8004 gives you an agent registry entry — none say <em>Agent X represents Organization Y</em>.
            </Prose>

            <SubHeading>3.2 — Principals and Representation</SubHeading>
            <Prose>
              A <strong className="font-semibold">Principal</strong> is a Subject that can hold economic authority and be represented — almost always a Human or an Organization, though an Agent can itself act as a Principal
              when it delegates a narrower scope onward. An Agent always represents a Principal; it is never a free-floating actor with authority of its own origin.
            </Prose>

            <SubHeading>3.3 — Identifiers</SubHeading>
            <CodeBlock label="IDENTIFIERS / ILLUSTRATIVE" code={IDENTIFIERS} />
            <Prose>
              <Mono>network</Mono> is a namespace, not a blockchain. An identifier, once issued, is never reassigned, even after the Subject it names is retired.
            </Prose>

            <SubHeading>3.4 — Identity vs. Identifier: Controllers and Bindings</SubHeading>
            <Prose>
              A wallet address or an on-chain registry entry names a <em>controller</em>, not a durable actor. A Subject&apos;s identifier is stable; the mechanisms that currently control or represent it are{" "}
              <strong className="font-semibold">controllers and bindings</strong>, free to change completely without the identifier changing.
            </Prose>
            <CodeBlock label="CONTROLLERS AND BINDINGS / ILLUSTRATIVE" code={BINDINGS} />
            <Prose>
              ALMA does not mint keys, resolve DIDs, or replace a wallet&apos;s own addressing — it defines the identity abstraction those mechanisms attach to. This is what lets an agent swap its model, host, or wallet
              provider and still be, provably, the same economic actor.
            </Prose>
          </ArticleSection>

          <ArticleSection id={authority.id} title={authority.title}>
            <SubHeading>4.1 — Delegation</SubHeading>
            <Prose>
              A <strong className="font-semibold">Delegation</strong> is a directed grant of authority: an issuer grants a subject the right to act within a defined scope.
            </Prose>
            <CodeBlock label="DELEGATION / ILLUSTRATIVE" code={DELEGATION} />
            <Prose>
              ALMA defines what a delegation <em>means</em> inside an actor&apos;s authority graph — not the cryptographic format used to prove it. The same edge might be backed by a Verifiable Intent credential, an AP2
              mandate, a W3C VC, or an ALMA-native signature.
            </Prose>
            <Prose>
              <strong className="font-semibold">Chained delegation</strong> is first-class: an agent holding authority can delegate a strictly narrower slice of it onward — a treasury agent handing a bounded sub-budget to a
              specialist trading agent.
            </Prose>

            <SubHeading>4.2 — Credentials</SubHeading>
            <Prose>
              A <strong className="font-semibold">Credential</strong> is a verifiable claim about a Subject. ALMA does not define a new credential format — a credential&apos;s proof MAY be a W3C Verifiable Credential (the
              default), an SD-JWT-based credential, or another independently verifiable format. ALMA defines how that evidence relates to an economic Subject:
            </Prose>
            <CodeBlock label="CREDENTIAL EVIDENCE / ILLUSTRATIVE" code={CREDENTIAL} />
          </ArticleSection>

          <ArticleSection id={trust.id} title={trust.title}>
            <SubHeading>5.1 — The Relationship Graph</SubHeading>
            <Prose>Economic actors own, represent, delegate to, operate, transact with, and are hired by one another:</Prose>
            <p className="font-mono text-[13px] leading-[1.7] text-ink-soft">owns · represents · delegates · operates · member_of · hired · paid · transacted_with</p>
            <CodeBlock label="RELATIONSHIP GRAPH / ILLUSTRATIVE" code={GRAPH} />
            <Prose>
              Every <Mono>hired</Mono>, <Mono>paid</Mono>, and <Mono>transacted_with</Mono> edge must trace back to a concrete piece of evidence — nothing is asserted without something that happened to justify it.
            </Prose>

            <SubHeading>5.2 — Reputation as Evidence</SubHeading>
            <Prose>
              ALMA deliberately does not define a reputation score. It defines <strong className="font-semibold">ReputationEvidence</strong>, kept as two separate streams per Subject:
            </Prose>
            <RefTable columns={["Stream", "Question"]} rows={REPUTATION_STREAMS} />
            <Prose>
              ALMA doesn&apos;t compete with a chain-native registry like ERC-8004 — it consumes one as a single evidence source among several, normalized into the same model as a completed economic action or a marketplace
              outcome.
            </Prose>
          </ArticleSection>

          <ArticleSection id={intent.id} title={intent.title}>
            <Prose>
              An agent&apos;s <strong className="font-semibold">economic intent</strong> is inseparable from identity and trust.
            </Prose>
            <SubHeading>6.1 — What Intent Is</SubHeading>
            <Prose>
              An <strong className="font-semibold">EconomicIntent</strong> is ALMA&apos;s canonical semantic representation of a desired economic action — deliberately not frozen as a wire format, since commerce-authorization
              protocols are moving fast in exactly this space.
            </Prose>
            <CodeBlock label="ECONOMIC INTENT / ILLUSTRATIVE" code={INTENT} />
            <SubHeading>6.2 — Where ALMA Stops</SubHeading>
            <Prose>ALMA defines the shape and attribution of an intent — not whether it&apos;s permitted, and not how it executes.</Prose>
            <PullQuote>An EconomicIntent is a well-formed question. ALMA does not answer it.</PullQuote>
          </ArticleSection>

          <ArticleSection id={revocation.id} title={revocation.title}>
            <Prose>
              Every grant — a Delegation, a Credential — has an explicit <Mono>revoked</Mono> state, and revocation is:
            </Prose>
            <DocList>
              <li>
                <strong className="font-semibold">Immediate</strong> — rejected the next time it&apos;s checked, no tolerated propagation delay.
              </li>
              <li>
                <strong className="font-semibold">Attributed</strong> — who revoked it, when, and optionally why.
              </li>
              <li>
                <strong className="font-semibold">Non-retroactive</strong> — history reflects what was true at the time.
              </li>
            </DocList>
          </ArticleSection>

          <ArticleSection id={interop.id} title={interop.title}>
            <Prose>Sharper by asking one question of every adjacent standard: does it describe the economic actor, or solve infrastructure ALMA would otherwise reinvent?</Prose>
            <RefTable columns={["Standard", "What it solves", "Posture"]} rows={STANDARDS} />
            <Prose>
              <strong className="font-semibold">Owns outright:</strong> Subject, Principal, the relationship graph, delegation semantics, the reputation-evidence ontology, and the canonical EconomicIntent shape.{" "}
              <strong className="font-semibold">Stays out of:</strong> checkout/payment semantics, custody, on-chain execution, and a universal reputation score.
            </Prose>
          </ArticleSection>

          <ArticleSection id={privacy.id} title={privacy.title}>
            <Prose>
              An ALMA identifier is not, by itself, personally identifying — it reveals a subject type and a namespace, nothing more. Display metadata, the relationship graph, and credential claims are separately
              access-scoped.
            </Prose>
          </ArticleSection>

          <ArticleSection id={governance.id} title={governance.title}>
            <Prose>
              The protocol versions independently as <Mono>alma/v1</Mono>, <Mono>alma/v2</Mono>, decoupled from any implementation&apos;s release cycle. A version change requires a written rationale and a migration path.
            </Prose>
            <Prose>
              A proposal to expand ALMA&apos;s scope must pass §02&apos;s test — <em>own the model, not the infrastructure</em> — before a version bump is considered.
            </Prose>
          </ArticleSection>

          <ArticleSection id={minimum.id} title={minimum.title}>
            <Prose>A first, implementable version needs, in order:</Prose>
            <DocList ordered>
              <li>
                <strong className="font-semibold">Identifiers and Subjects</strong> — immutable once issued, with a controller/binding list from day one.
              </li>
              <li>
                <strong className="font-semibold">Delegation</strong> — single-level grants first, with a pluggable proof reference.
              </li>
              <li>
                <strong className="font-semibold">The relationship graph</strong>, limited at first to <Mono>owns</Mono>, <Mono>represents</Mono>, <Mono>delegates</Mono>, <Mono>transacted_with</Mono>.
              </li>
              <li>
                <strong className="font-semibold">ReputationEvidence</strong> as an append-only record — no scoring from day one.
              </li>
              <li>
                <strong className="font-semibold">EconomicIntent</strong> as ALMA&apos;s canonical semantic object — native representation first, resolvers for AP2/VI as natural follow-ons.
              </li>
              <li>
                <strong className="font-semibold">Revocation</strong> — immediate and non-retroactive from the start.
              </li>
            </DocList>
          </ArticleSection>

          <ArticleSection id={conclusion.id} title={conclusion.title}>
            <Standout>
              Agents are going to keep getting better at doing economically meaningful things. The open question is whether the systems around them can say, honestly and verifiably, who did it, on whose authority, and
              whether it was actually what they intended.
            </Standout>
            <Prose>
              ALMA turns fragmented identity, authority, and economic evidence into a persistent economic actor — as a protocol, not as a proprietary feature of whichever platform an agent happens to be using this month.
            </Prose>
          </ArticleSection>
        </DocLayout>
      </main>
      <Footer />
    </>
  );
}
