"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SearchIcon, LibraryIcon, ProfileIcon } from "./Icons";
import { useGuest } from "./UseGuest";

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const guest = useGuest();
  const profileHref = guest?.guestId ? `/profile/${guest.guestId}` : "/feed";
  const isActive = (p: string) => {
    if (p === "/") return pathname === "/";
    return pathname.startsWith(p);
  };

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md mx-auto mb-3 px-4">
        <div className="relative bg-cream/95 backdrop-blur-sm rounded-[28px] shadow-cozy-lg border border-espresso/5">
          <div className="grid grid-cols-5 items-center px-3 py-2">
            <TabItem href="/feed" label="HOME" icon={<HomeIcon className="w-6 h-6" />} active={isActive("/feed")} />
            <TabItem href="/search" label="SEARCH" icon={<SearchIcon className="w-6 h-6" />} active={isActive("/search")} />
            <div className="flex justify-center" />
            <TabItem href="/daily" label="DAILY" icon={<LibraryIcon className="w-6 h-6" />} active={isActive("/daily")} />
            <TabItem href={profileHref} label="PROFILE" icon={<ProfileIcon className="w-6 h-6" />} active={isActive("/profile")} />
          </div>

          {/* Center floating record button */}
          <Link
            href="/record"
            className="absolute left-1/2 -top-6 -translate-x-1/2 w-14 h-14 rounded-full bg-plum text-cream flex items-center justify-center shadow-cozy-lg ring-4 ring-cream hover:bg-plum-deep transition-colors"
            aria-label="Record a story"
          >
            <span className="w-5 h-5 rounded-full bg-cream flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-plum" />
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function TabItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
        active ? "text-plum" : "text-espresso-faint hover:text-espresso"
      }`}
    >
      <span className={active ? "text-plum" : "text-espresso-soft"}>{icon}</span>
      <span
        className={`text-[9px] font-medium tracking-[0.1em] ${
          active ? "text-plum" : "text-espresso-faint"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
