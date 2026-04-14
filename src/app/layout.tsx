import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Newsreader } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import MobileProfileButton from "@/components/MobileProfileButton";
import { MicIcon } from "@/components/Icons";
import "./globals.css";

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Noto Sans",
    "Noto Sans Arabic",
    "Noto Sans Devanagari",
    "Noto Sans CJK SC",
    "Noto Sans JP",
    "sans-serif",
  ],
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-newsreader",
  display: "swap",
  fallback: [
    "Georgia",
    "Cambria",
    "Noto Serif",
    "Noto Naskh Arabic",
    "Noto Serif Devanagari",
    "Noto Serif CJK SC",
    "Noto Serif JP",
    "serif",
  ],
});

export const metadata: Metadata = {
  title: "resonar. stories wrapped warm.",
  description:
    "An audio social platform for real voice stories with AI-generated atmosphere, powered by turbopuffer + ElevenLabs.",
  openGraph: {
    title: "resonar. stories wrapped warm.",
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
    <html lang="en" className={`${sora.variable} ${newsreader.variable}`}>
      <body className="min-h-screen pb-36 lg:pb-0">
        {/* Mobile / tablet header — hidden on lg */}
        <header className="lg:hidden pt-6 pb-3 px-5">
          <div className="max-w-md sm:max-w-2xl mx-auto flex items-start justify-between gap-4">
            <Link href="/" className="group">
              <h1 className="font-sans text-2xl font-semibold text-espresso tracking-tight">
                resonar<span className="text-plum">.</span>
              </h1>
              <p className="font-sans text-xs text-espresso-faint italic mt-0.5">
                stories, wrapped warm.
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/record"
                aria-label="Record a story"
                className="w-10 h-10 rounded-full bg-olive text-cream flex items-center justify-center hover:bg-olive-soft transition-colors shadow-cozy-sm"
              >
                <MicIcon className="w-5 h-5" />
              </Link>
              <MobileProfileButton />
            </div>
          </div>
        </header>

        {/* Desktop layout: 3-column grid */}
        <div className="lg:grid lg:grid-cols-[250px_minmax(0,640px)_320px] lg:gap-8 lg:max-w-[1280px] lg:mx-auto lg:px-6">
          <Sidebar />
          <main className="max-w-md sm:max-w-2xl mx-auto lg:max-w-none lg:mx-0 px-5 lg:px-0 lg:py-7 w-full">
            <PageTransition>{children}</PageTransition>
          </main>
          <RightRail />
        </div>

        <BottomNav />
      </body>
    </html>
  );
}
