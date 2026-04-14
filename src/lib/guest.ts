const COOKIE_NAME = process.env.GUEST_COOKIE_NAME || "resonar_guest";

const ADJECTIVES = [
  "Anonymous", "Wandering", "Silent", "Echoing", "Distant", "Gentle", "Hopeful",
  "Restless", "Curious", "Tender", "Brave", "Dreaming", "Velvet", "Quiet",
  "Amber", "Moonlit", "Midnight", "Saffron", "Rain-washed", "Honeyed",
];
const ANIMALS = [
  "Sparrow", "Wolf", "Otter", "Heron", "Hummingbird", "Fox", "Koi",
  "Owl", "Deer", "Raven", "Dolphin", "Crane", "Lynx", "Moth",
  "Starling", "Fawn", "Swift", "Kestrel", "Thrush", "Kingfisher",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const hex = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function generateRandomName(): string {
  const adj = pick(ADJECTIVES);
  const animal = pick(ANIMALS);
  const num = 100 + Math.floor(Math.random() * 9900);
  return `${adj}-${animal}-${num}`;
}

export interface GuestSession {
  guestId: string;
  username: string;
}

function encode(session: GuestSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeGuest(value: string): GuestSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed?.guestId === "string" && typeof parsed?.username === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeGuest(session: GuestSession): string {
  return encode(session);
}

export function newGuestSession(): GuestSession {
  return { guestId: randomUuid(), username: generateRandomName() };
}

export const GUEST_COOKIE_NAME = COOKIE_NAME;
