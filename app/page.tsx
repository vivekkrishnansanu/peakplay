"use client";

import { useCallback, useRef, useState } from "react";
import { usePlayer } from "./hooks/usePlayer";
import BgScene from "./components/BgScene";
import LanguageStrip from "./components/LanguageStrip";
import MoodStrip from "./components/MoodStrip";
import PlayerCard from "./components/PlayerCard";
import DurationSlider from "./components/DurationSlider";
import LikedSongs from "./components/LikedSongs";
import Toast from "./components/Toast";

export default function Home() {
  const {
    song, status, progress, elapsed, clipDur, lang, mood, liked, discoverError, discoverWarning, isFullSong, fullDuration, canPrev, isPaused,
    setClipDur, loadLang, loadMood, next, prev, togglePause, toggleLike, isLiked, playFullCurrent,
  } = usePlayer("malayalam", "dance");

  const [toastMsg,  setToastMsg]  = useState("");
  const [toastVis,  setToastVis]  = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVis(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVis(false), 2200);
  }, []);

  const handleHeart = () => {
    if (!song) return;
    const wasLiked = isLiked(song);
    toggleLike(song);
    showToast(wasLiked ? "Removed from liked" : `❤️ Liked — ${song.title}`);
  };

  const handlePlayFull = () => {
    if (!song) return;
    playFullCurrent();
    showToast(`Playing full song — ${song.title}`);
  };

  const handlePrev = () => {
    if (!canPrev) return;
    prev();
  };

  const handlePauseResume = () => {
    if (!song) return;
    togglePause();
  };

  return (
    <>
      {/* Dynamic blurred background */}
      <BgScene song={song} />

      {/* Film grain */}
      <div className="grain" />

      {/* Hidden YouTube player anchor */}
      <div
        id="yt-player-anchor"
        style={{
          position: "fixed",
          left: -400,
          bottom: -400,
          width: 320,
          height: 180,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Main layout */}
      <main className="relative z-10 flex flex-col items-center min-h-screen max-w-[460px] mx-auto px-[18px] pb-14">

        {/* Header */}
        <header className="w-full flex justify-between items-end pt-11 pb-2">
          <div>
            <h1
              className="font-syne font-extrabold text-[26px] tracking-tight"
              style={{
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.65) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              PlayIt
            </h1>
            <p className="text-[11px] text-white/40 font-light tracking-[0.4px] mt-0.5">
              Auto-plays the best part of every song
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent"
              style={{ animation: "pulse-dot 1.8s ease infinite" }}
            />
            LIVE
          </div>
        </header>

        {/* Language selector */}
        <LanguageStrip active={lang} onChange={loadLang} />
        <MoodStrip active={mood} onChange={loadMood} />

        {discoverError && (
          <div className="w-full mt-3 mb-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-100">
            {discoverError}
          </div>
        )}

        {discoverWarning && (
          <div className="w-full mt-3 mb-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
            {discoverWarning}
          </div>
        )}

        {/* Player */}
        <PlayerCard
          song={song}
          status={status}
          progress={progress}
          elapsed={elapsed}
          clipDur={clipDur}
          isFullSong={isFullSong}
          fullDuration={fullDuration}
          isPaused={isPaused}
          onTogglePause={handlePauseResume}
        />

        {/* Duration slider */}
        <DurationSlider value={clipDur} onChange={setClipDur} />

        {/* Action buttons */}
        <div className="w-full flex gap-2.5 mb-3">
          {/* Heart */}
          <button
            onClick={handleHeart}
            className={`
              w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center
              rounded-full border text-[22px] backdrop-blur-xl
              transition-all duration-200 active:scale-90
              ${isLiked(song)
                ? "bg-accent/15 border-accent/50 text-accent shadow-[0_0_16px_rgba(255,51,85,0.2)]"
                : "bg-white/5 border-white/10 text-white/40"
              }
            `}
          >
            {isLiked(song) ? "♥" : "♡"}
          </button>

          {/* Full song */}
          <button
            onClick={handlePlayFull}
            className="h-[52px] px-4 rounded-full border border-white/15 bg-white/5 text-white text-[13px] font-medium tracking-[0.2px]
              transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
          >
            {isFullSong ? "Full Playing" : "Play Full"}
          </button>

          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            className={`h-[52px] px-4 rounded-full border text-[13px] font-medium tracking-[0.2px]
              transition-all duration-200 active:scale-[0.98]
              ${canPrev
                ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                : "border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
              }`}
          >
            ← Prev
          </button>

          {/* Next */}
          <button
            onClick={() => {
              void next();
            }}
            className="flex-1 h-[52px] rounded-full text-white text-[14px] font-semibold tracking-[0.3px]
              transition-all duration-200 hover:-translate-y-px active:translate-y-px
              shadow-[0_6px_20px_rgba(255,51,85,0.35)] hover:shadow-[0_10px_26px_rgba(255,51,85,0.45)]"
            style={{ background: "linear-gradient(135deg, #FF3355, #FF5570)" }}
          >
            Next Song →
          </button>
        </div>

        {/* Liked songs */}
        <LikedSongs liked={liked} />
      </main>

      {/* Toast */}
      <Toast message={toastMsg} visible={toastVis} />
    </>
  );
}
