"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const MARKS = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90];

function normalizeDuration(raw: number): number {
  const clamped = Math.max(15, Math.min(90, raw));
  return Math.round(clamped / 5) * 5;
}

export default function DurationSlider({ value, onChange }: Props) {
  const normalizedValue = normalizeDuration(value);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-[18px] backdrop-blur-2xl px-5 pt-[18px] pb-4 mb-3">
      <div className="flex justify-between items-center mb-3.5">
        <p className="text-[10px] tracking-[1.2px] uppercase text-white/40 font-medium">
          Clip Duration
        </p>
        <p
          className="font-syne font-extrabold text-[30px] text-gold leading-none"
          style={{ textShadow: "0 0 24px rgba(255,184,48,0.4)" }}
        >
          {normalizedValue}
          <span className="text-sm font-normal text-gold/65 ml-0.5">s</span>
        </p>
      </div>

      <input
        type="range"
        min={15}
        max={90}
        step={5}
        value={normalizedValue}
        onInput={e => onChange(normalizeDuration(Number((e.target as HTMLInputElement).value)))}
        onChange={e => onChange(normalizeDuration(Number(e.target.value)))}
        className="w-full h-[3px] rounded-full outline-none cursor-pointer appearance-none bg-white/10"
        style={{
          // Webkit thumb
          WebkitAppearance: "none",
        }}
      />

      <div className="flex justify-between mt-2">
        {MARKS.map(m => (
          <span key={m} className={`text-[10px] ${m === normalizedValue ? "text-gold/70" : "text-white/20"}`}>
            {m}s
          </span>
        ))}
      </div>
    </div>
  );
}
