import type { ReactNode } from "react";
import { STATUS_LINE } from "@/lib/site";
import { Eyebrow } from "./ui";

/** The top of a documentation page: where you are, the title, a lead paragraph, the status line. */
export function PageIntro({ eyebrow, title, lead, status = STATUS_LINE }: { eyebrow: string; title: string; lead: ReactNode; status?: string }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 pb-12 pt-14 lg:px-[72px] lg:pt-[72px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-[40px] leading-[1.15] text-ink lg:text-[64px]">{title}</h1>
        <div className="flex max-w-[850px] flex-col gap-5 leading-[1.65] text-ink-soft">
          <p className="text-lg lg:text-xl">{lead}</p>
          <p className="font-mono text-xs">{status}</p>
        </div>
      </div>
    </div>
  );
}

export interface DocEntry {
  id: string;
  label: string;
}

/**
 * A documentation page's body: the list of its sections on the left,
 * which stays in view while the article scrolls, and the article on the
 * right. `edit` is the file this page is written in, on GitHub.
 */
export function DocLayout({ contents, edit, updated, children }: { contents: DocEntry[]; edit: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-16 lg:px-[72px]">
      <nav aria-label="On this page" className="flex flex-col gap-[18px] self-start lg:sticky lg:top-[136px] lg:w-[216px] lg:shrink-0">
        <Eyebrow>ON THIS PAGE</Eyebrow>
        <ul className="text-[13px] text-ink-soft">
          {contents.map((entry) => (
            <li key={entry.id} className="leading-[2.5]">
              <a href={`#${entry.id}`} className="hover:text-link">
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="h-px w-full bg-line" />
        <a href={edit} target="_blank" rel="noreferrer" className="text-sm leading-normal text-violet hover:underline">
          Edit on GitHub ↗
        </a>
        <p className="text-[11px] leading-[1.65] text-ink-soft">Draft · {updated}. The repository is the source of truth.</p>
      </nav>
      <article className="flex min-w-0 flex-1 flex-col gap-14">{children}</article>
    </div>
  );
}

/** One section of an article. `eyebrow` is optional, as in the design: only some sections carry one. */
export function ArticleSection({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-5">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-[26px] leading-[1.15] text-ink lg:text-[32px]">{title}</h2>
      {children}
    </section>
  );
}

/** Body text of an article. */
export function Prose({ children }: { children: ReactNode }) {
  return <p className="text-base leading-[1.65] text-ink">{children}</p>;
}
