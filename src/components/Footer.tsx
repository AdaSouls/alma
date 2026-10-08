import Link from "next/link";
import { GITHUB_URL, SPEC, npmUrl } from "@/lib/site";

type FooterLink = { label: string; href: string };
const external = (href: string) => href.startsWith("http");

/** Only what exists is linked: a page that isn't built yet has no entry here. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Protocol",
    links: [
      { label: "Overview", href: "/protocol" },
      { label: "Reputation", href: "/reputation" },
      { label: "Spec on GitHub ↗", href: `${GITHUB_URL}/tree/develop/spec/alma-v1` },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Developers", href: "/developers" },
      { label: "GitHub ↗", href: GITHUB_URL },
      { label: "npm ↗", href: npmUrl("@adasouls/alma-core") },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Changelog on GitHub ↗", href: `${GITHUB_URL}/blob/develop/packages/alma-core/CHANGELOG.md` },
      { label: "Issues ↗", href: `${GITHUB_URL}/issues` },
    ],
  },
  {
    title: "AdaSouls",
    links: [
      { label: "adasouls.io ↗", href: "https://www.adasouls.io" },
      { label: "Developers ↗", href: "https://www.adasouls.io/developers" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-14 lg:px-[72px]">
        <div className="flex flex-col gap-10 text-ink-soft lg:flex-row lg:gap-16">
          <div className="lg:w-[300px] lg:shrink-0">
            <p className="text-[40px] font-semibold leading-[1.7] text-ink">ALMA</p>
            <p className="mt-6 text-sm leading-[1.7]">Identity is persistent. Authority is delegated. Reputation is earned. Trust is contextual.</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-6 text-xs sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="leading-[2.5] text-ink">{column.title}</p>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label} className="leading-[2.5]">
                      {external(link.href) ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-ink">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="hover:text-ink">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="h-px w-full bg-line-soft" />
        <p className="text-xs leading-[1.65] text-ink-soft">ALMA is an open protocol by AdaSouls · MIT licensed · Draft spec {SPEC}</p>
      </div>
    </footer>
  );
}
