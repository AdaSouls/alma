import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { ArticleSection, DocLayout, PageIntro, Prose } from "@/components/Doc";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLink, Card, RefTable, SmartLink, StatusNote } from "@/components/ui";
import { GITHUB_URL, VERSIONS, editUrl, githubPath, npmUrl } from "@/lib/site";

const TITLE = "Build with ALMA";
const LEAD = "The protocol libraries are open source (MIT), run in Node and browsers, make no network calls and need no account.";

export const metadata: Metadata = {
  title: TITLE,
  description: LEAD,
  alternates: { canonical: "/developers" },
};

const CONTENTS = [
  { id: "quickstart", label: "Quickstart" },
  { id: "verify-receipt", label: "Verify a receipt" },
  { id: "packages", label: "Packages" },
  { id: "manifest", label: "Manifest" },
  { id: "api-reference", label: "API reference" },
  { id: "going-further", label: "Going further" },
  { id: "contributing", label: "Contributing" },
];

const PROTOCOL_REPO = "https://github.com/AdaSouls/protocol";

// Every sample on this page was run as written against the packages published on npm.
const INSTALL = "npm install @adasouls/alma-core";

const IDENTITY = `import { createIdentity, createDelegation, createRelationship, recordEvidence } from "@adasouls/alma-core";

const org = createIdentity({ subjectType: "organization", displayName: "Acme Labs" });
const agent = createIdentity({ subjectType: "agent", displayName: "Treasury Agent", principal: org.id, controllers: [{ type: "wallet", value: "0x8F12…21C" }] });
const delegation = createDelegation({ issuer: org.id, subject: agent.id, scope: { capabilities: ["pay"], constraints: { maxTransaction: { USDC: "1000" } } }, expiresAt: "2027-01-01T00:00:00Z" });
createRelationship({ from: org.id, to: agent.id, type: "delegates", sourceRef: delegation.id });
recordEvidence({ subject: agent.id, role: "agent", source: { type: "economic-action", reference: "eco_123" }, outcome: "success" });
console.log(org.id); // alma:main:organization:…
console.log(agent.id); // alma:main:agent:… its permanent identifier`;

const RECEIPT = `import { LocalSigner, buildReceiptStatement, receiptDigest, toBaseUnits, signReceiptMint, signReceiptAttestation, createIssuerKeyset, verifyReceipt } from "@adasouls/alma-core";

const issuer = await LocalSigner.generate(); // a local test key; a production key belongs in a KMS
const statement = buildReceiptStatement({
  issuer: "demo-issuer",
  env: "testnet",
  action: "eco_123",
  payer: "alma:main:agent:buyer",
  payee: "alma:main:agent:vendor",
  capability: "pay",
  chain: "eip155:84532",
  asset: "eip155:84532/erc20:0x036cbd53842c5426634e7929541ec2318f3dcf7e",
  amount: toBaseUnits("12.5", 6),
  to: "0x000000000000000000000000000000000000dEaD",
  txHash: "0x" + "ab".repeat(32),
});
const digest = await receiptDigest(statement);
const mint = await signReceiptMint(issuer, { iss: "demo-issuer", receipt: "rcpt_1", digest, independent: true });
const delivery = await signReceiptAttestation(issuer, { iss: "demo-issuer", receipt: "rcpt_1", digest, kind: "delivery", decision: "confirmed", decidedBy: "member", decidedAt: new Date() });
const keyset = await createIssuerKeyset([{ iss: "demo-issuer", publicKey: Buffer.from(issuer.publicKey).toString("base64url") }]);
const result = await verifyReceipt({ id: "rcpt_1", statement, mint, delivery }, keyset);
console.log(result.ok); // true; change any field of the statement and it is false`;

const MANIFEST_YAML = `kind: Agent
version: alma/v1
metadata:
  name: treasury-agent
identity:
  type: agent
capabilities:
  - pay
authority:
  maxTransaction:
    USDC: "1000"
counterpartyPolicy:
  minCompletedTransactions: 20
  minReputationEvidence:
    disputeRate: 0.02
  requiredCredentials:
    - kyb_verified`;

const MANIFEST_COMPILE = `import { readFileSync } from "node:fs";
import { parseManifestYaml, compileManifest } from "@adasouls/alma-manifest";

const manifest = parseManifestYaml(readFileSync("alma.yaml", "utf8")); // throws AlmaValidationError on a bad manifest
const compiled = compileManifest(manifest);
console.log(compiled.delegation.scope); // { capabilities: [ 'pay' ] }
console.log(compiled.counterpartyPolicy.rules.minCompletedTransactions); // 20`;

const CLI_FROM_CLONE = `git clone https://github.com/AdaSouls/alma.git
cd alma
npm install
npm run build -w @adasouls/alma-core -w @adasouls/alma-manifest -w @adasouls/alma-cli
node packages/cli/dist/bin.js --help`;

const link = "text-violet hover:underline";

function Sources({ npm, github, note }: { npm?: string; github: string; note: string }) {
  return (
    <>
      {npm && (
        <>
          <SmartLink href={npmUrl(npm)} className={link}>
            npm ↗
          </SmartLink>
          {" · "}
        </>
      )}
      <SmartLink href={github} className={link}>
        GitHub ↗
      </SmartLink>
      {` · ${note}`}
    </>
  );
}

const PACKAGES: ReactNode[][] = [
  [
    "@adasouls/alma-core",
    "Protocol identifiers, identities, delegation, credentials, relationships, evidence, receipts, signatures, reports, deliveries and log.",
    <Sources key="s" npm="@adasouls/alma-core" github={githubPath("packages/alma-core")} note={`v${VERSIONS.core}`} />,
  ],
  [
    "@adasouls/alma-credentials",
    "The interface a credential verifier implements. The verifier it ships is a stub with no cryptography: its “verified” is not a verification claim.",
    <Sources key="s" npm="@adasouls/alma-credentials" github={githubPath("packages/alma-credentials")} note={`v${VERSIONS.credentials}`} />,
  ],
  [
    "@adasouls/alma-manifest",
    "YAML schema, parser and compiler.",
    <Sources key="s" npm="@adasouls/alma-manifest" github={githubPath("packages/alma-manifest")} note={`v${VERSIONS.manifest}`} />,
  ],
  [
    "@adasouls/alma-cli",
    "A local command line, in the repository only. It is not on npm, so there is no npx quickstart yet.",
    <Sources key="s" github={githubPath("packages/cli")} note="not on npm" />,
  ],
  [
    "@adasouls/protocol",
    "Solidity AlmaAnchorRegistry: optional on-chain anchors for ALMA identifiers. No deployment addresses are published yet.",
    <Sources key="s" npm="@adasouls/protocol" github={PROTOCOL_REPO} note="v0.1.0, separate repository" />,
  ],
];

const Code = ({ children }: { children: ReactNode }) => <code className="break-words font-mono text-[0.92em]">{children}</code>;

export default function DevelopersPage() {
  return (
    <>
      <Header />
      <main>
        <PageIntro eyebrow="DEVELOPERS / START LOCALLY" title={TITLE} lead={LEAD} />
        <DocLayout contents={CONTENTS} edit={editUrl("src/app/developers/page.tsx")} updated="8 October 2026">
          <ArticleSection id="quickstart" eyebrow="QUICKSTART / #QUICKSTART" title="An identity in a few lines">
            <CodeBlock label="INSTALL / NPM" code={INSTALL} />
            <Prose>Create an accountable principal, give an agent a persistent identity, delegate narrowly and record evidence.</Prose>
            <CodeBlock label="IDENTITY + AUTHORITY / TYPESCRIPT" code={IDENTITY} />
            <StatusNote label="Identifier segment">
              <Code>createIdentity</Code> writes the <Code>organization</Code> segment. Some examples in the repository write <Code>org</Code>: the parser accepts it as a short form of the same subject type, and keeps the
              identifier exactly as it was written. Keep names out of the local part: an identifier is permanent and public, so pass a random <Code>localId</Code> and put what the Subject is called in its display name.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="verify-receipt" title="Sign and verify a receipt">
            <Prose>Generate a local test key, bind the issuer’s signature to the exact statement digest, then verify it against an explicitly trusted keyset.</Prose>
            <CodeBlock label="LOCAL TEST / TYPESCRIPT" code={RECEIPT} />
            <StatusNote label="Runtime + key handling">
              <Code>Buffer</Code> is Node-only: in a browser, encode the public key as unpadded base64url yourself, since alma-core does not export a helper for it yet. Use a production KMS, not this local test key. No
              production issuer keys or log names are published yet. <Code>independent: true</Code> is illustrative here: it is a flag the issuer signs, and <Code>verifyReceipt</Code> reports it without checking it.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="packages" title="Small packages, explicit responsibilities">
            <RefTable columns={["Package", "What it provides", "Source / status"]} rows={PACKAGES} />
            <Prose>The command line runs from a clone of the repository:</Prose>
            <CodeBlock label="CLI / FROM A CLONE" code={CLI_FROM_CLONE} />
          </ArticleSection>

          <ArticleSection id="manifest" title="Put policy beside your agent">
            <Prose>The manifest package parses and compiles YAML. Keep identity, capabilities and counterparty requirements readable and versioned.</Prose>
            <CodeBlock label="ALMA.YAML / AGENT MANIFEST" code={MANIFEST_YAML} />
            <CodeBlock label="PARSE + COMPILE / TYPESCRIPT" code={MANIFEST_COMPILE} />
            <p className="text-[13px] leading-[1.65] text-ink-soft">
              The thresholds are one application’s choice, not protocol defaults. Compiling produces plain objects and makes no network calls: applying them is the caller’s job. The schema is in{" "}
              <SmartLink href={githubPath("packages/alma-manifest/src")} className={link}>
                packages/alma-manifest ↗
              </SmartLink>
              .
            </p>
          </ArticleSection>

          <ArticleSection id="api-reference" title="Reference, without false readiness">
            <StatusNote label="API reference · not generated yet">
              There is no generated API reference yet. Until there is, read the exported types in{" "}
              <SmartLink href={`${GITHUB_URL}/blob/develop/packages/alma-core/src/index.ts`} className={link}>
                alma-core’s source ↗
              </SmartLink>
              , each package’s README, and the{" "}
              <SmartLink href={githubPath("spec/alma-v1")} className={link}>
                draft spec ↗
              </SmartLink>
              . The CLI is not available on npm, so no CLI quickstart is presented here.
            </StatusNote>
          </ArticleSection>

          <ArticleSection id="going-further" title="Going further">
            <div className="grid gap-5 md:grid-cols-2">
              <Card eyebrow="NO ACCOUNT" eyebrowTone="teal" title="Local protocol">
                Use alma-core to model identity, check delegations and verify evidence. Rank agents with your own rules.
              </Card>
              <Card eyebrow="OPTIONAL / ADASOULS" eyebrowTone="teal" title="Hosted enforcement">
                Payments, policies, issued receipts and marketplace access through the SDK and the MCP server. @adasouls/sdk v0.5 and @adasouls/mcp v0.4 are on npm. The hosted API is not open yet.
              </Card>
            </div>
            <p>
              <ArrowLink href="https://www.adasouls.io/developers">AdaSouls Developers ↗</ArrowLink>
            </p>
          </ArticleSection>

          <ArticleSection id="contributing" title="Contribute to the protocol">
            <Prose>
              Open{" "}
              <SmartLink href={`${GITHUB_URL}/issues`} className={link}>
                issues ↗
              </SmartLink>
              , propose spec changes and include changesets for versioned releases. The code is MIT licensed. Discuss interoperability and evidence semantics in the open.
            </Prose>
            <StatusNote label="Security reporting · pending">
              The repository has no SECURITY.md and no private reporting route yet. Do not publish sensitive security details in a public issue.
            </StatusNote>
          </ArticleSection>
        </DocLayout>
      </main>
      <Footer />
    </>
  );
}
