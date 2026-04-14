"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  ProfileIcon,
  MicIcon,
} from "./Icons";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof HomeIcon;
  match: (p: string) => boolean;
}> = [
  { href: "/feed", label: "Home", icon: HomeIcon, match: (p) => p === "/" || p.startsWith("/feed") },
  { href: "/search", label: "Search", icon: SearchIcon, match: (p) => p.startsWith("/search") },
  { href: "/daily", label: "Daily", icon: LibraryIcon, match: (p) => p.startsWith("/daily") },
  { href: "/profile", label: "Profile", icon: ProfileIcon, match: (p) => p.startsWith("/profile") },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside className="hidden lg:flex h-screen sticky top-0 flex-col px-5 py-7 gap-1">
      <Link href="/" className="block px-2 mb-7">
        <h1 className="font-sans text-2xl font-semibold text-espresso tracking-tight">
          resonar<span className="text-plum">.</span>
        </h1>
        <p className="font-sans text-xs text-espresso-faint italic mt-0.5">
          stories, wrapped warm.
        </p>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors ${
                active
                  ? "bg-plum text-cream"
                  : "text-espresso-soft hover:bg-cream-soft hover:text-espresso"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-sans text-[15px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/record"
        className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-plum text-cream font-sans text-sm font-semibold hover:bg-plum-deep transition-colors shadow-cozy-sm"
      >
        <MicIcon className="w-4 h-4" />
        Record a story
      </Link>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-olive text-cream flex items-center justify-center font-semibold text-sm shadow-cozy-sm">
            U
          </div>
          <div className="min-w-0">
            <div className="font-sans text-sm font-semibold text-espresso truncate">
              Anonymous
            </div>
            <div className="font-sans text-[10px] tracking-[0.1em] uppercase text-espresso-faint">
              guest mode
            </div>
          </div>
        </div>
        <div className="font-sans text-[10px] text-espresso-faint mt-4 px-2 leading-relaxed">
          Built with turbopuffer + ElevenLabs · ElevenHacks
        </div>
      </div>
    </aside>
  );
}
