"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MicIcon, PlayIcon, PauseIcon } from "./Icons";

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
    <article className="cozy-card-tint p-5 space-y-3 relative overflow-hidden">
      {/* Soft decorative corner accent */}
      <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-plum-mist opacity-60 -translate-y-8 translate-x-8" />

      <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna relative">
        A Whisper Prompt
      </div>

      <p
        dir="auto"
        className="serif-italic text-espresso text-[20px] leading-[1.4] relative"
      >
        &ldquo;{prompt.prompt_text}&rdquo;
      </p>

      <div className="flex items-center gap-2 pt-1 relative">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-cream text-plum flex items-center justify-center shadow-cozy-sm hover:bg-plum-mist transition-colors"
          aria-label={playing ? "Pause" : "Listen"}
        >
          {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
        </button>
        <Link
          href={`/record?prompt=${prompt.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-olive text-cream font-sans text-[12px] font-semibold hover:bg-olive-soft transition-colors shadow-cozy-sm"
        >
          <MicIcon className="w-4 h-4" />
          Respond
        </Link>
      </div>
    </article>
  );
}
