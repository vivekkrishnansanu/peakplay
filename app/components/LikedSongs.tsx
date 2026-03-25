"use client";
import { Song, thumbUrl } from "../data/songs";

interface Props {
  liked: Song[];
}

export default function LikedSongs({ liked }: Props) {
  if (!liked.length) return null;

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-[18px] backdrop-blur-2xl px-5 pt-[18px] pb-[18px] mb-3 animate-[fade-up_0.35s_ease]">
      <p className="text-[10px] tracking-[1.2px] uppercase text-white/40 font-medium mb-3">
        ❤️ Liked Songs
      </p>
      <div>
        {liked.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 py-2 ${i < liked.length - 1 ? "border-b border-white/[0.05]" : ""}`}
          >
            <img
              src={thumbUrl(s.id, "mq")}
              alt={s.title}
              className="w-[42px] h-[42px] rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate">{s.title}</p>
              <p className="text-[11px] text-white/40">{s.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
