"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GITHUB_URL, PAGES, STATUS_LINE } from "@/lib/site";
import { ButtonLink } from "./ui";

function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <Link href="/" className={`flex items-center ${compact ? "gap-2" : "gap-3"}`} aria-label="ALMA, home">
        <Image src="/alma-logo.svg" alt="" width={compact ? 28 : 40} height={compact ? 35 : 50} priority />
        <span className="text-[28px] leading-none text-ink">ALMA</span>
      </Link>
      <a href="https://www.adasouls.io" target="_blank" rel="noreferrer" className="pl-1 pt-2.5 text-[10px] text-ink-soft hover:text-ink">
        by AdaSouls
      </a>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The drawer covers the page: close it on Escape, and keep the page behind it from scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-paper">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-6 lg:px-[72px]">
        <span className="hidden lg:block">
          <Brand />
        </span>
        <span className="lg:hidden">
          <Brand compact />
        </span>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} aria-current={pathname === p.href ? "page" : undefined} className="text-[13px] text-ink hover:text-violet aria-[current=page]:text-violet">
              {p.label}
            </Link>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[13px] text-ink hover:text-violet">
            GitHub ↗
          </a>
          <ButtonLink href="/developers">Get started →</ButtonLink>
        </nav>

        <button type="button" className="lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
          <Image src="/icon-menu.svg" alt="" width={24} height={24} />
        </button>
      </div>

      {open && (
        <div id="mobile-navigation" className="fixed inset-x-0 top-[88px] bottom-0 z-30 flex flex-col items-start gap-7 overflow-y-auto bg-paper p-6 lg:hidden">
          <button type="button" onClick={() => setOpen(false)} className="font-mono text-xs leading-normal text-teal">
            NAVIGATION · CLOSE ×
          </button>
          <nav aria-label="Primary" className="flex flex-col items-start gap-7">
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} onClick={() => setOpen(false)} aria-current={pathname === p.href ? "page" : undefined} className="text-[26px] text-ink aria-[current=page]:text-violet">
                {p.label}
              </Link>
            ))}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[26px] text-ink">
              GitHub ↗
            </a>
          </nav>
          <Link href="/developers" onClick={() => setOpen(false)} className="rounded-md border border-violet bg-violet px-5 py-3.5 text-sm text-white">
            Get started →
          </Link>
          <p className="text-xs leading-[1.65] text-ink-soft">{STATUS_LINE}</p>
        </div>
      )}
    </header>
  );
}
