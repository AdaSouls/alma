import { useState } from "react";
import {
  createIdentity,
  SUBJECT_TYPES,
  CONTROLLER_TYPES,
  type AlmaIdentity,
  type SubjectType,
  type Controller,
  type ControllerType,
  AlmaValidationError,
} from "@adasouls/alma-core";

interface Props {
  existing: AlmaIdentity[];
  onCreated: (identity: AlmaIdentity) => void;
}

const SUBJECT_LABEL: Record<SubjectType, string> = {
  human: "Human",
  organization: "Organization",
  agent: "Agent",
};

export function IdentityForm({ existing, onCreated }: Props) {
  const [subjectType, setSubjectType] = useState<SubjectType>("agent");
  const [displayName, setDisplayName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addControllerRow() {
    setControllers((c) => [...c, { type: "wallet", value: "" }]);
  }

  function updateController(index: number, patch: Partial<Controller>) {
    setControllers((c) => c.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeController(index: number) {
    setControllers((c) => c.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const identity = createIdentity({
        subjectType,
        displayName,
        principal: principal || undefined,
        controllers: controllers.filter((c) => c.value.trim().length > 0),
      });
      onCreated(identity);
      setDisplayName("");
      setPrincipal("");
      setControllers([]);
    } catch (err) {
      if (err instanceof AlmaValidationError) setError(`${err.field} — ${err.reason}`);
      else setError(String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
          Subject type
        </label>
        <div className="flex gap-2">
          {SUBJECT_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setSubjectType(t)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                subjectType === t
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-line bg-paper-raised text-ink-soft hover:border-accent"
              }`}
            >
              {SUBJECT_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
          Display name
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={subjectType === "agent" ? "Treasury Agent" : subjectType === "organization" ? "Acme Labs" : "Matias"}
          className="w-full px-3 py-2 rounded border border-line bg-paper-raised focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        <p className="text-xs text-ink-soft mt-1">
          The identifier is derived from this: <span className="font-mono">alma:main:{subjectType}:…</span>
        </p>
      </div>

      {subjectType === "agent" && (
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
            Represents (principal) — optional
          </label>
          <select
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full px-3 py-2 rounded border border-line bg-paper-raised"
          >
            <option value="">— none yet —</option>
            {existing
              .filter((i) => i.subjectType !== "agent")
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.displayName} ({i.id})
                </option>
              ))}
          </select>
          <p className="text-xs text-ink-soft mt-1">
            An agent always represents a Principal — a Human or an Organization — whose authority it ultimately traces back to.
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft">
            Controllers / bindings — optional
          </label>
          <button type="button" onClick={addControllerRow} className="text-xs font-mono text-accent-text hover:underline">
            + add
          </button>
        </div>
        <p className="text-xs text-ink-soft mb-2">
          Wallets, DIDs, or endpoints this identity is currently controlled through. These can change without changing the identifier.
        </p>
        <div className="space-y-2">
          {controllers.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={c.type}
                onChange={(e) => updateController(i, { type: e.target.value as ControllerType })}
                className="px-2 py-1.5 rounded border border-line bg-paper-raised text-sm font-mono"
              >
                {CONTROLLER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                value={c.value}
                onChange={(e) => updateController(i, { value: e.target.value })}
                placeholder="0xAbCd... / did:key:... / https://..."
                className="flex-1 px-3 py-1.5 rounded border border-line bg-paper-raised text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => removeController(i)}
                className="px-2 text-ink-soft hover:text-ink"
                aria-label="Remove controller"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      <button
        type="submit"
        className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-text transition-colors"
      >
        Issue identity
      </button>
    </form>
  );
}
