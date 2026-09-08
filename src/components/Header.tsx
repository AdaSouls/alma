import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/protocol", label: "Protocol" },
  { href: "/developers", label: "Developers" },
  { href: "https://github.com/AdaSouls/alma", label: "GitHub" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-paper-raised">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/alma-mark.png" alt="" width={28} height={28} />
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            <span className="text-ink font-semibold">AdaSouls</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft hover:text-accent-text transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
