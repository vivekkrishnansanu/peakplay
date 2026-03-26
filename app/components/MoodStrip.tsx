"use client";
import { Mood, MOODS } from "../data/songs";

interface Props {
  active: Mood;
  onChange: (mood: Mood) => void;
}

export default function MoodStrip({ active, onChange }: Props) {
  return (
    <div className="w-full mt-3">
      <p className="text-[10px] tracking-[1.2px] uppercase text-white/40 font-medium mb-2.5">
        Choose Mood
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MOODS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex-shrink-0 rounded-full px-4 py-2.5 text-[13px] font-medium
              border transition-all duration-200 whitespace-nowrap outline-none
              ${active === key
                ? "bg-accent border-accent text-white shadow-[0_4px_18px_rgba(255,51,85,0.35)]"
                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/80"
              }
            `}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
