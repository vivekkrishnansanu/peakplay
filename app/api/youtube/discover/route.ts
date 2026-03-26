import { NextRequest, NextResponse } from "next/server";
import { Language, Mood, Song } from "@/app/data/songs";

const YOUTUBE_DATA_API_BASE = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_SEARCH_API_BASE = "https://www.googleapis.com/youtube/v3/search";
const MUSIC_CATEGORY_ID = "10";

const REGION_BY_LANGUAGE: Record<Language, string> = {
  english: "US",
  hindi: "IN",
  malayalam: "IN",
  tamil: "IN",
  telugu: "IN",
  kannada: "IN",
};

const LANGUAGE_QUERY_BY_LANGUAGE: Record<Language, string> = {
  english: "english music",
  hindi: "hindi music",
  malayalam: "malayalam music",
  tamil: "tamil music",
  telugu: "telugu music",
  kannada: "kannada music",
};

const MOOD_QUERY_SUFFIX_BY_MOOD: Record<Mood, string> = {
  dance: "dance mix songs",
  drive: "drive mix songs",
  calm: "calm relaxing songs",
};

const INCLUDE_HINTS_BY_LANGUAGE: Record<Language, string[]> = {
  english: [],
  hindi: ["hindi", "bollywood", "हिंदी", "गीत"],
  malayalam: ["malayalam", "മലയാളം"],
  tamil: ["tamil", "தமிழ்"],
  telugu: ["telugu", "తెలుగు"],
  kannada: ["kannada", "ಕನ್ನಡ"],
};

const EXCLUDE_HINTS_BY_LANGUAGE: Record<Language, string[]> = {
  english: ["hindi", "malayalam", "tamil", "telugu", "kannada", "punjabi"],
  hindi: ["malayalam", "tamil", "telugu", "kannada"],
  malayalam: ["hindi", "tamil", "telugu", "kannada", "punjabi"],
  tamil: ["hindi", "malayalam", "telugu", "kannada", "punjabi"],
  telugu: ["hindi", "malayalam", "tamil", "kannada", "punjabi"],
  kannada: ["hindi", "malayalam", "tamil", "telugu", "punjabi"],
};

const RELEVANCE_LANGUAGE_BY_LANGUAGE: Record<Language, string> = {
  english: "en",
  hindi: "hi",
  malayalam: "ml",
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
};

const FALLBACK_SONGS: Record<Language, Song[]> = {
  english: [
    { id: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", peak: 53 },
    { id: "hT_nvWreIhg", title: "Counting Stars", artist: "OneRepublic", peak: 62 },
    { id: "pRpeEdMmmQ0", title: "Cheap Thrills", artist: "Sia", peak: 52 },
    { id: "YqeW9_5kURI", title: "Levitating", artist: "Dua Lipa", peak: 28 },
  ],
  hindi: [
    { id: "Xi8Fabcb_MA", title: "Chaand Baaliyan", artist: "Aditya A", peak: 55 },
    { id: "eTucXMU8ctw", title: "Mann", artist: "The Yellow Diary", peak: 60 },
    { id: "xwwAVRyNmgQ", title: "Jai Ho", artist: "A.R. Rahman", peak: 40 },
    { id: "puKD3nkB1h4", title: "Ziddi Dil", artist: "Vishal Dadlani", peak: 50 },
  ],
  malayalam: [
    { id: "4I6WrjN_8-c", title: "Kerala Manninayi", artist: "Gopi Sundar", peak: 50 },
    { id: "7xQCCw5sbdY", title: "Jupiter Mazha", artist: "Karikku Tuned", peak: 45 },
    { id: "OPzY3ekoIrA", title: "Voice of Voiceless", artist: "Vedan", peak: 58 },
    { id: "FXiaIH49oAU", title: "Entammede Jimikki", artist: "Shaan Rahman", peak: 35 },
  ],
  tamil: [
    { id: "z0rsA7VepoM", title: "Ulaa", artist: "The Non Violinist Project", peak: 52 },
    { id: "gESHWPbFrvk", title: "Paiya Dei", artist: "Asal Kolaar", peak: 45 },
    { id: "mCwNRSYgXbE", title: "Kaaka Kadha", artist: "Vaisagh", peak: 50 },
    { id: "dG2MODM1SJY", title: "Olalai", artist: "kelithee x ofRo", peak: 54 },
  ],
  telugu: [
    { id: "0K8qu5H4oXk", title: "Neeve", artist: "Phani Kalyan", peak: 62 },
    { id: "EEXIp9RDI14", title: "Sakhiya", artist: "Asrith x Saathwik", peak: 48 },
    { id: "aoo9QkKRNgI", title: "Chustu Chustune", artist: "Sumanth", peak: 50 },
    { id: "EZP9T__5vHQ", title: "Oh Pilla", artist: "Bunnyvox", peak: 46 },
  ],
  kannada: [
    { id: "lnYptjdQbyo", title: "Jogada Siri Belakinalli", artist: "Mysore Ananthaswamy", peak: 45 },
    { id: "Ruqzwe1iOB4", title: "Antharaala", artist: "Beatlayers", peak: 52 },
    { id: "4d9LumAJkMs", title: "Namma Indiaa", artist: "Independent", peak: 42 },
    { id: "Pte81bbuO7A", title: "Maate Poojaka", artist: "Kannada Artists", peak: 50 },
  ],
};

interface YouTubeTrendingItem {
  id?: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    liveBroadcastContent?: string;
  };
  status?: {
    embeddable?: boolean;
  };
  contentDetails?: {
    duration?: string;
  };
}

interface YouTubeTrendingResponse {
  items?: YouTubeTrendingItem[];
}

interface YouTubeSearchItem {
  id?: {
    kind?: string;
    videoId?: string;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubeApiErrorPayload {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{
      reason?: string;
      message?: string;
    }>;
  };
}

interface CachedLanguagePool {
  songs: Song[];
  fetchedAt: number;
  quotaBlockedUntil: number;
  lastError?: string;
}

interface QuotaTracker {
  dayKey: string;
  estimatedUnitsUsed: number;
  estimatedDailyLimit: number;
}

interface QuotaStatus {
  source: "estimated";
  day: string;
  used: number;
  limit: number;
  remaining: number;
  usagePct: number;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const QUOTA_BACKOFF_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_POOL_SIZE = 180;
const SEARCH_API_UNITS = 100;
const VIDEOS_API_UNITS = 1;
const DEFAULT_YOUTUBE_DAILY_LIMIT = 10_000;

declare global {
  // eslint-disable-next-line no-var
  var __playitSongCache: Record<Language, Record<Mood, CachedLanguagePool>> | undefined;
  // eslint-disable-next-line no-var
  var __playitSongRefresh: Partial<Record<string, Promise<void>>> | undefined;
  // eslint-disable-next-line no-var
  var __playitQuotaTracker: QuotaTracker | undefined;
}

function initCache(): Record<Language, Record<Mood, CachedLanguagePool>> {
  return {
    english: {
      dance: { songs: [...FALLBACK_SONGS.english], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.english], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.english], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
    hindi: {
      dance: { songs: [...FALLBACK_SONGS.hindi], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.hindi], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.hindi], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
    malayalam: {
      dance: { songs: [...FALLBACK_SONGS.malayalam], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.malayalam], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.malayalam], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
    tamil: {
      dance: { songs: [...FALLBACK_SONGS.tamil], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.tamil], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.tamil], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
    telugu: {
      dance: { songs: [...FALLBACK_SONGS.telugu], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.telugu], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.telugu], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
    kannada: {
      dance: { songs: [...FALLBACK_SONGS.kannada], fetchedAt: 0, quotaBlockedUntil: 0 },
      drive: { songs: [...FALLBACK_SONGS.kannada], fetchedAt: 0, quotaBlockedUntil: 0 },
      calm: { songs: [...FALLBACK_SONGS.kannada], fetchedAt: 0, quotaBlockedUntil: 0 },
    },
  };
}

const SONG_CACHE = globalThis.__playitSongCache ?? (globalThis.__playitSongCache = initCache());
const SONG_REFRESH = globalThis.__playitSongRefresh ?? (globalThis.__playitSongRefresh = {});

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readDailyLimit(): number {
  const envValue = Number(process.env.YOUTUBE_API_DAILY_QUOTA ?? "");
  if (Number.isFinite(envValue) && envValue > 0) return Math.floor(envValue);
  return DEFAULT_YOUTUBE_DAILY_LIMIT;
}

function initQuotaTracker(): QuotaTracker {
  return {
    dayKey: getDayKey(),
    estimatedUnitsUsed: 0,
    estimatedDailyLimit: readDailyLimit(),
  };
}

const QUOTA_TRACKER = globalThis.__playitQuotaTracker ?? (globalThis.__playitQuotaTracker = initQuotaTracker());

function ensureQuotaTrackerFreshDay(): void {
  const dayKey = getDayKey();
  if (QUOTA_TRACKER.dayKey !== dayKey) {
    QUOTA_TRACKER.dayKey = dayKey;
    QUOTA_TRACKER.estimatedUnitsUsed = 0;
  }
  QUOTA_TRACKER.estimatedDailyLimit = readDailyLimit();
}

function recordQuotaUnits(units: number): void {
  ensureQuotaTrackerFreshDay();
  QUOTA_TRACKER.estimatedUnitsUsed += Math.max(0, units);
}

function getQuotaStatus(): QuotaStatus {
  ensureQuotaTrackerFreshDay();
  const used = QUOTA_TRACKER.estimatedUnitsUsed;
  const limit = Math.max(1, QUOTA_TRACKER.estimatedDailyLimit);
  const remaining = Math.max(0, limit - used);
  const usagePct = Math.min(100, Math.round((used / limit) * 100));
  return {
    source: "estimated",
    day: QUOTA_TRACKER.dayKey,
    used,
    limit,
    remaining,
    usagePct,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mergeSongs(existing: Song[], incoming: Song[]): Song[] {
  const byId = new Map<string, Song>();
  for (const song of existing) byId.set(song.id, song);
  for (const song of incoming) byId.set(song.id, song);
  return shuffle(Array.from(byId.values())).slice(0, MAX_POOL_SIZE);
}

function pickSongsFromPool(pool: Song[], excluded: Set<string>, limit: number): Song[] {
  if (!pool.length) return [];
  const fresh = shuffle(pool.filter((song) => !excluded.has(song.id)));
  if (fresh.length >= limit) return fresh.slice(0, limit);
  if (fresh.length > 0) return fresh;
  // If all songs are excluded, allow recycle so playback can continue.
  return shuffle(pool).slice(0, limit);
}

async function extractYouTubeError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as YouTubeApiErrorPayload;
    const reason = payload.error?.errors?.[0]?.reason;
    const message = payload.error?.errors?.[0]?.message ?? payload.error?.message;
    if (reason && message) return `${reason}: ${message}`;
    if (reason) return reason;
    if (message) return message;
  } catch {
    // Ignore parse failures and use generic status text below.
  }
  return response.statusText || "Unknown API error";
}

function pickPeak(): number {
  return Math.floor(Math.random() * 40) + 20;
}

function parseIsoDurationToSeconds(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return (hours * 60 * 60) + (minutes * 60) + seconds;
}

function pickPeakByDuration(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return pickPeak();
  const clamped = Math.min(durationSeconds, 240);
  const minStart = Math.max(15, Math.floor(clamped * 0.2));
  const maxStart = Math.max(minStart, Math.floor(clamped * 0.75));
  return Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;
}

function hasLanguageScript(text: string, language: Language): boolean {
  if (language === "malayalam") return /[\u0D00-\u0D7F]/.test(text);
  if (language === "tamil") return /[\u0B80-\u0BFF]/.test(text);
  if (language === "telugu") return /[\u0C00-\u0C7F]/.test(text);
  if (language === "kannada") return /[\u0C80-\u0CFF]/.test(text);
  if (language === "hindi") return /[\u0900-\u097F]/.test(text);
  return false;
}

function matchesLanguageHeuristics(item: YouTubeTrendingItem, language: Language): boolean {
  const source = `${item.snippet?.title ?? ""} ${item.snippet?.channelTitle ?? ""}`;
  const lowered = source.toLowerCase();

  const excluded = EXCLUDE_HINTS_BY_LANGUAGE[language];
  if (excluded.some((hint) => lowered.includes(hint))) return false;

  if (language === "english") return true;
  if (hasLanguageScript(source, language)) return true;

  const includes = INCLUDE_HINTS_BY_LANGUAGE[language];
  return includes.some((hint) => lowered.includes(hint.toLowerCase()));
}

function normalizeTrendingItem(item: YouTubeTrendingItem, language: Language): Song | null {
  if (!item.id || !item.snippet?.title) return null;
  if (item.status?.embeddable === false) return null;
  if (item.snippet.liveBroadcastContent && item.snippet.liveBroadcastContent !== "none") return null;
  if (!matchesLanguageHeuristics(item, language)) return null;

  const normalizedTitle = item.snippet.title.toLowerCase();
  if (
    normalizedTitle.includes("playlist") ||
    normalizedTitle.includes("mix") ||
    normalizedTitle.includes("hour") ||
    normalizedTitle.includes("hours")
  ) {
    return null;
  }

  return {
    id: item.id,
    title: item.snippet.title,
    artist: item.snippet.channelTitle ?? "Unknown Artist",
    peak: pickPeakByDuration(parseIsoDurationToSeconds(item.contentDetails?.duration)),
  };
}

function buildLanguageMoodQuery(language: Language, mood: Mood): string {
  const base = `${LANGUAGE_QUERY_BY_LANGUAGE[language]} ${MOOD_QUERY_SUFFIX_BY_MOOD[mood]}`;
  const exclusions = EXCLUDE_HINTS_BY_LANGUAGE[language].map((hint) => `-${hint}`).join(" ");
  return `${base} ${exclusions}`.trim();
}

async function fetchVideoDetailsByIds(videoIds: string[], apiKey: string): Promise<YouTubeTrendingItem[]> {
  if (!videoIds.length) return [];
  recordQuotaUnits(VIDEOS_API_UNITS);

  const url = new URL(YOUTUBE_DATA_API_BASE);
  url.searchParams.set("part", "snippet,contentDetails,status");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("maxResults", String(Math.min(videoIds.length, 50)));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await extractYouTubeError(response);
    throw new Error(`YouTube Data API failed (${response.status}) - ${detail}`);
  }

  const payload = (await response.json()) as YouTubeTrendingResponse;
  return Array.isArray(payload.items) ? payload.items : [];
}

async function fetchLanguageSearchVideoIds(language: Language, mood: Mood, apiKey: string): Promise<string[]> {
  recordQuotaUnits(SEARCH_API_UNITS);
  const url = new URL(YOUTUBE_SEARCH_API_BASE);
  url.searchParams.set("part", "id");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", MUSIC_CATEGORY_ID);
  url.searchParams.set("regionCode", REGION_BY_LANGUAGE[language]);
  url.searchParams.set("q", buildLanguageMoodQuery(language, mood));
  url.searchParams.set("relevanceLanguage", RELEVANCE_LANGUAGE_BY_LANGUAGE[language]);
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await extractYouTubeError(response);
    throw new Error(`YouTube Search API failed (${response.status}) - ${detail}`);
  }

  const payload = (await response.json()) as YouTubeSearchResponse;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const uniqueIds = new Set<string>();
  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    uniqueIds.add(videoId);
  }
  return Array.from(uniqueIds);
}

async function fetchTrendingMusicVideos(language: Language, mood: Mood, apiKey: string): Promise<Song[]> {
  const videoIds = await fetchLanguageSearchVideoIds(language, mood, apiKey);
  const details = await fetchVideoDetailsByIds(videoIds, apiKey);
  const items = Array.isArray(details) ? details : [];
  return items
    .map((item) => normalizeTrendingItem(item, language))
    .filter((song): song is Song => Boolean(song));
}

function isQuotaRelated(message: string): boolean {
  return /quotaExceeded|dailyLimitExceeded/i.test(message);
}

async function refreshLanguagePool(language: Language, mood: Mood, apiKey: string): Promise<void> {
  const cacheKey = `${language}:${mood}`;
  const existingRefresh = SONG_REFRESH[cacheKey];
  if (existingRefresh) {
    await existingRefresh;
    return;
  }

  const run = (async () => {
    const cache = SONG_CACHE[language][mood];
    const now = Date.now();
    try {
      const trending = await fetchTrendingMusicVideos(language, mood, apiKey);
      cache.songs = mergeSongs(cache.songs, trending);
      cache.fetchedAt = now;
      cache.lastError = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown refresh failure";
      cache.lastError = message;
      if (isQuotaRelated(message)) {
        cache.quotaBlockedUntil = now + QUOTA_BACKOFF_MS;
      }
      throw error;
    }
  })();

  SONG_REFRESH[cacheKey] = run;
  try {
    await run;
  } finally {
    delete SONG_REFRESH[cacheKey];
  }
}

function parseLanguage(langParam: string | null): Language | null {
  if (!langParam) return null;
  if (langParam === "english") return "english";
  if (langParam === "hindi") return "hindi";
  if (langParam === "malayalam") return "malayalam";
  if (langParam === "tamil") return "tamil";
  if (langParam === "telugu") return "telugu";
  if (langParam === "kannada") return "kannada";
  return null;
}

function parseMood(moodParam: string | null): Mood {
  if (moodParam === "dance") return "dance";
  if (moodParam === "drive") return "drive";
  if (moodParam === "calm") return "calm";
  return "dance";
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { songs: [], error: "Missing YOUTUBE_API_KEY on server." },
      { status: 503 },
    );
  }

  const lang = parseLanguage(request.nextUrl.searchParams.get("lang"));
  if (!lang) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }
  const mood = parseMood(request.nextUrl.searchParams.get("mood"));

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 10);
  const limit = Math.max(1, Math.min(20, Number.isFinite(requestedLimit) ? requestedLimit : 10));

  const excludeCsv = request.nextUrl.searchParams.get("exclude") ?? "";
  const excluded = new Set(
    excludeCsv
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
  const cache = SONG_CACHE[lang][mood];
  const now = Date.now();
  const cacheIsFresh = cache.songs.length > 0 && (now - cache.fetchedAt) < CACHE_TTL_MS;
  const quotaBackoffActive = now < cache.quotaBlockedUntil;
  const shouldRefresh = !cacheIsFresh && !quotaBackoffActive;

  if (cache.songs.length > 0 && (!shouldRefresh || cacheIsFresh || quotaBackoffActive)) {
    const songs = pickSongsFromPool(cache.songs, excluded, limit);
    if (songs.length > 0) {
      return NextResponse.json({
        songs,
        warning: quotaBackoffActive ? "Serving cached songs due to YouTube quota backoff." : undefined,
        quota: getQuotaStatus(),
      });
    }
  }

  try {
    await refreshLanguagePool(lang, mood, apiKey);
    const songs = pickSongsFromPool(cache.songs, excluded, limit);
    return NextResponse.json({ songs, quota: getQuotaStatus() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const reason =
      message.match(/(API_KEY_INVALID|API_KEY_SERVICE_BLOCKED|ipRefererBlocked|accessNotConfigured|quotaExceeded|dailyLimitExceeded)/)?.[1]
      ?? null;

    let friendly = "Failed to fetch trending songs from YouTube Data API.";
    if (reason === "API_KEY_INVALID") {
      friendly = "API key is invalid. Regenerate key and update YOUTUBE_API_KEY.";
    } else if (reason === "accessNotConfigured" || reason === "API_KEY_SERVICE_BLOCKED") {
      friendly = "YouTube Data API v3 is not enabled for this project.";
    } else if (reason === "ipRefererBlocked") {
      friendly = "API key restriction blocks this server. Set Application restriction to None or allowed server IP.";
    } else if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      friendly = "YouTube API quota exceeded for this key/project.";
      cache.quotaBlockedUntil = now + QUOTA_BACKOFF_MS;
    } else if (message.includes("(403)")) {
      friendly = "YouTube API access denied. Check API key quota/restrictions.";
    }
    cache.lastError = message;

    const cachedSongs = pickSongsFromPool(cache.songs, excluded, limit);
    if (cachedSongs.length > 0) {
      return NextResponse.json({
        songs: cachedSongs,
        warning: `${friendly} Serving cached songs.`,
        quota: getQuotaStatus(),
      });
    }

    return NextResponse.json(
      {
        songs: [],
        error: friendly,
        debug: message,
        quota: getQuotaStatus(),
      },
      { status: 503 },
    );
  }
}
