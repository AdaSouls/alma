import { useMemo, useState } from "react";
import type {
  AlmaIdentity,
  CredentialEvidence,
  Delegation,
  Relationship,
  ReputationEvidence,
} from "@adasouls/alma-core";
import type { AgentBinding } from "../lib/store.js";

interface Props {
  identities: AlmaIdentity[];
  relationships: Relationship[];
  delegations: Delegation[];
  credentials: CredentialEvidence[];
  reputationEvidence: ReputationEvidence[];
  agentBindings: Record<string, AgentBinding>;
  attachAgent: (identityId: string, label: string) => void;
  detachAgent: (identityId: string) => void;
}

function label(identities: AlmaIdentity[], id: string): string {
  return identities.find((i) => i.id === id)?.displayName ?? id;
}

const DEMO_MODELS = ["Claude Sonnet 5", "Claude Opus 5", "GPT-5", "Gemini 3", "Llama 4", "a self-hosted open-weight model"];

export function SoulExplorer({
  identities,
  relationships,
  delegations,
  credentials,
  reputationEvidence,
  agentBindings,
  attachAgent,
  detachAgent,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [attachLabel, setAttachLabel] = useState(DEMO_MODELS[0]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return identities;
    return identities.filter((i) => i.displayName.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [identities, query]);

  const selected = identities.find((i) => i.id === selectedId);
  const binding = selectedId ? agentBindings[selectedId] : undefined;

  const granted = selected ? delegations.filter((d) => d.issuer === selected.id) : [];
  const received = selected ? delegations.filter((d) => d.subject === selected.id) : [];
  const outbound = selected ? relationships.filter((r) => r.from === selected.id) : [];
  const inbound = selected ? relationships.filter((r) => r.to === selected.id) : [];
  const ownCredentials = selected ? credentials.filter((c) => c.subject === selected.id) : [];
  const ownEvidence = selected
    ? reputationEvidence.filter((r) => r.subject === selected.id).slice().reverse()
    : [];

  if (identities.length === 0) {
    return <p className="text-ink-soft text-sm">Forge a Soul first — then come back here to search for it and see everything that's true about it in one place.</p>;
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-8">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Search an ALMA</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="name or alma:main:..."
          className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm mb-3"
        />
        <ul className="space-y-1">
          {matches.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => setSelectedId(i.id)}
                className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                  selectedId === i.id
                    ? "border-accent bg-accent-soft text-accent-text"
                    : "border-line bg-paper-raised hover:border-accent"
                }`}
              >
                <div className="font-medium">{i.displayName}</div>
                <div className="text-xs font-mono text-ink-soft truncate">{i.id}</div>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="text-sm text-ink-soft italic">No match.</li>}
        </ul>
      </div>

      {!selected ? (
        <p className="text-ink-soft text-sm">Pick a Soul on the left.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl text-ink">{selected.displayName}</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-line text-ink-soft">
                {selected.subjectType}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-line text-ink-soft">
                {selected.status}
              </span>
            </div>
            <p className="font-mono text-xs text-ink-soft mt-1">{selected.id}</p>
            {selected.principal && (
              <p className="text-sm text-ink-soft mt-1">represents {label(identities, selected.principal)}</p>
            )}
          </div>

          <div className="border border-line rounded-lg p-4 bg-paper-raised">
            <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Live agent binding</h4>
            <p className="text-xs text-ink-soft mb-3">
              Illustrative only, not part of the ALMA protocol yet — a real deployment would model this as an
              AgentInstance (docs/12-agent-lifecycle.md), owned by the hosting implementation, not by the identity
              itself. The point it's demonstrating is real: the Soul below is exactly the same identity, delegations,
              and credentials whether an AI is currently attached to it or not, and whichever model is.
            </p>
            {selected.subjectType !== "agent" ? (
              <p className="text-sm text-ink-soft">
                Only a Soul of type <span className="font-mono">agent</span> can have a live AI attached —{" "}
                {selected.subjectType === "organization" ? "an" : "a"} {selected.subjectType} Soul is a principal an
                agent represents, not something an AI runtime runs as.
                {binding && (
                  <>
                    {" "}This Soul has a stale binding from before that rule existed —{" "}
                    <button onClick={() => detachAgent(selected.id)} className="text-red-700 hover:underline">
                      clear it
                    </button>
                    .
                  </>
                )}
              </p>
            ) : binding ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-evidence mr-2" />
                  <strong>Live</strong> — running on {binding.label}
                </span>
                <button
                  onClick={() => detachAgent(selected.id)}
                  className="text-xs font-mono text-red-700 hover:underline"
                >
                  detach
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-ink-soft">
                  <span className="inline-block w-2 h-2 rounded-full bg-line mr-2" />
                  Dormant — no AI agent currently attached to this Soul
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={attachLabel}
                    onChange={(e) => setAttachLabel(e.target.value)}
                    className="px-2 py-1.5 rounded border border-line bg-white text-xs font-mono"
                  >
                    {DEMO_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => attachAgent(selected.id, attachLabel)}
                    className="px-3 py-1.5 rounded bg-accent text-white text-xs font-medium hover:bg-accent-text transition-colors"
                  >
                    attach
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Delegates authority to</h4>
              {granted.length === 0 ? (
                <p className="text-sm text-ink-soft italic">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {granted.map((d) => (
                    <li key={d.id}>
                      {label(identities, d.subject)}{" "}
                      <span className="font-mono text-xs text-ink-soft">[{d.scope.capabilities.join(", ")}] · {d.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Authority received from</h4>
              {received.length === 0 ? (
                <p className="text-sm text-ink-soft italic">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {received.map((d) => (
                    <li key={d.id}>
                      {label(identities, d.issuer)}{" "}
                      <span className="font-mono text-xs text-ink-soft">[{d.scope.capabilities.join(", ")}] · {d.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {(outbound.length > 0 || inbound.length > 0) && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Relationships</h4>
              <ul className="space-y-1 text-sm">
                {outbound.map((r, i) => (
                  <li key={`out-${i}`}>
                    <span className="font-mono text-xs text-accent-text">{r.type}</span> {label(identities, r.to)}
                  </li>
                ))}
                {inbound.map((r, i) => (
                  <li key={`in-${i}`}>
                    {label(identities, r.from)} <span className="font-mono text-xs text-accent-text">{r.type}</span> this Soul
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
              Credentials ({ownCredentials.length})
            </h4>
            {ownCredentials.length === 0 ? (
              <p className="text-sm text-ink-soft italic">None.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {ownCredentials.map((c) => (
                  <li key={c.id} className="font-mono text-xs">
                    {c.type} · {c.verificationStatus}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
              Contributions ({ownEvidence.length})
            </h4>
            {!binding && ownEvidence.length > 0 && (
              <p className="text-xs text-ink-soft italic mb-2">No AI agent currently attached — this is the historical record, which persists regardless.</p>
            )}
            {ownEvidence.length === 0 ? (
              <p className="text-sm text-ink-soft italic">None yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {ownEvidence.map((r) => (
                  <li key={r.id} className="font-mono text-xs">
                    {r.outcome} · {r.source.type} · {new Date(r.occurredAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
