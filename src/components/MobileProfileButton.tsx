"use client";

import Link from "next/link";
import { useGuest, initialFor } from "./UseGuest";

export default function MobileProfileButton() {
  const guest = useGuest();
  const guestId = guest?.guestId;
  const initial = guest ? initialFor(guest.username) : "";

  if (!guestId) {
    return (
      <span
        className="w-10 h-10 rounded-full bg-cream-soft animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <Link
      href={`/profile/${guestId}`}
      aria-label="Your profile"
      title={guest?.username}
      className="w-10 h-10 rounded-full bg-plum text-cream flex items-center justify-center font-semibold text-sm hover:bg-plum-deep transition-colors shadow-cozy-sm"
    >
      {initial}
    </Link>
  );
}
