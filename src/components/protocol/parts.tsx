import type { ReactNode } from "react";

/**
 * Pieces the Protocol text needs and the design's Protocol frame doesn't
 * draw, because its copy is a stand-in with flatter sections. Each one
 * borrows the nearest treatment the design does have.
 */

/** A numbered subsection inside an article section: "3.1 — Subjects". */
export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-3 text-xl leading-[1.3] text-ink lg:text-[22px]">{children}</h3>;
}

/** A term of the protocol named inside running text. */
export function Mono({ children }: { children: ReactNode }) {
  return <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.88em] text-ink">{children}</code>;
}

/** A sentence the text sets apart from the paragraphs around it. */
export function Standout({ children }: { children: ReactNode }) {
  return <p className="text-xl leading-[1.5] text-ink lg:text-[22px]">{children}</p>;
}

/** A quotation, drawn as the design's note without a label. */
export function PullQuote({ children }: { children: ReactNode }) {
  return <blockquote className="border-l-2 border-violet bg-note p-5 text-lg leading-[1.6] text-ink">{children}</blockquote>;
}

/** Terms and what they mean, drawn as the records of the reference table. Stacks on a phone. */
export function Definitions({ items }: { items: { term: string; meaning: string }[] }) {
  return (
    <dl className="overflow-hidden rounded-md border border-line">
      {items.map((item, i) => (
        <div key={item.term} className={`flex flex-col gap-1 border-line p-4 text-[13px] leading-[1.6] md:flex-row md:gap-5 ${i > 0 ? "border-t" : ""} ${i % 2 ? "bg-paper" : "bg-white"}`}>
          <dt className="text-ink md:w-64 md:shrink-0">{item.term}</dt>
          <dd className="min-w-0 flex-1 text-ink-soft">{item.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A list in the article's body text. */
export function DocList({ ordered, children }: { ordered?: boolean; children: ReactNode }) {
  const List = ordered ? "ol" : "ul";
  return <List className={`flex flex-col gap-2 pl-5 text-base leading-[1.65] text-ink marker:text-ink-soft ${ordered ? "list-decimal" : "list-disc"}`}>{children}</List>;
}
