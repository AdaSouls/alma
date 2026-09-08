import { useState } from "react";
import {
  createCredentialEvidence,
  revokeCredential,
  CREDENTIAL_FORMATS,
  AlmaValidationError,
  type AlmaIdentity,
  type CredentialEvidence,
  type CredentialFormat,
} from "@adasouls/alma-core";

interface Props {
  identities: AlmaIdentity[];
  credentials: CredentialEvidence[];
  onAdd: (credential: CredentialEvidence) => void;
  onUpdate: (credential: CredentialEvidence) => void;
}

function label(identities: AlmaIdentity[], id: string): string {
  return identities.find((i) => i.id === id)?.displayName ?? id;
}

export function CredentialPanel({ identities, credentials, onAdd, onUpdate }: Props) {
  const [subject, setSubject] = useState("");
  const [issuer, setIssuer] = useState("");
  const [type, setType] = useState("");
  const [claimKey, setClaimKey] = useState("tier");
  const [claimValue, setClaimValue] = useState("");
  const [format, setFormat] = useState<CredentialFormat>("w3c-vc");
  const [artifact, setArtifact] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!subject || !issuer.trim() || !type.trim()) {
      setError('Pick a "subject" and fill in "issuer" and "type".');
      return;
    }
    try {
      const credential = createCredentialEvidence({
        subject,
        issuer: issuer.trim(),
        type: type.trim(),
        claim: claimKey.trim() ? { [claimKey.trim()]: claimValue } : {},
        format,
        artifact: artifact.trim() || undefined,
      });
      onAdd(credential);
      setType("");
      setClaimValue("");
      setArtifact("");
    } catch (err) {
      if (err instanceof AlmaValidationError) setError(`${err.field} — ${err.reason}`);
      else setError(String(err));
    }
  }

  if (identities.length === 0) {
    return <p className="text-ink-soft text-sm">You need at least one identity before you can attach a credential to it.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised">
            <option value="">—</option>
            {identities.map((i) => (
              <option key={i.id} value={i.id}>{i.displayName}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Issuer</label>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="alma:main:org:acme-labs"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Type</label>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="kyb-tier"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Claim key</label>
            <input
              value={claimKey}
              onChange={(e) => setClaimKey(e.target.value)}
              placeholder="tier"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Claim value</label>
            <input
              value={claimValue}
              onChange={(e) => setClaimValue(e.target.value)}
              placeholder="verified"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as CredentialFormat)} className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm">
              {CREDENTIAL_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Artifact — optional</label>
            <input
              value={artifact}
              onChange={(e) => setArtifact(e.target.value)}
              placeholder="https://... / a VC JWT"
              className="w-full px-3 py-2 rounded border border-line bg-paper-raised font-mono text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          ALMA doesn't define a new credential format — this is evidence that a credential exists and what it claims, carrying only the minimum necessary claim (a boolean/tier, not underlying documents). Verification itself is a stub in v1.
        </p>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <button type="submit" className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors">
          Add credential evidence
        </button>
      </form>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-3">
          Credentials ({credentials.length})
        </h4>
        {credentials.length === 0 ? (
          <p className="text-sm text-ink-soft italic">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {credentials.map((c) => (
              <li key={c.id} className="bg-paper-raised border border-line rounded px-3 py-2.5 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{label(identities, c.subject)}</span>
                    <span className="text-accent-text font-mono mx-1">· {c.type}</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      c.verificationStatus === "verified"
                        ? "border-evidence text-evidence"
                        : "border-line text-ink-soft"
                    }`}
                  >
                    {c.verificationStatus}
                  </span>
                </div>
                <div className="font-mono text-xs text-ink-soft">
                  issuer: {c.issuer} · {JSON.stringify(c.claim)} · {c.format}
                </div>
                {c.verificationStatus !== "revoked" && (
                  <button
                    onClick={() => onUpdate(revokeCredential(c, c.issuer))}
                    className="text-xs font-mono text-red-700 hover:underline"
                  >
                    revoke
                  </button>
                )}
                {c.revocation && (
                  <div className="text-xs text-ink-soft">revoked by {c.revocation.by}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
