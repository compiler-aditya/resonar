import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Newsreader } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import BottomNav from "@/components/BottomNav";
import { MicIcon } from "@/components/Icons";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-newsreader",
  display: "swap",
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
      <body className="min-h-screen pb-36">
        <header className="pt-6 pb-3 px-5">
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
              <Link
                href="/profile"
                aria-label="Your profile"
                className="w-10 h-10 rounded-full bg-plum text-cream flex items-center justify-center font-semibold text-sm hover:bg-plum-deep transition-colors shadow-cozy-sm"
              >
                U
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-md sm:max-w-2xl mx-auto px-5">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
