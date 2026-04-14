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
    <article className="border border-ink bg-paper-deep shadow-tape-sm">
      <div className="px-4 py-2 border-b border-ink flex items-center justify-between font-mono text-[11px] uppercase tracking-caps">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-signal vu-pulse" />
          <span className="text-signal font-semibold">WHISPER PROMPT</span>
        </div>
        <span className="text-ink-faint">TARGET · {prompt.target_emotion.toUpperCase()}</span>
      </div>
      <div className="px-5 py-5 space-y-4">
        <p className="font-sans text-[19px] text-ink leading-relaxed">
          &ldquo;{prompt.prompt_text}&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="inline-flex items-center justify-center w-8 h-8 border border-ink bg-paper hover:bg-signal hover:text-paper transition-colors font-mono text-sm"
            aria-label={playing ? "Pause" : "Play prompt"}
          >
            {playing ? "◼" : "▸"}
          </button>
          <Link
            href={`/record?prompt=${prompt.id}`}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper font-mono text-[11px] uppercase tracking-caps hover:bg-signal transition-colors"
          >
            ◉ RESPOND WITH A VOICE NOTE
          </Link>
        </div>
      </div>
    </article>
  );
}
