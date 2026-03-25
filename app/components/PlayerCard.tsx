"use client";
import { useEffect, useState } from "react";
import { Song, thumbUrl } from "../data/songs";
import { PlayerStatus } from "../hooks/usePlayer";

interface Props {
  song: Song | null;
  status: PlayerStatus;
  progress: number;
  elapsed: number;
  clipDur: number;
  isFullSong: boolean;
  fullDuration: number;
}

export default function PlayerCard({ song, status, progress, elapsed, clipDur, isFullSong, fullDuration }: Props) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Trigger song-in animation on song change
  useEffect(() => {
    setThumbLoaded(false);
    setAnimKey(k => k + 1);
  }, [song?.id]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading" || status === "seeking" || status === "idle";

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-[18px] backdrop-blur-2xl overflow-hidden mt-5 mb-3">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[#0a0a16] overflow-hidden">
        {song && (
          <img
            key={song.id}
            src={thumbUrl(song.id, "max")}
            alt={song.title}
            onLoad={() => setThumbLoaded(true)}
            onError={e => {
              (e.target as HTMLImageElement).src = thumbUrl(song.id, "hq");
              setThumbLoaded(true);
            }}
            className={`w-full h-full object-cover transition-opacity duration-700 ${thumbLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {/* Peak badge */}
        <div className={`
          absolute top-3 right-3 
          border rounded-full px-2.5 py-1
          font-syne text-[9px] font-bold tracking-[1.2px] uppercase
          backdrop-blur-md transition-all
          ${isPlaying
            ? "bg-accent/15 border-accent/70 text-accent animate-[badge-pulse_2s_ease_infinite]"
            : "bg-black/55 border-accent/40 text-accent"
          }
        `}>
          {isFullSong ? "🎵 Full Song" : "⚡ Peak Moment"}
        </div>

        {/* Equalizer */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 flex gap-[3px] items-end h-[18px]">
            {[
              { h: 10, delay: "0ms" },
              { h: 18, delay: "120ms" },
              { h: 8,  delay: "250ms" },
              { h: 14, delay: "70ms" },
              { h: 18, delay: "200ms" },
            ].map((bar, i) => (
              <div
                key={i}
                style={{
                  height: bar.h,
                  width: 3,
                  animationDelay: bar.delay,
                  background: "linear-gradient(180deg, #FF3355, #FFB830)",
                  borderRadius: 2,
                  animation: `eq 0.9s ease ${bar.delay} infinite`,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#06060e]/72 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
            <p className="text-[11px] text-white/40 tracking-wide">
              {status === "seeking" ? "Seeking peak moment…" : "Finding peak moment…"}
            </p>
          </div>
        )}
      </div>

      {/* Song info */}
      <div key={animKey} className="px-[18px] pt-4 pb-2.5 animate-[song-in_0.38s_ease]">
        <p className="font-syne font-bold text-[19px] leading-tight truncate mb-1">
          {song?.title ?? "Loading…"}
        </p>
        <p className="text-[13px] text-white/42 font-light">
          {song?.artist ?? "Please wait"}
        </p>
      </div>

      {/* Progress */}
      <div className="px-[18px] pb-4">
        <div className="relative h-[2px] bg-white/8 rounded-full overflow-hidden mb-2">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-[250ms] linear"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF3355, #FFB830)",
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-white/40">
          <span>{elapsed}s</span>
          <span>{isFullSong && fullDuration > 0 ? `${fullDuration}s` : `${clipDur}s`}</span>
        </div>
      </div>
    </div>
  );
}
