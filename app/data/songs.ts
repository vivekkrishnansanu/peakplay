export type Language = "english" | "hindi" | "malayalam" | "tamil" | "telugu" | "kannada";

export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Most-replayed / peak timestamp in seconds */
  peak: number;
}

export const LANGUAGES: { key: Language; label: string; flag: string }[] = [
  { key: "english",   label: "English",   flag: "🇺🇸" },
  { key: "hindi",     label: "Hindi",     flag: "🇮🇳" },
  { key: "malayalam", label: "Malayalam", flag: "🌴" },
  { key: "tamil",     label: "Tamil",     flag: "🎵" },
  { key: "telugu",    label: "Telugu",    flag: "⭐" },
  { key: "kannada",   label: "Kannada",   flag: "🎶" },
];

export const LANGUAGE_SEARCH_TERMS: Record<Language, string[]> = {
  english: ["english pop music", "english indie songs", "english top songs"],
  hindi: ["hindi songs", "bollywood songs", "hindi indie music"],
  malayalam: ["malayalam songs", "malayalam indie music", "malayalam music video"],
  tamil: ["tamil songs", "tamil indie music", "tamil music video"],
  telugu: ["telugu songs", "telugu indie music", "telugu music video"],
  kannada: ["kannada songs", "kannada indie music", "kannada music video"],
};

export function thumbUrl(id: string, quality: "max" | "hq" | "mq" = "max") {
  const map = { max: "maxresdefault", hq: "hqdefault", mq: "mqdefault" };
  return `https://img.youtube.com/vi/${id}/${map[quality]}.jpg`;
}
