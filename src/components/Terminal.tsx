export interface TerminalLine {
  text: string;
  kind?: "ok" | "pending" | "dim" | "bold" | "plain";
}

const KIND_CLASS: Record<NonNullable<TerminalLine["kind"]>, string> = {
  ok: "text-emerald-400",
  pending: "text-neutral-500",
  dim: "text-neutral-500",
  bold: "text-white font-semibold",
  plain: "text-neutral-200",
};

export function Terminal({ prompt, lines }: { prompt: string; lines: TerminalLine[] }) {
  return (
    <div className="rounded-lg bg-[#12151d] border border-black/20 overflow-hidden shadow-xl">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
      </div>
      <div className="px-5 py-5 font-mono text-[13.5px] leading-relaxed overflow-x-auto">
        <div className="text-accent-text mb-2">
          <span className="text-neutral-500">$</span> {prompt}
        </div>
        {lines.map((line, i) => (
          <div key={i} className={KIND_CLASS[line.kind ?? "plain"]}>
            {line.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}
