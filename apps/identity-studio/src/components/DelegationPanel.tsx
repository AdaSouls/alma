import { useState } from "react";
import {
  createDelegation,
  revokeDelegation,
  PROOF_FORMATS,
  AlmaValidationError,
  type AlmaIdentity,
  type Delegation,
  type ProofFormat,
} from "@adasouls/alma-core";

interface Props {
  identities: AlmaIdentity[];
  delegations: Delegation[];
  onAdd: (delegation: Delegation) => void;
  onUpdate: (delegation: Delegation) => void;
}

function label(identities: AlmaIdentity[], id: string): string {
  return identities.find((i) => i.id === id)?.displayName ?? id;
}

export function DelegationPanel({ identities, delegations, onAdd, onUpdate }: Props) {
  const [issuer, setIssuer] = useState("");
  const [subject, setSubject] = useState("");
  const [capabilities, setCapabilities] = useState("pay");
  const [proofFormat, setProofFormat] = useState<ProofFormat | "">("");
  const [proofReference, setProofReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!issuer || !subject) {
      setError('Pick both an "issuer" and a "subject".');
      return;
    }
    try {
      const delegation = createDelegation({
        issuer,
        subject,
        scope: { capabilities: capabilities.split(",").map((c) => c.trim()).filter(Boolean) },
        proof: proofFormat ? { format: proofFormat, reference: proofReference || undefined } : undefined,
      });
      onAdd(delegation);
      setCapabilities("pay");
      setProofReference("");
    } catch (err) {
      if (err instanceof AlmaValidationError) setError(`${err.field} — ${err.reason}`);
      else setError(String(err));
    }
  }

  if (identities.length < 2) {
    return <p className="text-ink-soft text-sm">You need at least two identities before you can delegate authority between them.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Issuer</label>
            <select value={issuer} onChange={(e) => setIssuer(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
              <option value="">—</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Subject (agent)</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
              <option value="">—</option>
              {identities.filter((i) => i.id !== issuer).map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Capabilities</label>
          <input
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="pay, swap"
            className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Proof format — optional</label>
            <select value={proofFormat} onChange={(e) => setProofFormat(e.target.value as ProofFormat | "")} className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm">
              <option value="">— none —</option>
              {PROOF_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Reference</label>
            <input
              value={proofReference}
              onChange={(e) => setProofReference(e.target.value)}
              disabled={!proofFormat}
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm disabled:opacity-50"
            />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          ALMA defines what this delegation means; the proof format is whichever protocol actually backs it — an AP2 mandate, a Verifiable Intent credential, a W3C VC, or an ALMA-native signature.
        </p>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <button type="submit" className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors">
          Grant delegation
        </button>
      </form>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-3">
          Delegations ({delegations.length})
        </h4>
        {delegations.length === 0 ? (
          <p className="text-sm text-ink-soft italic">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {delegations.map((d) => (
              <li key={d.id} className="bg-paper-raised border border-line rounded px-3 py-2.5 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{label(identities, d.issuer)}</span>
                    <span className="text-accent-text font-mono mx-1">→ delegates →</span>
                    <span className="font-medium">{label(identities, d.subject)}</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      d.status === "active"
                        ? "border-evidence text-evidence"
                        : "border-line text-ink-soft"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="font-mono text-xs text-ink-soft">
                  {d.scope.capabilities.join(", ")}
                  {d.proof && ` · proof: ${d.proof.format}`}
                </div>
                {d.status === "active" && (
                  <button
                    onClick={() => onUpdate(revokeDelegation(d, d.issuer))}
                    className="text-xs font-mono text-red-700 hover:underline"
                  >
                    revoke
                  </button>
                )}
                {d.revocation && (
                  <div className="text-xs text-ink-soft">revoked by {label(identities, d.revocation.by)}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
