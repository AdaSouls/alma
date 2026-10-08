import { CopyButton } from "./CopyButton";

/**
 * A dark panel with code in it: a mono label on the left ("INSTALL /
 * NPM"), a copy button on the right. Long lines scroll sideways instead
 * of wrapping, so what is copied is what is shown.
 */
export function CodeBlock({ label, code, wrap }: { label: string; code: string; wrap?: boolean }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-night p-5 text-night-text shadow-panel sm:p-7">
      <div className="flex items-start gap-3 text-[11px] leading-normal">
        <p className="min-w-0 flex-1 font-mono">{label}</p>
        <CopyButton text={code} className="shrink-0 hover:text-white" />
      </div>
      <pre className={`font-mono text-[13px] leading-[1.7] sm:text-sm ${wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto"}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
