import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RESONAR · STORIES THAT FIND EACH OTHER",
  description:
    "An audio social platform for real voice stories with AI-generated atmosphere, powered by turbopuffer + ElevenLabs.",
  openGraph: {
    title: "RESONAR · STORIES THAT FIND EACH OTHER",
    description:
      "An audio social platform for real voice stories with AI-generated atmosphere.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 bg-paper/92 backdrop-blur-[2px] border-b border-ink">
          <nav className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium uppercase tracking-caps">
              <span className="inline-block w-2 h-2 bg-signal vu-pulse rounded-none" />
              <span>RESONAR</span>
              <span className="hidden sm:inline text-ink-faint">▸ ON&nbsp;AIR</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-5 font-mono text-[11px] uppercase tracking-caps">
              <NavLink href="/feed">Feed</NavLink>
              <NavLink href="/search" className="hidden sm:inline">Search</NavLink>
              <NavLink href="/record">Rec</NavLink>
              <NavLink href="/daily">Daily</NavLink>
            </div>
          </nav>
          <div className="h-[2px] bg-ink/90" />
          <div className="h-[1px] bg-ink/30 -mt-[1px]" />
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="max-w-4xl mx-auto px-4 py-10 font-mono text-[10px] uppercase tracking-caps text-ink-faint">
          <div className="ink-rule-faint pt-4 flex flex-wrap gap-x-4 gap-y-1">
            <span>◉ Broadcasting since 2026</span>
            <span>·</span>
            <span>Powered by turbopuffer + ElevenLabs</span>
            <span>·</span>
            <span>Built for ElevenHacks</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-ink hover:text-signal transition-colors ${className ?? ""}`}
    >
      [{children}]
    </Link>
  );
}
