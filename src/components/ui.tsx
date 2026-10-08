import Link from "next/link";
import type { ReactNode } from "react";

const isExternal = (href: string) => href.startsWith("http");

/** A link that leaves the site opens in a new tab; one that stays uses the router. */
export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** The site's two buttons: the gradient one for the main action, the white one beside it. */
export function ButtonLink({ href, variant = "primary", children }: { href: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  const look =
    variant === "primary"
      ? "border-violet-bright bg-gradient-to-r from-teal to-violet text-white hover:brightness-110"
      : "border-line-soft bg-white text-ink hover:border-violet";
  return (
    <SmartLink href={href} className={`inline-flex items-center whitespace-nowrap rounded-md border px-5 py-3.5 text-sm leading-none transition ${look}`}>
      {children}
    </SmartLink>
  );
}

/** The small mono line above a heading: "01 / THE MISSING LINK". */
export function Eyebrow({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "violet" }) {
  return <p className={`font-mono text-xs leading-normal ${tone === "teal" ? "text-teal" : "text-violet"}`}>{children}</p>;
}

/** A text link in the accent colour, with its arrow written in the label. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <SmartLink href={href} className="text-sm leading-normal text-violet hover:underline">
      {children}
    </SmartLink>
  );
}

/** One full-width band of a page. `tint` alternates the background, as the design does. */
export function Section({ tint, id, children, className = "" }: { tint?: boolean; id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`border-t border-line ${tint ? "bg-tint" : "bg-paper"}`}>
      <div className={`mx-auto max-w-[1440px] px-6 py-14 lg:px-[72px] lg:py-20 ${className}`}>{children}</div>
    </section>
  );
}

/** A white card: an eyebrow, a title, and whatever follows. */
export function Card({ eyebrow, eyebrowTone = "violet", title, children, className = "" }: { eyebrow?: string; eyebrowTone?: "teal" | "violet"; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-line-soft bg-white p-6 ${className}`}>
      {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
      <h3 className="text-[22px] leading-[1.15] text-ink">{title}</h3>
      {children && <div className="text-sm leading-[1.65] text-ink-soft">{children}</div>}
    </div>
  );
}

/**
 * A note set apart from the text: something not settled yet, a limit, a
 * caveat. The label is short and says what kind of note it is.
 */
export function StatusNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="border-l-2 border-violet bg-note p-5">
      <p className="font-mono text-xs leading-[1.7] text-link">{label}</p>
      <div className="text-sm leading-[1.7] text-ink">{children}</div>
    </aside>
  );
}

/** A reference table: a tinted heading row, then records on alternating backgrounds. Stacks on a phone. */
export function RefTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div role="table" className="overflow-hidden rounded-md border border-line">
      <div role="row" className="hidden gap-5 bg-tint p-4 text-xs font-semibold leading-[1.4] text-ink md:flex">
        {columns.map((c) => (
          <p role="columnheader" key={c} className="min-w-0 flex-1">
            {c}
          </p>
        ))}
      </div>
      {rows.map((row, i) => (
        <div role="row" key={i} className={`flex flex-col gap-1 border-line p-4 text-[13px] leading-[1.6] md:flex-row md:gap-5 ${i > 0 ? "border-t" : "md:border-t"} ${i % 2 ? "bg-paper" : "bg-white"}`}>
          {row.map((cell, j) => (
            <div role="cell" key={j} className={`min-w-0 flex-1 break-words ${j === 0 ? "text-ink" : "text-ink-soft"}`}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
