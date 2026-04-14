import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resonar · Stories that find each other",
  description: "An audio social platform for real voice stories with AI-generated atmosphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b10] text-white antialiased min-h-screen">
        <header className="sticky top-0 z-50 backdrop-blur bg-[#0b0b10]/80 border-b border-white/5">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Resonar
            </Link>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <Link href="/feed" className="hover:text-white">Feed</Link>
              <Link href="/search" className="hover:text-white">Search</Link>
              <Link href="/record" className="hover:text-white">Record</Link>
              <Link href="/daily" className="hover:text-white">Daily</Link>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
