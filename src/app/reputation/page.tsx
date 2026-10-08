import type { Metadata } from "next";
import { CodeBlock } from "@/components/CodeBlock";
import { ArticleSection, DocLayout, PageIntro, Prose } from "@/components/Doc";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLink, Card, RefTable, SmartLink, StatusNote } from "@/components/ui";
import { editUrl, githubPath } from "@/lib/site";

const TITLE = "How reputation works in ALMA";
const LEAD = "Most reputation systems ask you to trust a number. ALMA gives you the evidence behind it — signed, tamper-evident and portable — and lets you set your own bar.";

export const metadata: Metadata = {
  title: TITLE,
  description: LEAD,
  alternates: { canonical: "/reputation" },
};

const CONTENTS = [
  { id: "evidence-not-scores", label: "Evidence, not scores" },
  { id: "records", label: "What the records prove" },
  { id: "who-attests", label: "Who can attest" },
  { id: "signatures", label: "Issuer signatures" },
  { id: "log", label: "Nothing disappears" },
  { id: "independence", label: "Independent counterparties" },
  { id: "two-reputations", label: "Two reputations" },
  { id: "policy", label: "Your policy" },
  { id: "privacy", label: "Privacy" },
  { id: "evidence-chain", label: "The complete evidence chain" },
  { id: "verify", label: "Verify it yourself" },
  { id: "next", label: "What comes next" },
];

const PRINCIPLES = [
  { title: "Inspect the provenance", text: "Know who made a claim and what they actually checked." },
  { title: "Verify the record", text: "Signatures reveal edits. Log proofs expose missing history." },
  { title: "Set your own bar", text: "Accept, refuse or ask for additional proof in context." },
];

const RECORDS = [
  ["Receipt · alma-receipt/1", "Issuer, from a settled transaction", "A payment between payer and payee was settled: asset, amount, chain and transaction hash.", "Work quality."],
  ["Payment confirmation", "Payee answers; issuer signs the answer", "Payment arrived. Evidence for the payer.", "Whether work was delivered."],
  ["Delivery confirmation", "Payer answers; issuer signs the answer", "Work delivered as agreed. Evidence for the payee.", "Anything beyond the payer’s word."],
  ["Job delivery · alma-job-delivery/1", "Issuer that called the hired agent", "Result digest and time returned.", "Result quality."],
  ["Agent report · alma-agent-report/1", "Agent declares; issuer signs the declaration", "Who declared cost, model, tokens and duration, when, and that the declaration is unchanged.", "Truth of the declared figure."],
  ["Credential · W3C VC / SD-JWT / ERC-8004 / ALMA-native", "Credential issuer", "A claim such as KYB verified.", "Anything beyond the claim. Check revocation and expiry."],
  ["External record · e.g. ERC-8004 feedback", "External system", "The facts that system recorded.", "Things not checked by that external system."],
];

const RESPONDENTS = [
  ["Payee", "Payment arrived", "Payer’s payment history"],
  ["Payer", "Delivery as agreed", "Payee’s delivery history"],
  ["Human or agent", "Respondent type is recorded", "The reader can distinguish who answered"],
];

const SCOPES = [
  { title: "Principal aggregate", text: "The accountable human or organization can accumulate evidence across the agents it represents." },
  { title: "Agent-specific history", text: "Each agent retains its own track record. A new agent starts with a separate history, not an inherited completed-action count." },
];

// The fields of `counterpartyPolicy` as @adasouls/alma-manifest declares them.
const POLICY_FIELDS = [
  ["minCompletedTransactions", "Minimum qualifying transaction count."],
  ["minReputationEvidence", "Contextual evidence thresholds: completedActions and disputeRate."],
  ["requiredCredentials", "Issuer claims the counterparty must hold, such as kyb_verified."],
  ["organizationVerification", "Requires the represented organization to be verified."],
  ["communityMembership", "Required membership evidence."],
  ["minTokenHoldings", "Optional holdings condition; not an ALMA token requirement."],
  ["allowlist / blocklist", "Explicit permission or exclusion."],
];

const POLICY_EXAMPLES = `Vendor: completed transactions >= 20
        dispute rate <= 2%; kyb_verified
Research agent: completed actions >= 3
Treasury: allowlist only`;

const CHAIN = [
  { step: "Principal → agent →", detail: "Scoped, expiring delegation" },
  { step: "On-chain settlement →", detail: "Chain · asset · amount · tx hash" },
  { step: "Issuer receipt →", detail: "Ed25519 signature · independent flag" },
  { step: "Counterparty confirmations →", detail: "Payee → payment / payer → delivery" },
  { step: "Transparency log →", detail: "Receipts · confirmations · job digests · declared reports" },
  { step: "Verified evidence + your policy ✓", detail: "ALLOW / DENY / REQUIRE PROOF / REQUIRE APPROVAL" },
];

// Run against @adasouls/alma-core as it is in this repository, with a job delivery signed and logged
// by a test issuer as the inputs: it prints the last line.
const VERIFY = `import { envelopeLeafHash, hexToHash, jsonDigest, verifyInclusion, verifyJobDelivery, verifyTreeHead } from "@adasouls/alma-core";

// keyset: issuer keys you pinned yourself. treeHead, envelope, index and proof (hex) come from the issuer.
// result: the work you were handed.
const head = await verifyTreeHead(treeHead, keyset);
if (!head.ok) throw new Error(head.reason);
const { treeSize, rootHash } = head.payload; // always use size and root together
const included = await verifyInclusion(await envelopeLeafHash(envelope), index, treeSize, proof.map(hexToHash), rootHash);

const delivery = await verifyJobDelivery(envelope, keyset);
const same = delivery.ok && (await jsonDigest(result)) === delivery.payload.resultDigest;
console.log(included, same); // true true`;

export default function ReputationPage() {
  return (
    <>
      <Header />
      <main>
        <PageIntro eyebrow="REPUTATION / EVIDENCE, NOT SCORES" title={TITLE} lead={LEAD} />
        <DocLayout contents={CONTENTS} edit={editUrl("src/app/reputation/page.tsx")} updated="8 October 2026">
          <ArticleSection id="evidence-not-scores" title="Evidence, not scores">
            <Prose>
              A global number is opaque, easy to game and blind to context. A treasury agent and a research agent do not need the same bar. ALMA standardizes evidence; each application decides when it is enough.
            </Prose>
            <div className="grid gap-4 md:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <Card key={p.title} title={p.title}>
                  {p.text}
                </Card>
              ))}
            </div>
          </ArticleSection>

          <ArticleSection id="records" title="What the records prove — and what they don’t">
            <RefTable columns={["Record", "Who attests", "Proves", "Does not prove"]} rows={RECORDS} />
          </ArticleSection>

          <ArticleSection id="who-attests" title="Each side attests only what it can know">
            <Prose>
              The on-chain transfer is independently checkable. The payee knows whether payment arrived. The payer knows whether delivery met the agreement. Neither side’s answer silently becomes a claim of objective work
              quality.
            </Prose>
            <RefTable columns={["Respondent", "Confirmation", "Evidence benefits"]} rows={RESPONDENTS} />
          </ArticleSection>

          <ArticleSection id="signatures" title="A signature binds the issuer to the exact record">
            <Prose>Issuer signatures use Ed25519 (RFC 8032). They name the issuer, identify its key and bind it to the exact receipt digest. Changing a statement field breaks that binding.</Prose>
            <StatusNote label="Pin keys outside the input">
              Choose trusted issuer keys from a trusted external source. Never trust keys supplied by the receipt itself. A signature proves provenance and integrity, not that an issuer’s claim is true. Production keys and log
              names are not published yet.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="log" title="Nothing disappears">
            <Prose>
              Signed envelopes enter an append-only Merkle transparency log based on RFC 9162. Signed tree heads commit to a history; inclusion proofs show that a record is in it, and consistency proofs show that one tree
              extends another. Leaves commit signatures and disclose no receipt.
            </Prose>
            <p className="leading-[1.65] text-ink-soft">Revocation and disputes add attributed records. They do not erase earlier evidence or retroactively rewrite history.</p>
          </ArticleSection>

          <ArticleSection id="independence" title="Independent counterparties">
            <Prose>The issuer records an independence flag at mint. Policies can count only independent receipts to avoid treating self-dealing as external experience.</Prose>
            <StatusNote label="Determination method · not settled yet">
              How independence is determined still requires review. The flag is not proof that collusion is impossible. The method must be documented before production claims rely on it.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="two-reputations" title="One principal. Separate agent histories.">
            <div className="grid gap-5 md:grid-cols-2">
              {SCOPES.map((s) => (
                <Card key={s.title} title={s.title}>
                  {s.text}
                </Card>
              ))}
            </div>
          </ArticleSection>

          <ArticleSection id="policy" title="Your policy, over the same evidence">
            <Prose>
              Any application can write its own rules over the same evidence; these are one implementation’s, the <code className="font-mono text-sm">counterpartyPolicy</code> fields of{" "}
              <SmartLink href={githubPath("packages/alma-manifest")} className="text-violet hover:underline">
                @adasouls/alma-manifest
              </SmartLink>
              .
            </Prose>
            <RefTable columns={["Field", "Purpose"]} rows={POLICY_FIELDS} />
            <CodeBlock label="POLICY EXAMPLES / ILLUSTRATIVE" code={POLICY_EXAMPLES} />
          </ArticleSection>

          <ArticleSection id="privacy" title="Share evidence, not everyone’s transactions">
            <Prose>
              Applications can expose aggregates instead of raw transactions. Delivery evidence describes the seller, not a buyer profile. Results stay private; a delivery digest can bind to them without publishing the
              content.
            </Prose>
            <StatusNote label="Human identifiers · not settled yet">
              Personal-data-free random human identifiers need confirmation. Do not put names or other PII in permanent public identifiers.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="evidence-chain" title="From delegated authority to a contextual decision">
            <div className="flex flex-col gap-6 rounded-xl bg-night p-6 shadow-panel sm:p-8">
              <p className="font-mono text-[11px] text-night-text">EVIDENCE CHAIN / NO GLOBAL SCORE</p>
              <ol className="flex flex-col gap-3">
                {CHAIN.map((c) => (
                  <li key={c.step} className="rounded-md border border-night-line bg-night-raised p-[18px]">
                    <p className="text-sm leading-[1.7] text-white">{c.step}</p>
                    <p className="text-xs leading-[1.7] text-night-dim">{c.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-sm leading-[1.65] text-ink-soft">
              A principal delegates scoped authority to an agent. The agent pays or hires; settlement fixes chain, asset, amount and transaction hash. The issuer signs the receipt and records independence. The payee’s payment
              answer benefits the payer; the payer’s delivery answer benefits the payee. Signed records, job result digests and declared reports enter the log. A verifier checks the evidence, then its own policy allows,
              denies, requires proof or requires approval.
            </p>
          </ArticleSection>

          <ArticleSection id="verify" title="Verify it yourself">
            <CodeBlock label="LOG INCLUSION + RESULT DIGEST / TYPESCRIPT" code={VERIFY} />
            <StatusNote label="What this example is">
              A verification example, not a live result on this page: no public ALMA log is running yet, and production keys and log names are not published. Until the issuer has sequenced a record into its log there is no
              index or proof to check.
            </StatusNote>
            <ArrowLink href="/developers#verify-receipt">Full receipt verification example in Developers →</ArrowLink>
          </ArticleSection>

          <ArticleSection id="next" title="What comes next">
            <StatusNote label="Proposed">External anchors, ERC-8004 evidence ingestion and zero-knowledge provable aggregate claims are proposals, not shipped integrations.</StatusNote>
          </ArticleSection>
        </DocLayout>
      </main>
      <Footer />
    </>
  );
}
