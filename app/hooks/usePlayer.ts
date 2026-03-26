"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Language, Mood, Song } from "../data/songs";

interface YTPlayerLike {
  setVolume: (value: number) => void;
  loadVideoById: (opts: { videoId: string; startSeconds: number; endSeconds?: number }) => void;
  stopVideo: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  getPlayerState?: () => number;
  getCurrentTime?: () => number;
  getDuration?: () => number;
}

interface YTStateChangeEventLike {
  data: number;
}

interface YTNamespaceLike {
  PlayerState: {
    ENDED: number;
    BUFFERING: number;
    PLAYING: number;
    PAUSED: number;
  };
  Player: new (
    elementId: string,
    options: {
      height: string;
      width: string;
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady: () => void;
        onStateChange: (event: YTStateChangeEventLike) => void;
        onError: () => void;
      };
    },
  ) => YTPlayerLike;
}

declare global {
  interface Window {
    YT: YTNamespaceLike;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type PlayerStatus = "idle" | "loading" | "seeking" | "playing" | "paused" | "fading";

export interface QuotaInfo {
  source: "estimated";
  day: string;
  used: number;
  limit: number;
  remaining: number;
  usagePct: number;
}

export function usePlayer(initialLang: Language = "malayalam", initialMood: Mood = "dance") {
  const playerRef       = useRef<YTPlayerLike | null>(null);
  const ytReadyRef      = useRef(false);
  const playingRef      = useRef(false);
  const clipStartRef    = useRef(0);
  const fadeIntRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progIntRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const durApplyRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef        = useRef<Song[]>([]);
  const historyRef      = useRef<Song[]>([]);
  const clipDurRef      = useRef(30);
  const langRef         = useRef<Language>(initialLang);
  const moodRef         = useRef<Mood>(initialMood);
  const songRef         = useRef<Song | null>(null);
  const seenByContextRef = useRef<Record<string, Set<string>>>({});
  const loadingNextRef  = useRef(false);
  const fullModeRef     = useRef(false);
  const discoverErrorRef = useRef<string | null>(null);

  const [lang,      setLangState]   = useState<Language>(initialLang);
  const [mood,      setMoodState]   = useState<Mood>(initialMood);
  const [song,      setSong]        = useState<Song | null>(null);
  const [status,    setStatus]      = useState<PlayerStatus>("idle");
  const [progress,  setProgress]    = useState(0);   // 0-100
  const [elapsed,   setElapsed]     = useState(0);   // seconds
  const [clipDur,   setClipDurState] = useState(30);
  const [liked,     setLiked]       = useState<Song[]>([]);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverWarning, setDiscoverWarning] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [isFullSong, setIsFullSong] = useState(false);
  const [fullDuration, setFullDuration] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    songRef.current = song;
  }, [song]);

  useEffect(() => {
    discoverErrorRef.current = discoverError;
  }, [discoverError]);

  const getSeenSet = useCallback((language: Language, selectedMood: Mood) => {
    const key = `${language}:${selectedMood}`;
    if (!seenByContextRef.current[key]) {
      seenByContextRef.current[key] = new Set<string>();
    }
    return seenByContextRef.current[key];
  }, []);

  // ── helpers ────────────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (fadeIntRef.current)  clearInterval(fadeIntRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (progIntRef.current)  clearInterval(progIntRef.current);
    if (durApplyRef.current) clearTimeout(durApplyRef.current);
    playingRef.current = false;
  }, []);

  const fadeIn = useCallback(() => {
    let v = 0;
    if (fadeIntRef.current) clearInterval(fadeIntRef.current);
    fadeIntRef.current = setInterval(() => {
      v = Math.min(100, v + 5);
      playerRef.current?.setVolume(v);
      if (v >= 100 && fadeIntRef.current) clearInterval(fadeIntRef.current);
    }, 100);
  }, []);

  const fadeOut = useCallback((cb?: () => void, options?: { stopAfterFade?: boolean }) => {
    const stopAfterFade = options?.stopAfterFade ?? true;
    setStatus("fading");
    let v = 100;
    if (fadeIntRef.current) clearInterval(fadeIntRef.current);
    fadeIntRef.current = setInterval(() => {
      v = Math.max(0, v - 5);
      playerRef.current?.setVolume(v);
      if (v <= 0) {
        if (fadeIntRef.current) clearInterval(fadeIntRef.current);
        if (stopAfterFade) {
          playerRef.current?.stopVideo();
        }
        cb?.();
      }
    }, 100);
  }, []);

  const startProgress = useCallback(() => {
    if (progIntRef.current) clearInterval(progIntRef.current);
    progIntRef.current = setInterval(() => {
      const playerTime = playerRef.current?.getCurrentTime?.();
      const el = Number.isFinite(playerTime) ? (playerTime as number) : (Date.now() - clipStartRef.current) / 1000;

      if (fullModeRef.current) {
        const fullDur = playerRef.current?.getDuration?.() ?? 0;
        if (fullDur > 0) setFullDuration(Math.floor(fullDur));
        setElapsed(Math.max(0, Math.floor(el)));
        if (fullDur > 0) {
          setProgress(Math.min((el / fullDur) * 100, 100));
        }
      } else {
        const clipBase = songRef.current?.peak ?? 0;
        const clipElapsed = Math.max(0, el - clipBase);
        setElapsed(Math.floor(clipElapsed));
        setProgress(Math.min((clipElapsed / clipDurRef.current) * 100, 100));
      }
    }, 200);
  }, []);

  // ── play a specific song ───────────────────────────────────────────────────
  const playSong = useCallback((s: Song, mode: "clip" | "full" = "clip") => {
    if (!playerRef.current || !ytReadyRef.current) return;
    clearAll();
    const full = mode === "full";
    fullModeRef.current = full;
    setIsFullSong(full);
    setSong(s);
    setProgress(0);
    setElapsed(0);
    setFullDuration(0);
    setIsPaused(false);
    setStatus("loading");
    playerRef.current.setVolume(0);
    if (full) {
      playerRef.current.loadVideoById({
        videoId: s.id,
        startSeconds: 0,
      });
    } else {
      // Let YouTube enforce clip boundaries internally so autoplay can continue
      // even when browser timers are throttled in background tabs.
      playerRef.current.loadVideoById({
        videoId: s.id,
        startSeconds: s.peak,
        endSeconds: s.peak + clipDurRef.current,
      });
    }
  }, [clearAll]);

  const discoverSongs = useCallback(async (language: Language, selectedMood: Mood, excludeIds: string[], limit = 12) => {
    const params = new URLSearchParams({
      lang: language,
      mood: selectedMood,
      limit: String(limit),
      exclude: excludeIds.slice(-150).join(","),
    });

    const response = await fetch(`/api/youtube/discover?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json() as { songs?: Song[]; error?: string; warning?: string; quota?: QuotaInfo };
    setDiscoverWarning(payload.warning ?? null);
    setQuotaInfo(payload.quota ?? null);
    if (!response.ok) {
      setDiscoverError(payload.error ?? "Failed to load songs.");
      return [];
    }
    setDiscoverError(null);
    if (!Array.isArray(payload.songs)) return [];
    return payload.songs;
  }, []);

  const refillQueue = useCallback(async (language: Language, selectedMood: Mood) => {
    if (queueRef.current.length >= 8) return;

    const seen = getSeenSet(language, selectedMood);
    const queuedIds = queueRef.current.map((s) => s.id);
    let discovered = await discoverSongs(language, selectedMood, [...Array.from(seen), ...queuedIds], 14);

    // If we exhausted "new" songs for this language, allow reuse so autoplay never stalls.
    if (!discovered.length && seen.size > 0) {
      seen.clear();
      discovered = await discoverSongs(language, selectedMood, queuedIds, 14);
    }

    // Last-resort fallback when the API keeps returning narrow/duplicate lists.
    if (!discovered.length) {
      discovered = await discoverSongs(language, selectedMood, [], 14);
    }

    if (!discovered.length) return;

    for (const track of discovered) {
      if (seen.has(track.id)) continue;
      if (queueRef.current.some((q) => q.id === track.id)) continue;
      queueRef.current.push(track);
    }
  }, [discoverSongs, getSeenSet]);

  // ── next song ──────────────────────────────────────────────────────────────
  const next = useCallback(async (opts?: { excludeId?: string }) => {
    if (loadingNextRef.current) return;
    loadingNextRef.current = true;

    try {
      clearAll();

      const currentLang = langRef.current;
      const currentMood = moodRef.current;
      const seen = getSeenSet(currentLang, currentMood);

      if (opts?.excludeId) {
        seen.add(opts.excludeId);
      }

      let attempts = 0;
      while (attempts < 2) {
        if (!queueRef.current.length) {
          setStatus("loading");
          await refillQueue(currentLang, currentMood);
        }

        while (queueRef.current.length) {
          const candidate = queueRef.current.shift();
          if (!candidate) continue;
          if (candidate.id === opts?.excludeId || seen.has(candidate.id)) continue;

          const current = songRef.current;
          if (current && current.id !== candidate.id) {
            historyRef.current.push(current);
            setCanPrev(true);
          }
          seen.add(candidate.id);
          playSong(candidate, "clip");
          if (queueRef.current.length < 4) {
            void refillQueue(currentLang, currentMood);
          }
          return;
        }

        attempts += 1;
      }

      // Auto-retry once shortly instead of getting stuck until manual refresh.
      const err = (discoverErrorRef.current ?? "").toLowerCase();
      const quotaOrAccessIssue =
        err.includes("quota") || err.includes("access denied") || err.includes("api key");
      if (!quotaOrAccessIssue) {
        setTimeout(() => {
          void next();
        }, 1200);
      }
      setStatus("idle");
    } finally {
      loadingNextRef.current = false;
    }
  }, [clearAll, getSeenSet, playSong, refillQueue]);

  // ── schedule clip end ──────────────────────────────────────────────────────
  const scheduleEnd = useCallback(() => {
    if (fullModeRef.current) return;
    const wait = Math.max((clipDurRef.current - 2) * 1000, 500);
    fadeTimerRef.current = setTimeout(() => {
      if (progIntRef.current) clearInterval(progIntRef.current);
      fadeOut(() => {
        setTimeout(() => {
          void next();
        }, 250);
      }, { stopAfterFade: true });
    }, wait);
  }, [fadeOut, next]);

  // ── YouTube player state change ────────────────────────────────────────────
  const onStateChange = useCallback((e: YTStateChangeEventLike) => {
    if (e.data === window.YT.PlayerState.BUFFERING) setStatus("seeking");
    if (e.data === window.YT.PlayerState.ENDED) {
      if (progIntRef.current) clearInterval(progIntRef.current);
      setIsPaused(false);
      void next();
      return;
    }
    if (e.data === window.YT.PlayerState.PAUSED) {
      if (progIntRef.current) clearInterval(progIntRef.current);
      setIsPaused(true);
      setStatus("paused");
      return;
    }
    if (e.data === window.YT.PlayerState.PLAYING && !playingRef.current) {
      playingRef.current = true;
      setIsPaused(false);
      clipStartRef.current = Date.now();
      setStatus("playing");
      startProgress();
      fadeIn();
      scheduleEnd();
    }
  }, [fadeIn, scheduleEnd, startProgress]);

  // ── load a language ────────────────────────────────────────────────────────
  const loadLang = useCallback(async (l: Language) => {
    langRef.current = l;
    setLangState(l);
    queueRef.current = [];
    historyRef.current = [];
    setCanPrev(false);
    fullModeRef.current = false;
    setIsFullSong(false);
    setIsPaused(false);
    setStatus("loading");
    await next();
  }, [next]);

  const loadMood = useCallback(async (m: Mood) => {
    moodRef.current = m;
    setMoodState(m);
    queueRef.current = [];
    historyRef.current = [];
    setCanPrev(false);
    fullModeRef.current = false;
    setIsFullSong(false);
    setIsPaused(false);
    setStatus("loading");
    await next();
  }, [next]);

  // ── duration change ────────────────────────────────────────────────────────
  const setClipDur = useCallback((d: number) => {
    const clamped = Math.max(15, Math.min(90, d));
    const normalized = Math.round(clamped / 5) * 5;
    clipDurRef.current = normalized;
    setClipDurState(normalized);

    // Re-apply the new clip duration on the currently playing song (clip mode only).
    // Debounced to avoid repeated reloads while dragging the slider.
    if (!fullModeRef.current && songRef.current && playerRef.current && ytReadyRef.current) {
      if (durApplyRef.current) clearTimeout(durApplyRef.current);
      durApplyRef.current = setTimeout(() => {
        const current = songRef.current;
        if (!current || fullModeRef.current) return;
        playSong(current, "clip");
      }, 220);
    }
  }, []);

  // ── like / unlike ──────────────────────────────────────────────────────────
  const toggleLike = useCallback((s: Song) => {
    setLiked(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      return idx > -1 ? prev.filter(x => x.id !== s.id) : [...prev, s];
    });
  }, []);

  const isLiked = useCallback((s: Song | null) => {
    if (!s) return false;
    return liked.some(x => x.id === s.id);
  }, [liked]);

  const playFullCurrent = useCallback(() => {
    const current = songRef.current;
    if (!current) return;
    playSong(current, "full");
  }, [playSong]);

  const togglePause = useCallback(() => {
    const player = playerRef.current;
    if (!player || !songRef.current) return;
    const yt = typeof window !== "undefined" ? window.YT : undefined;
    const rawState = player.getPlayerState?.();
    const playerIsPaused = yt ? rawState === yt.PlayerState.PAUSED : false;
    const playerIsPlaying = yt ? rawState === yt.PlayerState.PLAYING : false;

    const shouldResume = isPaused || status === "paused" || playerIsPaused;
    if (shouldResume) {
      // Ensure PLAYING transition runs reliably after resume.
      playingRef.current = false;
      player.playVideo?.();
      setIsPaused(false);
      setStatus("seeking");
      return;
    }

    const canPause = status === "playing" || status === "seeking" || status === "loading" || playerIsPlaying;
    if (canPause) {
      if (fadeIntRef.current) clearInterval(fadeIntRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (progIntRef.current) clearInterval(progIntRef.current);
      player.pauseVideo?.();
      playingRef.current = false;
      setIsPaused(true);
      setStatus("paused");
    }
  }, [isPaused, status]);

  const prev = useCallback(() => {
    const previousSong = historyRef.current.pop();
    setCanPrev(historyRef.current.length > 0);
    if (!previousSong) return;

    const current = songRef.current;
    if (current && current.id !== previousSong.id && !queueRef.current.some((q) => q.id === current.id)) {
      queueRef.current.unshift(current);
    }

    playSong(previousSong, "clip");
  }, [playSong]);

  // ── YouTube IFrame API bootstrap ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = () => {
      ytReadyRef.current = true;
      playerRef.current = new window.YT.Player("yt-player-anchor", {
        height: "180",
        width: "320",
        videoId: "",
        playerVars: {
          autoplay: 0, controls: 0, modestbranding: 1,
          rel: 0, fs: 0, iv_load_policy: 3, playsinline: 1, disablekb: 1,
        },
        events: {
          onReady: () => {
            void loadLang(langRef.current);
          },
          onStateChange,
          onError: () => {
            const currentSong = songRef.current;
            setTimeout(() => {
              void next({ excludeId: currentSong?.id });
            }, 500);
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
      if (!document.getElementById("yt-api-script")) {
        const s = document.createElement("script");
        s.id  = "yt-api-script";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    return () => { clearAll(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-attach onStateChange when next/scheduleEnd deps change
  useEffect(() => {
    if (playerRef.current) {
      // YT doesn't expose removeEventListener cleanly, so we track via ref
    }
  }, [onStateChange]);

  return {
    song, status, progress, elapsed, clipDur, lang, mood, liked, discoverError, discoverWarning, quotaInfo, isFullSong, fullDuration, canPrev, isPaused,
    setClipDur, loadLang, loadMood, next, prev, togglePause, toggleLike, isLiked, playFullCurrent,
  };
}
