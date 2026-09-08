import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Protocol" };

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`s${n}`} className="py-12 border-b border-line">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-xs text-accent-text">{n}</span>
        <h2 className="font-display font-semibold text-2xl">{title}</h2>
      </div>
      <div className="space-y-4 text-[16px] leading-relaxed max-w-[68ch] [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-mono text-[13px] leading-relaxed bg-paper-raised border border-line border-l-2 border-l-accent rounded px-5 py-4 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse mt-1">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft border-b border-ink-soft pb-2 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-accent pl-4 font-display italic text-lg max-w-[54ch]">
      {children}
    </blockquote>
  );
}

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[0.92em] bg-paper-raised border border-line rounded px-1.5 py-0.5">{children}</span>
);

export default function ProtocolPage() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text mb-4">
            ALMA — Version 0.1, Draft 0.2
          </p>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-tight text-balance">
            An identity, trust, and intent protocol for autonomous economic agents
          </h1>
          <p className="mt-5 text-ink-soft text-lg max-w-[58ch] font-display italic">
            Who is this agent? Can it be trusted? What does it actually want to do? — three
            questions the infrastructure that lets agents move money has never had to answer,
            until it had to.
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-6">
          <Section n="01" title="The Missing Layer">
            <p className="font-display italic text-xl">A wallet address is not an identity.</p>
            <p>
              Every agent that transacts today answers &quot;how do I move money&quot; by picking a
              wallet SDK. Almost none can answer, in a way a counterparty could actually verify: who
              do you represent? What have you done before, and can I check it myself? Is what
              you&apos;re about to do actually something you&apos;re authorized to do, or just something
              your code happens to be capable of? If I stop trusting you, or you change which model or
              wallet you run on, does any of that history and authority survive?
            </p>
            <p>
              Zoom out and the deeper problem isn&apos;t any single missing feature — it&apos;s
              fragmentation. An agent&apos;s identity lives in a registry. Its authorization lives in a
              mandate. Its credentials live with an issuer. Its transaction history lives in a
              marketplace. Each piece can be individually verifiable and still add up to nothing,
              because nothing ties them back to the same underlying actor.
            </p>
            <p>
              This is the gap ALMA fills — not by building another payment rail, identity registry, or
              credential format, but by giving every economic actor a durable identity connecting what
              it represents, what it&apos;s allowed to do, what it has done, and what it wants to do
              next.
            </p>
          </Section>

          <Section n="02" title="Design Principles">
            <div className="divide-y divide-dotted divide-line">
              {[
                ["Identity outlives runtime", "An agent's identity, delegated authority, and accumulated reputation must survive a change of model, host, wallet, or chain."],
                ["Evidence before scores", "ALMA stores verifiable, attributable evidence and leaves scoring, if anyone wants it, as something built on top of that evidence — not baked into the protocol."],
                ["Protocol, not platform", "ALMA specifies shapes, identifiers, and semantics — not who hosts the data or what UI configures it."],
                ["Intent, not authorization", "ALMA defines how an agent expresses what it wants to do, not whether that expression is allowed."],
                ["Custody-agnostic, execution-agnostic", "ALMA has no opinion on which wallet, chain, or payment rail eventually moves value."],
                ["Own the model, not the infrastructure", "Authentication is FIDO/WebAuthn's job. Credential formats are W3C VC's. Commerce authorization is AP2's and Verifiable Intent's. On-chain reputation is ERC-8004's. Where the answer is infrastructure, ALMA references it instead of reinventing it."],
              ].map(([name, desc]) => (
                <div key={name} className="py-3 flex flex-col sm:flex-row sm:gap-6">
                  <div className="font-mono text-[13px] text-accent-text sm:w-56 flex-none">{name}</div>
                  <p className="text-[15px]">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section n="03" title="The ALMA Model">
            <h3 className="font-display font-semibold text-lg pt-1">3.1 — Subjects</h3>
            <Table
              head={["Subject", "Definition"]}
              rows={[
                [<Mono key="h">human</Mono>, "A person."],
                [<Mono key="o">organization</Mono>, "A legal or informal entity."],
                [<Mono key="a">agent</Mono>, "An AI agent — capable of holding delegated authority and expressing economic intent."],
              ]}
            />
            <p>
              Treating Human, Organization, and Agent as instances of the same underlying concept — a{" "}
              <strong>Subject</strong> — is deliberate: no adjacent standard defines this. DID gives you
              an identifier, W3C VC gives you a claim, ERC-8004 gives you an agent registry entry — none
              say <em>Agent X represents Organization Y</em>.
            </p>

            <h3 className="font-display font-semibold text-lg pt-2">3.2 — Principals and Representation</h3>
            <p>
              A <strong>Principal</strong> is a Subject that can hold economic authority and be
              represented — almost always a Human or an Organization, though an Agent can itself act as
              a Principal when it delegates a narrower scope onward. An Agent always represents a
              Principal; it is never a free-floating actor with authority of its own origin.
            </p>

            <h3 className="font-display font-semibold text-lg pt-2">3.3 — Identifiers</h3>
            <Code>{`// alma:<network>:<subject-type>:<local-id>
alma:main:human:8f2a...
alma:main:org:acme-labs
alma:main:agent:treasury-01`}</Code>
            <p>
              <Mono>network</Mono> is a namespace, not a blockchain. An identifier, once issued, is
              never reassigned, even after the Subject it names is retired.
            </p>

            <h3 className="font-display font-semibold text-lg pt-2">3.4 — Identity vs. Identifier: Controllers and Bindings</h3>
            <p>
              A wallet address or an on-chain registry entry names a <em>controller</em>, not a durable
              actor. A Subject&apos;s identifier is stable; the mechanisms that currently control or
              represent it are <strong>controllers and bindings</strong>, free to change completely
              without the identifier changing.
            </p>
            <Code>{`alma:main:agent:treasury-42
  controller: did:key:z6Mk...
  binding:    erc8004:base:291
  binding:    wallet:0xAbCd...
  binding:    endpoint:https://agent.acme.com/a2a`}</Code>
            <p>
              ALMA does not mint keys, resolve DIDs, or replace a wallet&apos;s own addressing — it
              defines the identity abstraction those mechanisms attach to. This is what lets an agent
              swap its model, host, or wallet provider and still be, provably, the same economic actor.
            </p>
          </Section>

          <Section n="04" title="The Authority Layer">
            <h3 className="font-display font-semibold text-lg">4.1 — Delegation</h3>
            <p>
              A <strong>Delegation</strong> is a directed grant of authority: an issuer grants a
              subject the right to act within a defined scope.
            </p>
            <Code>{`Delegation {
  issuer:  alma:main:org:acme-labs
  subject: alma:main:agent:treasury-01
  scope:   { capabilities: ["pay", "swap"], constraints: [...] }
  status:  active | revoked | expired
  proof:   { format: "ap2-mandate" | "verifiable-intent" | "w3c-vc" | "alma-native", reference: ... }
}`}</Code>
            <p>
              ALMA defines what a delegation <em>means</em> inside an actor&apos;s authority graph — not
              the cryptographic format used to prove it. The same edge might be backed by a Verifiable
              Intent credential, an AP2 mandate, a W3C VC, or an ALMA-native signature.
            </p>
            <p>
              <strong>Chained delegation</strong> is first-class: an agent holding authority can
              delegate a strictly narrower slice of it onward — a treasury agent handing a bounded
              sub-budget to a specialist trading agent.
            </p>

            <h3 className="font-display font-semibold text-lg pt-2">4.2 — Credentials</h3>
            <p>
              A <strong>Credential</strong> is a verifiable claim about a Subject. ALMA does not define
              a new credential format — a credential&apos;s proof MAY be a W3C Verifiable Credential
              (the default), an SD-JWT-based credential, or another independently verifiable format.
              ALMA defines how that evidence relates to an economic Subject:
            </p>
            <Code>{`CredentialEvidence {
  subject:  alma:main:org:acme-labs
  issuer:   alma:main:org:kyb-verifier
  type:     "kyb_verified"
  claim:    { tier: "institutional" }
  format:   "w3c-vc" | "sd-jwt" | "erc8004" | "alma-native"
  artifact: ...
}`}</Code>
          </Section>

          <Section n="05" title="The Trust Layer">
            <h3 className="font-display font-semibold text-lg">5.1 — The Relationship Graph</h3>
            <p>Economic actors own, represent, delegate to, operate, transact with, and are hired by one another:</p>
            <p className="font-mono text-[13px] text-ink-soft">
              owns · represents · delegates · operates · member_of · hired · paid · transacted_with
            </p>
            <Code>{`Human    --owns-->      Organization
Organization --delegates--> Agent A
Agent A  --hired-->     Agent B
Agent B  --operated_by--> Organization B
Agent A  --paid-->      Agent B`}</Code>
            <p>
              Every <Mono>hired</Mono>, <Mono>paid</Mono>, and <Mono>transacted_with</Mono> edge must
              trace back to a concrete piece of evidence — nothing is asserted without something that
              happened to justify it.
            </p>

            <h3 className="font-display font-semibold text-lg pt-2">5.2 — Reputation as Evidence</h3>
            <p>
              ALMA deliberately does not define a reputation score. It defines{" "}
              <strong>ReputationEvidence</strong>, kept as two separate streams per Subject:
            </p>
            <Table
              head={["Stream", "Question"]}
              rows={[
                ["principal reputation", "Has this human or organization been a trustworthy counterparty across everything it authorizes?"],
                ["agent reputation", "Has this specific agent performed reliably?"],
              ]}
            />
            <p>
              ALMA doesn&apos;t compete with a chain-native registry like ERC-8004 — it consumes one as
              a single evidence source among several, normalized into the same model as a completed
              economic action or a marketplace outcome.
            </p>
          </Section>

          <Section n="06" title="The Intent Layer">
            <p>An agent&apos;s <strong>economic intent</strong> is inseparable from identity and trust.</p>
            <h3 className="font-display font-semibold text-lg">6.1 — What Intent Is</h3>
            <p>
              An <strong>EconomicIntent</strong> is ALMA&apos;s canonical semantic representation of a
              desired economic action — deliberately not frozen as a wire format, since
              commerce-authorization protocols are moving fast in exactly this space.
            </p>
            <Code>{`EconomicIntent {
  actor:               alma:main:agent:treasury-01
  principal:           alma:main:org:acme-labs
  authorityReference:  del_9f3a...
  capability:          "pay"
  parameters:          { amount: "10", asset: "USDC", to: alma:main:agent:research-02 }
  representation:      { format: "ap2-mandate" | "verifiable-intent" | "alma-native", reference: ... }
}`}</Code>
            <h3 className="font-display font-semibold text-lg pt-2">6.2 — Where ALMA Stops</h3>
            <p>ALMA defines the shape and attribution of an intent — not whether it&apos;s permitted, and not how it executes.</p>
            <Quote>An EconomicIntent is a well-formed question. ALMA does not answer it.</Quote>
          </Section>

          <Section n="07" title="Revocation & Lifecycle">
            <p>Every grant — a Delegation, a Credential — has an explicit <Mono>revoked</Mono> state, and revocation is:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Immediate</strong> — rejected the next time it&apos;s checked, no tolerated propagation delay.</li>
              <li><strong>Attributed</strong> — who revoked it, when, and optionally why.</li>
              <li><strong>Non-retroactive</strong> — history reflects what was true at the time.</li>
            </ul>
          </Section>

          <Section n="08" title="Interoperability">
            <p>Sharper by asking one question of every adjacent standard: does it describe the economic actor, or solve infrastructure ALMA would otherwise reinvent?</p>
            <Table
              head={["Standard", "What it solves", "Posture"]}
              rows={[
                ["DID", "Identifiers, controllers, resolution.", "Adopt — as a controller mechanism."],
                ["W3C Verifiable Credentials", "Issuer-signed, verifiable claims.", "Adopt — default credential format."],
                ["ERC-8004", "On-chain agent registry & reputation feedback.", "Consume — as an identity binding & evidence source."],
                ["AP2 (Agent Payments Protocol)", "Commerce authorization — checkout & payment mandates.", "Consume — as a delegation/intent proof source."],
                ["Verifiable Intent", "Cryptographic chains linking human-granted scope to agent action.", "Consume — as a delegation/intent proof source."],
              ]}
            />
            <p className="pt-2">
              <strong>Owns outright:</strong> Subject, Principal, the relationship graph, delegation
              semantics, the reputation-evidence ontology, and the canonical EconomicIntent shape.{" "}
              <strong>Stays out of:</strong> checkout/payment semantics, custody, on-chain execution, and
              a universal reputation score.
            </p>
          </Section>

          <Section n="09" title="Privacy">
            <p>
              An ALMA identifier is not, by itself, personally identifying — it reveals a subject type
              and a namespace, nothing more. Display metadata, the relationship graph, and credential
              claims are separately access-scoped.
            </p>
          </Section>

          <Section n="10" title="Governance & Versioning">
            <p>
              The protocol versions independently as <Mono>alma/v1</Mono>, <Mono>alma/v2</Mono>,
              decoupled from any implementation&apos;s release cycle. A version change requires a
              written rationale and a migration path.
            </p>
            <p>
              A proposal to expand ALMA&apos;s scope must pass §02&apos;s test — <em>own the model, not
              the infrastructure</em> — before a version bump is considered.
            </p>
          </Section>

          <Section n="11" title="The Minimum Viable Protocol">
            <p>A first, implementable version needs, in order:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Identifiers and Subjects</strong> — immutable once issued, with a controller/binding list from day one.</li>
              <li><strong>Delegation</strong> — single-level grants first, with a pluggable proof reference.</li>
              <li><strong>The relationship graph</strong>, limited at first to <Mono>owns</Mono>, <Mono>represents</Mono>, <Mono>delegates</Mono>, <Mono>transacted_with</Mono>.</li>
              <li><strong>ReputationEvidence</strong> as an append-only record — no scoring from day one.</li>
              <li><strong>EconomicIntent</strong> as ALMA&apos;s canonical semantic object — native representation first, resolvers for AP2/VI as natural follow-ons.</li>
              <li><strong>Revocation</strong> — immediate and non-retroactive from the start.</li>
            </ol>
          </Section>

          <section className="py-14">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono text-xs text-accent-text">12</span>
              <h2 className="font-display font-semibold text-2xl">Conclusion</h2>
            </div>
            <p className="font-display italic text-xl leading-relaxed max-w-[52ch]">
              Agents are going to keep getting better at doing economically meaningful things. The open
              question is whether the systems around them can say, honestly and verifiably, who did it,
              on whose authority, and whether it was actually what they intended.
            </p>
            <p className="mt-5 max-w-[60ch]">
              ALMA turns fragmented identity, authority, and economic evidence into a persistent
              economic actor — as a protocol, not as a proprietary feature of whichever platform an
              agent happens to be using this month.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
