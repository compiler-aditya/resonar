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
import { useGuest, initialFor } from "./UseGuest";

const NAV: Array<{
  label: string;
  icon: typeof HomeIcon;
  href: (guestId: string | null) => string;
  match: (p: string) => boolean;
}> = [
  { label: "Home", icon: HomeIcon, href: () => "/feed", match: (p) => p === "/" || p.startsWith("/feed") },
  { label: "Search", icon: SearchIcon, href: () => "/search", match: (p) => p.startsWith("/search") },
  { label: "Globe", icon: GlobeNavIcon, href: () => "/globe", match: (p) => p.startsWith("/globe") },
  { label: "Daily", icon: LibraryIcon, href: () => "/daily", match: (p) => p.startsWith("/daily") },
  {
    label: "Profile",
    icon: ProfileIcon,
    href: (guestId) => (guestId ? `/profile/${guestId}` : "/feed"),
    match: (p) => p.startsWith("/profile"),
  },
];

function GlobeNavIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const guest = useGuest();
  const username = guest?.username;
  const guestId = guest?.guestId ?? null;

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
          const href = item.href(guestId);
          return (
            <Link
              key={item.label}
              href={href}
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

      {!guest?.voiceId && (
        <Link
          href="/voice/setup"
          className="mt-2 text-center font-sans text-[11px] text-olive font-semibold hover:text-plum transition-colors"
        >
          ◌ Teach Resonar your voice
        </Link>
      )}

      <div className="mt-auto pt-6">
        {username && guestId ? (
          <Link
            href={`/profile/${guestId}`}
            className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-cream-soft transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-olive text-cream flex items-center justify-center font-semibold text-sm shadow-cozy-sm shrink-0">
              {initialFor(username)}
            </div>
            <div className="min-w-0">
              <div className="font-sans text-sm font-semibold text-espresso truncate">
                {username}
              </div>
              <div className="font-sans text-[10px] tracking-[0.1em] uppercase text-espresso-faint">
                you
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-cream-soft animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-24 h-2 rounded bg-cream-soft animate-pulse" />
              <div className="w-12 h-1.5 rounded bg-cream-soft animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
