"use client";

import { useState } from "react";

/** Copies a piece of text and says so for a moment. `icon` shows only the glyph, for tight places. */
export function CopyButton({ text, className = "", icon }: { text: string; className?: string; icon?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-label={icon ? "Copy" : undefined}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? (icon ? "✓" : "Copied ✓") : icon ? "⧉" : "Copy ⧉"}
    </button>
  );
}
