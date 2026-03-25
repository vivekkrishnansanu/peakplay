"use client";
import { KeyboardEvent, useEffect, useState } from "react";
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
  isPaused: boolean;
  onTogglePause: () => void;
}

export default function PlayerCard({
  song,
  status,
  progress,
  elapsed,
  clipDur,
  isFullSong,
  fullDuration,
  isPaused,
  onTogglePause,
}: Props) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Trigger song-in animation on song change
  useEffect(() => {
    setThumbLoaded(false);
    setAnimKey(k => k + 1);
  }, [song?.id]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading" || status === "seeking" || status === "idle";
  const canTogglePlayback = Boolean(song);

  const handleThumbToggle = () => {
    if (!canTogglePlayback) return;
    onTogglePause();
  };

  const handleThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canTogglePlayback) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTogglePause();
    }
  };

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-[18px] backdrop-blur-2xl overflow-hidden mt-5 mb-3">
      {/* Thumbnail */}
      <div
        role="button"
        tabIndex={canTogglePlayback ? 0 : -1}
        aria-label={isPaused ? "Resume playback" : "Pause playback"}
        onClick={handleThumbToggle}
        onKeyDown={handleThumbKeyDown}
        className={`relative w-full aspect-video bg-[#0a0a16] overflow-hidden ${canTogglePlayback ? "cursor-pointer" : ""}`}
      >
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

        {/* Paused overlay */}
        {isPaused && song && (
          <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full border border-white/30 bg-black/45 backdrop-blur-md flex items-center justify-center text-white text-[18px]">
              ▶
            </div>
            <p className="text-[11px] tracking-[0.4px] text-white/80 uppercase">
              Paused - Tap to Resume
            </p>
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
