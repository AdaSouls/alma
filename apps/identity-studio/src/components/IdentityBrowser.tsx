import { useState } from "react";
import type { AlmaIdentity } from "@adasouls/alma-core";

interface Props {
  identities: AlmaIdentity[];
}

const TYPE_COLOR: Record<string, string> = {
  human: "bg-amber-50 text-amber-700 border-amber-200",
  organization: "bg-blue-50 text-blue-700 border-blue-200",
  agent: "bg-accent-soft text-accent-text border-accent",
};

export function IdentityBrowser({ identities }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(identities[0]?.id ?? null);
  const selected = identities.find((i) => i.id === selectedId) ?? null;

  if (identities.length === 0) {
    return (
      <p className="text-ink-soft text-sm">
        No identities yet — issue one from the <span className="font-medium text-ink">Create</span> tab.
      </p>
    );
  }

  function exportIdentity(identity: AlmaIdentity) {
    const blob = new Blob([JSON.stringify(identity, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${identity.id.replaceAll(":", "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        {identities.map((i) => (
          <button
            key={i.id}
            onClick={() => setSelectedId(i.id)}
            className={`w-full text-left px-4 py-3 rounded border transition-colors ${
              i.id === selectedId ? "border-accent bg-accent-soft" : "border-line bg-paper-raised hover:border-accent"
            }`}
          >
            <div className={`inline-block text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border mb-1 ${TYPE_COLOR[i.subjectType]}`}>
              {i.subjectType}
            </div>
            <div className="font-medium text-ink">{i.displayName}</div>
            <div className="text-xs font-mono text-ink-soft truncate">{i.id}</div>
          </button>
        ))}
      </div>

      <div className="md:col-span-2">
        {selected && (
          <div className="rounded border border-line bg-paper-raised p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`inline-block text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border mb-2 ${TYPE_COLOR[selected.subjectType]}`}>
                  {selected.subjectType}
                </div>
                <h3 className="font-display text-2xl text-ink">{selected.displayName}</h3>
                <p className="mono-chip mt-2 inline-block">{selected.id}</p>
              </div>
              <button
                onClick={() => exportIdentity(selected)}
                className="text-xs font-mono px-3 py-1.5 rounded border border-line hover:border-accent hover:text-accent-text whitespace-nowrap"
              >
                Export JSON
              </button>
            </div>

            {selected.principal && (
              <p className="text-sm text-ink-soft">
                Represents <span className="font-mono text-ink">{selected.principal}</span>
              </p>
            )}

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">
                Controllers / bindings ({selected.controllers.length})
              </h4>
              {selected.controllers.length === 0 ? (
                <p className="text-sm text-ink-soft italic">None yet.</p>
              ) : (
                <ul className="space-y-1">
                  {selected.controllers.map((c, i) => (
                    <li key={i} className="text-sm font-mono">
                      <span className="text-ink-soft">{c.type}:</span> {c.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wide text-ink-soft mb-2">Identity record</h4>
              <pre className="text-xs font-mono bg-paper border border-line rounded p-4 overflow-x-auto">
                {JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
