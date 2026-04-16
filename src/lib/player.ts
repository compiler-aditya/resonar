"use client";

import { create } from "zustand";

export interface NowPlaying {
  key: string; // stable id: story:<uuid> | thread:<uuid> | daily:<yyyy-mm-dd>
  kind: "story" | "thread" | "daily";
  src: string;
  title: string;
  subtitle?: string;
  tint?: string;
  targetUrl?: string; // deep link for the bar title
}

interface PlayerState {
  current: NowPlaying | null;
  playing: boolean;
  progress: number;
  duration: number;
  play: (payload: NowPlaying) => void;
  toggle: () => void;
  stop: () => void;
  setPlaying: (v: boolean) => void;
  setProgress: (p: number, d: number) => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  playing: false,
  progress: 0,
  duration: 0,
  play: (payload) => {
    const prev = get().current;
    if (prev?.key === payload.key) {
      // already selected — just resume
      set({ playing: true });
      return;
    }
    set({ current: payload, playing: true, progress: 0, duration: 0 });
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  stop: () => set({ current: null, playing: false, progress: 0, duration: 0 }),
  setPlaying: (v) => set({ playing: v }),
  setProgress: (progress, duration) => set({ progress, duration }),
}));
