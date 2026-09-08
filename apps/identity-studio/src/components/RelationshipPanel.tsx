import { useState } from "react";
import {
  createRelationship,
  wouldCreateDelegationCycle,
  RELATIONSHIP_TYPES,
  AlmaValidationError,
  type AlmaIdentity,
  type Relationship,
  type RelationshipType,
} from "@adasouls/alma-core";

interface Props {
  identities: AlmaIdentity[];
  relationships: Relationship[];
  onAdd: (relationship: Relationship) => void;
}

const EVIDENCE_TYPES = new Set<RelationshipType>(["hired", "paid", "transacted_with"]);

function label(identities: AlmaIdentity[], id: string): string {
  return identities.find((i) => i.id === id)?.displayName ?? id;
}

export function RelationshipPanel({ identities, relationships, onAdd }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<RelationshipType>("owns");
  const [sourceRef, setSourceRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsEvidence = EVIDENCE_TYPES.has(type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!from || !to) {
      setError("Pick both a \"from\" and a \"to\" identity.");
      return;
    }
    if (wouldCreateDelegationCycle(relationships, { from, to, type })) {
      setError(`Adding "${label(identities, from)} delegates ${label(identities, to)}" would create a delegation cycle.`);
      return;
    }
    try {
      const relationship = createRelationship({ from, to, type, sourceRef: sourceRef || undefined });
      onAdd(relationship);
      setSourceRef("");
    } catch (err) {
      if (err instanceof AlmaValidationError) setError(`${err.field} — ${err.reason}`);
      else setError(String(err));
    }
  }

  if (identities.length < 2) {
    return <p className="text-ink-soft text-sm">You need at least two identities before you can relate them — issue a second one first.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
              <option value="">—</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">To</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
              <option value="">—</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Relationship</label>
          <select value={type} onChange={(e) => setType(e.target.value as RelationshipType)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm">
            {RELATIONSHIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {needsEvidence && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
              Evidence reference (required)
            </label>
            <input
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              placeholder="eco_9a1b… (the EconomicAction or event that justifies this edge)"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
            <p className="text-xs text-ink-soft mt-1">
              "{type}" edges must trace back to something that actually happened — ALMA never asserts one without evidence.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <button type="submit" className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors">
          Add relationship
        </button>
      </form>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-3">
          Relationship graph ({relationships.length})
        </h4>
        {relationships.length === 0 ? (
          <p className="text-sm text-ink-soft italic">No edges yet.</p>
        ) : (
          <ul className="space-y-2">
            {relationships.map((r, i) => (
              <li key={i} className="text-sm font-mono bg-paper-raised border border-line rounded px-3 py-2 flex flex-wrap items-center gap-1.5">
                <span className="font-sans font-medium not-italic">{label(identities, r.from)}</span>
                <span className="text-accent-text">— {r.type} →</span>
                <span className="font-sans font-medium">{label(identities, r.to)}</span>
                {r.sourceRef && <span className="text-ink-soft text-xs ml-2">({r.sourceRef})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
