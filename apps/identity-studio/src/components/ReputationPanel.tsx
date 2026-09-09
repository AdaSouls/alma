import { useState } from "react";
import {
  recordEvidence,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_ROLES,
  EVIDENCE_OUTCOMES,
  AlmaValidationError,
  type AlmaIdentity,
  type ReputationEvidence,
  type EvidenceSourceType,
  type EvidenceRole,
  type EvidenceOutcome,
} from "@adasouls/alma-core";

interface Props {
  identities: AlmaIdentity[];
  reputationEvidence: ReputationEvidence[];
  onAdd: (evidence: ReputationEvidence) => void;
}

function label(identities: AlmaIdentity[], id: string): string {
  return identities.find((i) => i.id === id)?.displayName ?? id;
}

const OUTCOME_COLOR: Record<EvidenceOutcome, string> = {
  success: "border-evidence text-evidence",
  failure: "border-red-300 text-red-700",
  disputed: "border-amber-300 text-amber-700",
};

export function ReputationPanel({ identities, reputationEvidence, onAdd }: Props) {
  const [subject, setSubject] = useState("");
  const [role, setRole] = useState<EvidenceRole>("agent");
  const [sourceType, setSourceType] = useState<EvidenceSourceType>("economic-action");
  const [sourceReference, setSourceReference] = useState("");
  const [outcome, setOutcome] = useState<EvidenceOutcome>("success");
  const [detailKey, setDetailKey] = useState("note");
  const [detailValue, setDetailValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!subject) {
      setError('Pick a "subject".');
      return;
    }
    try {
      const evidence = recordEvidence({
        subject,
        role,
        source: { type: sourceType, reference: sourceReference.trim() || undefined },
        outcome,
        detail: detailKey.trim() ? { [detailKey.trim()]: detailValue } : undefined,
      });
      onAdd(evidence);
      setSourceReference("");
      setDetailValue("");
    } catch (err) {
      if (err instanceof AlmaValidationError) setError(`${err.field} — ${err.reason}`);
      else setError(String(err));
    }
  }

  if (identities.length === 0) {
    return <p className="text-ink-soft text-sm">You need at least one identity before you can record contribution evidence for it.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
              <option value="">—</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as EvidenceRole)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm">
              {EVIDENCE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Source type</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as EvidenceSourceType)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm">
              {EVIDENCE_SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Source reference — optional</label>
            <input
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="ea_abc123"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Outcome</label>
          <div className="flex gap-2">
            {EVIDENCE_OUTCOMES.map((o) => (
              <button
                type="button"
                key={o}
                onClick={() => setOutcome(o)}
                className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                  outcome === o
                    ? "border-accent bg-accent-soft text-accent-text"
                    : "border-line bg-paper-raised text-ink-soft hover:border-accent"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Detail key — optional</label>
            <input
              value={detailKey}
              onChange={(e) => setDetailKey(e.target.value)}
              placeholder="note"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Detail value</label>
            <input
              value={detailValue}
              onChange={(e) => setDetailValue(e.target.value)}
              placeholder="delivered the swap in 4s"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          Evidence is append-only — nothing here is ever edited or deleted, only added to, the same way it would accumulate from real EconomicActions, marketplace jobs, or an external registry like ERC-8004.
        </p>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <button type="submit" className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors">
          Record evidence
        </button>
      </form>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-3">
          Contributions ({reputationEvidence.length})
        </h4>
        {reputationEvidence.length === 0 ? (
          <p className="text-sm text-ink-soft italic">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {reputationEvidence
              .slice()
              .reverse()
              .map((r) => (
                <li key={r.id} className="bg-paper-raised border border-line rounded px-3 py-2.5 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{label(identities, r.subject)}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${OUTCOME_COLOR[r.outcome]}`}>
                      {r.outcome}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-ink-soft">
                    {r.role} · {r.source.type}
                    {r.source.reference && ` · ${r.source.reference}`}
                  </div>
                  {r.detail && (
                    <div className="text-xs text-ink-soft">{JSON.stringify(r.detail)}</div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
