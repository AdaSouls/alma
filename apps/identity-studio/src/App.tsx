import { useState } from "react";
import { useAlmaStore } from "./lib/store.js";
import { IdentityForm } from "./components/IdentityForm.js";
import { IdentityBrowser } from "./components/IdentityBrowser.js";
import { RelationshipPanel } from "./components/RelationshipPanel.js";
import { DelegationPanel } from "./components/DelegationPanel.js";
import { CredentialPanel } from "./components/CredentialPanel.js";
import { ReputationPanel } from "./components/ReputationPanel.js";
import { SoulExplorer } from "./components/SoulExplorer.js";

const TABS = ["Create", "Souls", "Relationships", "Delegations", "Credentials", "Contributions", "Explorer"] as const;
type Tab = (typeof TABS)[number];

export default function App() {
  const store = useAlmaStore();
  const [tab, setTab] = useState<Tab>(store.identities.length ? "Explorer" : "Create");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent-text mb-1">AdaSouls · ALMA v1</p>
            <h1 className="font-display text-2xl text-ink">Soul Forge</h1>
          </div>
          <p className="text-sm text-ink-soft max-w-xs text-right hidden sm:block">
            Forge a portable ALMA identity, build up its authority and evidence, and explore it — the same Soul, no matter which AI (or none) is currently attached to it.
          </p>
        </div>
      </header>

      <nav className="border-b border-line bg-paper-raised">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t ? "border-accent text-accent-text" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t}
              {t === "Souls" && store.identities.length > 0 && (
                <span className="ml-1.5 text-xs font-mono text-ink-soft">({store.identities.length})</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "Create" && (
          <IdentityForm
            existing={store.identities}
            onCreated={(identity) => {
              store.addIdentity(identity);
              setTab("Explorer");
            }}
          />
        )}
        {tab === "Souls" && <IdentityBrowser identities={store.identities} />}
        {tab === "Relationships" && (
          <RelationshipPanel identities={store.identities} relationships={store.relationships} onAdd={store.addRelationship} />
        )}
        {tab === "Delegations" && (
          <DelegationPanel
            identities={store.identities}
            delegations={store.delegations}
            onAdd={store.addDelegation}
            onUpdate={store.replaceDelegation}
          />
        )}
        {tab === "Credentials" && (
          <CredentialPanel
            identities={store.identities}
            credentials={store.credentials}
            onAdd={store.addCredential}
            onUpdate={store.replaceCredential}
          />
        )}
        {tab === "Contributions" && (
          <ReputationPanel
            identities={store.identities}
            reputationEvidence={store.reputationEvidence}
            onAdd={store.addReputationEvidence}
          />
        )}
        {tab === "Explorer" && (
          <SoulExplorer
            identities={store.identities}
            relationships={store.relationships}
            delegations={store.delegations}
            credentials={store.credentials}
            reputationEvidence={store.reputationEvidence}
            agentBindings={store.agentBindings}
            attachAgent={store.attachAgent}
            detachAgent={store.detachAgent}
          />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-xs font-mono text-ink-soft flex justify-between">
        <span>Stored only in this browser (localStorage) — nothing leaves your machine.</span>
        <button onClick={store.clearAll} className="hover:text-red-700">
          reset all data
        </button>
      </footer>
    </div>
  );
}
