import { embed } from "./gemini";

export const MOOD_SEEDS: Record<string, string> = {
  heartbreak:
    "the ache of loss, someone leaving, a love that ended, the quiet grief of an empty side of the bed",
  joy:
    "moments of pure delight, uncontrollable laughter, the feeling of weightless happiness and gratitude",
  nostalgia:
    "memories of childhood, old summers, a grandmother's kitchen, songs from another life",
  funny:
    "absurd workplace stories, embarrassing moments, the joke that only makes sense to you, dry humor",
  brave:
    "starting over in a new city, quitting the safe job, walking away from something that hurt",
  tender:
    "quiet intimacy, holding someone's hand in silence, a parent's last words, the warmth of care",
};

export const MOOD_KEYS = Object.keys(MOOD_SEEDS);

const cache = new Map<string, number[]>();

export async function embedMood(mood: string): Promise<number[] | null> {
  const seed = MOOD_SEEDS[mood];
  if (!seed) return null;
  const cached = cache.get(mood);
  if (cached) return cached;
  const vec = await embed(seed);
  cache.set(mood, vec);
  return vec;
}
