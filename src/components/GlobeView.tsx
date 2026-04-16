"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { StoryCardData } from "./StoryCard";
import { codeToLatLng } from "@/lib/countryCoords";

// react-globe.gl uses WebGL — must be dynamic + ssr:false
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface ThreadRowLite {
  id: string;
  title: string;
  shared_theme: string;
  story_ids: string[];
  countries: string[];
  story_count: number;
}

interface PointDatum {
  lat: number;
  lng: number;
  story: StoryCardData;
  size: number;
  color: string;
}

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  threadId: string;
  title: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function GlobeView() {
  const { data: feedData } = useSWR<{ stories: StoryCardData[] }>(
    "/api/feed/new?limit=200",
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: threadsData } = useSWR<{ threads: ThreadRowLite[] }>(
    "/api/threads",
    fetcher,
    { revalidateOnFocus: false },
  );

  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(560);
  const [hoveredArc, setHoveredArc] = useState<ArcDatum | null>(null);

  useEffect(() => {
    const sync = () => {
      const w = Math.min(window.innerWidth - 40, 720);
      setWidth(w);
      setHeight(Math.min(window.innerHeight - 260, w * 0.95));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const points: PointDatum[] = useMemo(() => {
    const stories = feedData?.stories ?? [];
    const out: PointDatum[] = [];
    for (const s of stories) {
      const coords = codeToLatLng(s.country);
      if (!coords) continue;
      out.push({
        lat: coords[0],
        lng: coords[1],
        story: s,
        size: 0.35 + Math.min(0.9, (s.emotion_intensity || 5) / 12),
        color: moodColor(s.emotion_primary),
      });
    }
    return out;
  }, [feedData]);

  const arcs: ArcDatum[] = useMemo(() => {
    const threads = threadsData?.threads ?? [];
    const byId = new Map<string, StoryCardData>();
    for (const s of feedData?.stories ?? []) byId.set(s.id, s);
    const out: ArcDatum[] = [];
    for (const t of threads) {
      const ids = t.story_ids ?? [];
      for (let i = 0; i < ids.length - 1; i++) {
        const a = byId.get(ids[i]);
        const b = byId.get(ids[i + 1]);
        if (!a || !b) continue;
        const ac = codeToLatLng(a.country);
        const bc = codeToLatLng(b.country);
        if (!ac || !bc) continue;
        out.push({
          startLat: ac[0],
          startLng: ac[1],
          endLat: bc[0],
          endLng: bc[1],
          color: ["#c4704a", "#6b4a5c"],
          threadId: t.id,
          title: t.title,
        });
      }
    }
    return out;
  }, [threadsData, feedData]);

  return (
    <div className="py-3 space-y-5">
      <header className="space-y-2">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-sienna">
          Resonance Globe
        </div>
        <h1 className="font-sans text-3xl font-semibold text-espresso">
          The world, listening.
        </h1>
        <p className="font-sans text-sm text-espresso-soft max-w-md">
          Every dot is a voice. Every arc is a{" "}
          <span className="text-plum font-semibold">Resonance Thread</span> —
          strangers in different countries feeling the same thing.
        </p>
      </header>

      <div
        className="cozy-card p-3 relative overflow-hidden"
        style={{ height: height + 24 }}
      >
        <div className="flex justify-center">
          <Globe
            width={width}
            height={height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#c4704a"
            atmosphereAltitude={0.22}
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={0.01}
            pointRadius={(d: object) => (d as PointDatum).size}
            pointColor={(d: object) => (d as PointDatum).color}
            pointLabel={(d: object) => {
              const p = d as PointDatum;
              return `<div style="font-family:system-ui;padding:8px 10px;background:#faf5ea;border-radius:12px;max-width:280px;color:#3d2f28"><div style="font-size:11px;font-weight:600">${escapeHtml(p.story.username)}</div><div style="font-size:10px;color:#8a7a6e;text-transform:uppercase;letter-spacing:0.08em">${escapeHtml(p.story.country)} · ${escapeHtml(p.story.emotion_primary)}</div><div style="font-style:italic;font-size:12px;margin-top:4px">"${escapeHtml(p.story.emotional_essence.slice(0, 120))}"</div></div>`;
            }}
            arcsData={arcs}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor={(d: object) => (d as ArcDatum).color}
            arcStroke={0.45}
            arcAltitudeAutoScale={0.45}
            arcDashLength={0.4}
            arcDashGap={0.15}
            arcDashAnimateTime={3500}
            arcLabel={(d: object) => {
              const a = d as ArcDatum;
              return `<div style="font-family:system-ui;padding:6px 10px;background:#6b4a5c;color:#faf5ea;border-radius:10px;font-size:11px;font-weight:600">${escapeHtml(a.title)}</div>`;
            }}
            onArcClick={(d: object) => setHoveredArc(d as ArcDatum)}
            enablePointerInteraction={true}
          />
        </div>
      </div>

      {hoveredArc && (
        <div className="cozy-card p-4 space-y-2">
          <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-sienna font-bold">
            Resonance Thread
          </div>
          <div className="font-sans text-lg font-semibold text-espresso">
            {hoveredArc.title}
          </div>
          <Link
            href={`/thread/${hoveredArc.threadId}`}
            className="inline-block font-sans text-sm font-semibold text-plum hover:text-plum-deep"
          >
            Listen to the thread →
          </Link>
        </div>
      )}

      <div className="font-sans text-xs text-espresso-faint text-center">
        {points.length} voice{points.length === 1 ? "" : "s"} · {arcs.length} resonance link{arcs.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function moodColor(emotion: string): string {
  const e = (emotion || "").toLowerCase();
  const map: Record<string, string> = {
    joy: "#c4803a",
    excitement: "#d9571e",
    nostalgia: "#b04b5e",
    tenderness: "#d28aa0",
    longing: "#8a6478",
    loneliness: "#4f5b70",
    grief: "#8b3a2c",
    anger: "#a03828",
    gratitude: "#6a7548",
    hope: "#7fa07a",
    defiance: "#b65a2e",
    anxiety: "#c48a4a",
    love: "#c15670",
  };
  return map[e] || "#c4704a";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
