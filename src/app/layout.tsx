import type { Metadata } from "next";
import { fraunces, publicSans, plexMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ALMA — A portable economic actor protocol",
    template: "%s · ALMA",
  },
  description:
    "ALMA gives humans, organizations, and autonomous agents a portable economic identity — identity, representation, authority, relationships, evidence, and intent, connected across otherwise independent protocols.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
