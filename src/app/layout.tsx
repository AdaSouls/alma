import type { Metadata } from "next";
import { inter, plexMono } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION =
  "ALMA gives every AI agent a portable identity, a verifiable record of who it represents and what it may do, and a reputation built from signed, tamper-evident evidence.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ALMA · Verifiable reputation for AI agents",
    template: "%s · ALMA",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ALMA",
    url: SITE_URL,
    title: "ALMA · Verifiable reputation for AI agents",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
