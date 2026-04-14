"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export interface WhisperPrompt {
  id: string;
  prompt_text: string;
  prompt_audio_url: string;
  target_emotion: string;
  target_theme: string;
}

export default function WhisperPromptCard({ prompt }: { prompt: WhisperPrompt }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(prompt.prompt_audio_url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <article className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs text-fuchsia-300 uppercase tracking-widest">
        <span>◌ Whisper Prompt</span>
        <span className="text-white/40 normal-case tracking-normal">
          {prompt.target_emotion}
        </span>
      </div>
      <p className="text-white text-lg leading-relaxed text-balance">
        {prompt.prompt_text}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/80 hover:bg-white/10"
        >
          {playing ? "Pause" : "▶ Listen"}
        </button>
        <Link
          href={`/record?prompt=${prompt.id}`}
          className="text-xs px-4 py-1.5 rounded-full bg-white text-black font-medium hover:bg-white/90"
        >
          Respond with a voice note
        </Link>
      </div>
    </article>
  );
}
