import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn("[db] DATABASE_URL not set");
}

export const sql = databaseUrl
  ? postgres(databaseUrl, { max: 5, prepare: false })
  : (null as unknown as ReturnType<typeof postgres>);

export const db = sql ? drizzle(sql) : (null as unknown as ReturnType<typeof drizzle>);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestId: text("guest_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  storyId: text("story_id"),
  threadId: text("thread_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const storyJobs = pgTable("story_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestId: text("guest_id").notNull(),
  username: text("username").notNull(),
  status: text("status").default("pending"),
  rawAudioKey: text("raw_audio_key").notNull(),
  durationSeconds: integer("duration_seconds"),
  promptId: text("prompt_id"),
  storyId: text("story_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
