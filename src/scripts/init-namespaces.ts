/*
 * One-time: initialize the 4 turbopuffer namespaces with locked schemas.
 * Run: `node --env-file=.env.local --experimental-strip-types src/scripts/init-namespaces.ts`
 *   or: `npm run init-namespaces`
 */
import { tpuf, STORIES_NS, THREADS_NS, REACTIONS_NS, WHISPERS_NS } from "../lib/turbopuffer";
import type { AttributeSchema, Row } from "@turbopuffer/turbopuffer/resources/namespaces";

type Schema = Record<string, AttributeSchema>;

const storiesSchema: Schema = {
  vector: { type: "[768]f32", ann: true },
  transcript: {
    type: "string",
    full_text_search: {
      language: "english",
      stemming: true,
      remove_stopwords: true,
      case_sensitive: false,
    },
    filterable: false,
  },
  emotional_essence: { type: "string", filterable: false },
  audio_raw_url: { type: "string", filterable: false },
  audio_atmosphere_url: { type: "string", filterable: false },
  duration_seconds: { type: "int", filterable: true },
  emotion_primary: { type: "string", filterable: true },
  emotion_secondary: { type: "string", filterable: true },
  emotion_intensity: { type: "int", filterable: true },
  mood_valence: { type: "float", filterable: true },
  themes: { type: "[]string", filterable: true },
  guest_id: { type: "string", filterable: true },
  username: { type: "string", filterable: false },
  country: { type: "string", filterable: true },
  language: { type: "string", filterable: true },
  react_felt_this: { type: "int", filterable: true },
  react_laughed: { type: "int", filterable: true },
  react_chills: { type: "int", filterable: true },
  react_me_too: { type: "int", filterable: true },
  react_hugged: { type: "int", filterable: true },
  total_listens: { type: "int", filterable: true },
  total_reactions: { type: "int", filterable: true },
  created_at: { type: "datetime", filterable: true },
  prompt_id: { type: "string", filterable: true },
  is_public: { type: "bool", filterable: true },
  thread_ids: { type: "[]string", filterable: true },
};

const threadsSchema: Schema = {
  vector: { type: "[768]f32", ann: true },
  title: { type: "string", filterable: false },
  shared_theme: { type: "string", filterable: false },
  story_ids: { type: "[]string", filterable: true },
  story_count: { type: "int", filterable: true },
  countries: { type: "[]string", filterable: true },
  thread_audio_url: { type: "string", filterable: false },
  thread_duration_seconds: { type: "int", filterable: true },
  total_listens: { type: "int", filterable: true },
  total_reactions: { type: "int", filterable: true },
  created_at: { type: "datetime", filterable: true },
  is_featured: { type: "bool", filterable: true },
};

const reactionsSchema: Schema = {
  vector: { type: "[768]f32", ann: true },
  story_id: { type: "string", filterable: true },
  guest_id: { type: "string", filterable: true },
  reaction_type: { type: "string", filterable: true },
  created_at: { type: "datetime", filterable: true },
};

const whispersSchema: Schema = {
  vector: { type: "[768]f32", ann: true },
  prompt_text: { type: "string", filterable: false },
  prompt_audio_url: { type: "string", filterable: false },
  target_emotion: { type: "string", filterable: true },
  target_theme: { type: "string", filterable: true },
  response_count: { type: "int", filterable: true },
  created_at: { type: "datetime", filterable: true },
  is_active: { type: "bool", filterable: true },
};

async function main() {
  const now = new Date().toISOString();
  const warmVec: number[] = Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0));

  const inits: Array<[string, Schema, Row]> = [
    [
      STORIES_NS,
      storiesSchema,
      {
        id: "__warmup_story__",
        vector: warmVec,
        transcript: "warmup story",
        emotional_essence: "warmup",
        audio_raw_url: "",
        audio_atmosphere_url: "",
        duration_seconds: 0,
        emotion_primary: "warmup",
        emotion_secondary: "warmup",
        emotion_intensity: 1,
        mood_valence: 0,
        themes: ["warmup"],
        guest_id: "__warmup__",
        username: "__warmup__",
        country: "ZZ",
        language: "en",
        react_felt_this: 0,
        react_laughed: 0,
        react_chills: 0,
        react_me_too: 0,
        react_hugged: 0,
        total_listens: 0,
        total_reactions: 0,
        created_at: now,
        prompt_id: "",
        is_public: false,
        thread_ids: [],
      } as unknown as Row,
    ],
    [
      THREADS_NS,
      threadsSchema,
      {
        id: "__warmup_thread__",
        vector: warmVec,
        title: "warmup",
        shared_theme: "warmup",
        story_ids: [],
        story_count: 0,
        countries: [],
        thread_audio_url: "",
        thread_duration_seconds: 0,
        total_listens: 0,
        total_reactions: 0,
        created_at: now,
        is_featured: false,
      } as unknown as Row,
    ],
    [
      REACTIONS_NS,
      reactionsSchema,
      {
        id: "__warmup_reaction__",
        vector: warmVec,
        story_id: "__warmup__",
        guest_id: "__warmup__",
        reaction_type: "felt_this",
        created_at: now,
      } as unknown as Row,
    ],
    [
      WHISPERS_NS,
      whispersSchema,
      {
        id: "__warmup_whisper__",
        vector: warmVec,
        prompt_text: "warmup",
        prompt_audio_url: "",
        target_emotion: "warmup",
        target_theme: "warmup",
        response_count: 0,
        created_at: now,
        is_active: false,
      } as unknown as Row,
    ],
  ];

  for (const [name, schema, warmRow] of inits) {
    console.log(`Initializing ${name}...`);
    await tpuf.namespace(name).write({
      distance_metric: "cosine_distance",
      schema,
      upsert_rows: [warmRow],
    });
    console.log(`  OK`);
  }

  console.log("All namespaces initialized.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
