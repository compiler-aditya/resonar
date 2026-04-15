import { Turbopuffer } from "@turbopuffer/turbopuffer";
import type { Row } from "@turbopuffer/turbopuffer/resources/namespaces";
import type { Filter } from "@turbopuffer/turbopuffer/resources/custom";
import { rrf } from "./rrf";

const apiKey = process.env.TURBOPUFFER_API_KEY;
const region = process.env.TURBOPUFFER_REGION || "aws-ap-south-1";

if (!apiKey) {
  console.warn("[turbopuffer] TURBOPUFFER_API_KEY not set");
}

export const tpuf = new Turbopuffer({
  apiKey: apiKey || "",
  region,
});

export const STORIES_NS = "resonar-stories";
export const THREADS_NS = "resonar-threads";
export const REACTIONS_NS = "resonar-reactions";
export const WHISPERS_NS = "resonar-whisper-prompts";

export const storiesNs = () => tpuf.namespace(STORIES_NS);
export const threadsNs = () => tpuf.namespace(THREADS_NS);
export const reactionsNs = () => tpuf.namespace(REACTIONS_NS);
export const whispersNs = () => tpuf.namespace(WHISPERS_NS);

export type ReactionType = "felt_this" | "laughed" | "chills" | "me_too" | "hugged";

export interface StoryRow {
  id: string;
  vector: number[];
  transcript: string;
  emotional_essence: string;
  audio_raw_url: string;
  audio_atmosphere_url?: string | null;
  duration_seconds: number;
  emotion_primary: string;
  emotion_secondary: string;
  emotion_intensity: number;
  mood_valence: number;
  themes: string[];
  guest_id: string;
  username: string;
  country: string;
  language: string;
  react_felt_this: number;
  react_laughed: number;
  react_chills: number;
  react_me_too: number;
  react_hugged: number;
  total_listens: number;
  total_reactions: number;
  created_at: string;
  prompt_id: string;
  is_public: boolean;
  thread_ids: string[];
}

export interface ThreadRow {
  id: string;
  vector: number[];
  title: string;
  shared_theme: string;
  story_ids: string[];
  story_count: number;
  countries: string[];
  thread_audio_url: string;
  thread_duration_seconds: number;
  total_listens: number;
  total_reactions: number;
  created_at: string;
  is_featured: boolean;
}

export interface ReactionRow {
  id: string;
  vector: number[];
  story_id: string;
  guest_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface WhisperPromptRow {
  id: string;
  vector: number[];
  prompt_text: string;
  prompt_audio_url: string;
  target_emotion: string;
  target_theme: string;
  response_count: number;
  created_at: string;
  is_active: boolean;
}

const STORY_LIST_ATTRS = [
  "transcript",
  "emotional_essence",
  "audio_raw_url",
  "audio_atmosphere_url",
  "duration_seconds",
  "emotion_primary",
  "emotion_secondary",
  "emotion_intensity",
  "mood_valence",
  "themes",
  "guest_id",
  "username",
  "country",
  "language",
  "react_felt_this",
  "react_laughed",
  "react_chills",
  "react_me_too",
  "react_hugged",
  "total_listens",
  "total_reactions",
  "created_at",
  "prompt_id",
  "is_public",
  "thread_ids",
];

export async function insertStory(row: StoryRow) {
  return storiesNs().write({
    distance_metric: "cosine_distance",
    upsert_rows: [row as unknown as Row],
  });
}

export async function patchStory(id: string, patch: Partial<StoryRow>) {
  return storiesNs().write({
    patch_rows: [{ id, ...patch } as unknown as Row],
  });
}

export async function getStory(id: string): Promise<StoryRow | null> {
  const res = await storiesNs().query({
    filters: ["id", "Eq", id] as Filter,
    top_k: 1,
    include_attributes: true,
  });
  const rows = res.rows ?? [];
  if (rows.length === 0) return null;
  return rowToStory(rows[0]);
}

export async function queryStoriesByVector(
  vector: number[],
  opts: { limit?: number; excludeGuestId?: string; minIntensity?: number; publicOnly?: boolean } = {},
): Promise<StoryRow[]> {
  const filters: Filter[] = [];
  if (opts.publicOnly !== false) filters.push(["is_public", "Eq", true]);
  if (opts.excludeGuestId) filters.push(["guest_id", "NotEq", opts.excludeGuestId]);
  if (opts.minIntensity) filters.push(["emotion_intensity", "Gte", opts.minIntensity]);
  const res = await storiesNs().query({
    rank_by: ["vector", "ANN", vector],
    filters: combineFilters(filters),
    top_k: opts.limit ?? 20,
    include_attributes: STORY_LIST_ATTRS,
  });
  return (res.rows ?? []).map(rowToStory);
}

export async function hybridSearchStories(
  query: string,
  queryVector: number[],
  limit = 20,
): Promise<StoryRow[]> {
  const filters: Filter = ["is_public", "Eq", true];
  const res = await storiesNs().multiQuery({
    queries: [
      {
        rank_by: ["vector", "ANN", queryVector],
        filters,
        top_k: limit,
        include_attributes: STORY_LIST_ATTRS,
      },
      {
        rank_by: ["transcript", "BM25", query],
        filters,
        top_k: limit,
        include_attributes: STORY_LIST_ATTRS,
      },
    ],
  });
  const results = (res as unknown as { results: Array<{ rows?: Row[] }> }).results ?? [];
  const lists = results.map((r) =>
    (r.rows ?? []).map((row) => ({ ...(row as Record<string, unknown>), id: String(row.id) })),
  );
  const fused = rrf(lists).slice(0, limit);
  return fused.map((r) => rowToStory(r as unknown as Row));
}

export async function topStoryByEmotion(
  emotion: string,
  sinceIso: string,
): Promise<StoryRow | null> {
  const res = await storiesNs().query({
    rank_by: ["total_reactions", "desc"],
    filters: [
      "And",
      [
        ["is_public", "Eq", true],
        ["emotion_primary", "Eq", emotion],
        ["created_at", "Gte", sinceIso],
      ],
    ] as Filter,
    top_k: 5,
    include_attributes: STORY_LIST_ATTRS,
  });
  const rows = (res.rows ?? [])
    .map(rowToStory)
    .filter((s) => !s.id.startsWith("__warmup"));
  if (rows.length === 0) return null;
  // prefer rows with an atmosphere track
  return rows.find((s) => s.audio_atmosphere_url) ?? rows[0];
}

export async function trendingStories(hoursBack = 24, limit = 50): Promise<StoryRow[]> {
  const since = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();
  const res = await storiesNs().query({
    rank_by: ["total_reactions", "desc"],
    filters: combineFilters([
      ["is_public", "Eq", true],
      ["created_at", "Gte", since],
    ]),
    top_k: limit,
    include_attributes: STORY_LIST_ATTRS,
  });
  return (res.rows ?? []).map(rowToStory);
}

export async function newStories(limit = 50): Promise<StoryRow[]> {
  const res = await storiesNs().query({
    rank_by: ["created_at", "desc"],
    filters: ["is_public", "Eq", true] as Filter,
    top_k: limit,
    include_attributes: STORY_LIST_ATTRS,
  });
  return (res.rows ?? []).map(rowToStory);
}

export async function aggregateEmotions(opts: {
  sinceIso?: string;
  guestId?: string;
}): Promise<Array<{ emotion_primary: string; count: number }>> {
  const filters: Filter[] = [["is_public", "Eq", true]];
  if (opts.sinceIso) filters.push(["created_at", "Gte", opts.sinceIso]);
  if (opts.guestId) filters.push(["guest_id", "Eq", opts.guestId]);
  const res = await storiesNs().query({
    aggregate_by: { count: ["Count"] },
    group_by: ["emotion_primary"],
    filters: combineFilters(filters),
  });
  const groups = (res as unknown as { aggregations?: Array<Record<string, unknown>> }).aggregations
    ?? (res as unknown as { aggregation_groups?: Array<Record<string, unknown>> }).aggregation_groups
    ?? [];
  return groups.map((g) => ({
    emotion_primary: String(g.emotion_primary ?? ""),
    count: Number(g.count ?? 0),
  }));
}

export async function incrementReactionCounter(storyId: string, reactionType: ReactionType) {
  const story = await getStory(storyId);
  if (!story) return;
  const field = `react_${reactionType}` as keyof StoryRow;
  const current = Number(story[field] ?? 0);
  const totalCurrent = Number(story.total_reactions ?? 0);
  await patchStory(storyId, {
    [field]: current + 1,
    total_reactions: totalCurrent + 1,
  } as Partial<StoryRow>);
}

export async function findSimilarStoriesForThread(
  vector: number[],
  excludeStoryId: string,
  excludeGuestId: string,
  limit = 8,
): Promise<StoryRow[]> {
  const res = await storiesNs().query({
    rank_by: ["vector", "ANN", vector],
    filters: [
      "And",
      [
        ["is_public", "Eq", true],
        ["id", "NotEq", excludeStoryId],
        ["guest_id", "NotEq", excludeGuestId],
        ["emotion_intensity", "Gte", 4],
      ],
    ] as Filter,
    top_k: limit,
    include_attributes: STORY_LIST_ATTRS,
  });
  return (res.rows ?? []).map(rowToStory);
}

export async function attachStoryToThread(storyId: string, threadId: string) {
  const story = await getStory(storyId);
  if (!story) return;
  const next = Array.from(new Set([...(story.thread_ids || []), threadId]));
  await patchStory(storyId, { thread_ids: next });
}

export async function listUserStories(guestId: string, limit = 100): Promise<StoryRow[]> {
  const res = await storiesNs().query({
    rank_by: ["created_at", "desc"],
    filters: ["guest_id", "Eq", guestId] as Filter,
    top_k: limit,
    include_attributes: STORY_LIST_ATTRS,
  });
  return (res.rows ?? []).map(rowToStory);
}

export async function upsertThread(row: ThreadRow) {
  return threadsNs().write({
    distance_metric: "cosine_distance",
    upsert_rows: [row as unknown as Row],
  });
}

export async function getThread(id: string): Promise<ThreadRow | null> {
  const res = await threadsNs().query({
    filters: ["id", "Eq", id] as Filter,
    top_k: 1,
    include_attributes: true,
  });
  const rows = res.rows ?? [];
  if (rows.length === 0) return null;
  return rows[0] as unknown as ThreadRow;
}

export async function listThreads(limit = 50): Promise<ThreadRow[]> {
  const res = await threadsNs().query({
    rank_by: ["created_at", "desc"],
    top_k: limit,
    include_attributes: true,
  });
  return (res.rows ?? []).map((r) => r as unknown as ThreadRow);
}

export async function insertReaction(row: ReactionRow) {
  return reactionsNs().write({
    distance_metric: "cosine_distance",
    upsert_rows: [row as unknown as Row],
  });
}

export async function listReactionsByGuest(guestId: string, limit = 500): Promise<ReactionRow[]> {
  const res = await reactionsNs().query({
    rank_by: ["created_at", "desc"],
    filters: ["guest_id", "Eq", guestId] as Filter,
    top_k: limit,
    include_attributes: true,
  });
  return (res.rows ?? []).map((r) => r as unknown as ReactionRow);
}

export async function upsertWhisperPrompt(row: WhisperPromptRow) {
  return whispersNs().write({
    distance_metric: "cosine_distance",
    upsert_rows: [row as unknown as Row],
  });
}

export async function listActiveWhisperPrompts(limit = 5): Promise<WhisperPromptRow[]> {
  const res = await whispersNs().query({
    rank_by: ["created_at", "desc"],
    filters: ["is_active", "Eq", true] as Filter,
    top_k: limit,
    include_attributes: true,
  });
  return (res.rows ?? []).map((r) => r as unknown as WhisperPromptRow);
}

let warmPromise: Promise<void> | null = null;

export function warmAllCaches(): Promise<void> {
  if (warmPromise) return warmPromise;
  warmPromise = (async () => {
    const namespaces = [STORIES_NS, THREADS_NS, REACTIONS_NS, WHISPERS_NS];
    await Promise.allSettled(
      namespaces.map((name) =>
        tpuf.namespace(name).hintCacheWarm().catch((err: unknown) => {
          console.warn(`[turbopuffer] warm ${name} failed`, err);
        }),
      ),
    );
    console.log("[turbopuffer] caches warmed");
  })();
  return warmPromise;
}

export async function warmStoriesCache() {
  try {
    await storiesNs().hintCacheWarm();
  } catch (err) {
    console.warn("[turbopuffer] warm cache failed", err);
  }
}

function combineFilters(filters: Filter[]): Filter | undefined {
  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return ["And", filters];
}

function rowToStory(row: Row): StoryRow {
  const r = row as unknown as Record<string, unknown>;
  return {
    id: String(r.id),
    vector: (r.vector as number[]) ?? [],
    transcript: String(r.transcript ?? ""),
    emotional_essence: String(r.emotional_essence ?? ""),
    audio_raw_url: String(r.audio_raw_url ?? ""),
    audio_atmosphere_url: r.audio_atmosphere_url ? String(r.audio_atmosphere_url) : null,
    duration_seconds: Number(r.duration_seconds ?? 0),
    emotion_primary: String(r.emotion_primary ?? ""),
    emotion_secondary: String(r.emotion_secondary ?? ""),
    emotion_intensity: Number(r.emotion_intensity ?? 0),
    mood_valence: Number(r.mood_valence ?? 0),
    themes: (r.themes as string[]) ?? [],
    guest_id: String(r.guest_id ?? ""),
    username: String(r.username ?? ""),
    country: String(r.country ?? ""),
    language: String(r.language ?? "en"),
    react_felt_this: Number(r.react_felt_this ?? 0),
    react_laughed: Number(r.react_laughed ?? 0),
    react_chills: Number(r.react_chills ?? 0),
    react_me_too: Number(r.react_me_too ?? 0),
    react_hugged: Number(r.react_hugged ?? 0),
    total_listens: Number(r.total_listens ?? 0),
    total_reactions: Number(r.total_reactions ?? 0),
    created_at: String(r.created_at ?? ""),
    prompt_id: String(r.prompt_id ?? ""),
    is_public: Boolean(r.is_public ?? true),
    thread_ids: (r.thread_ids as string[]) ?? [],
  };
}
