"use client";
import { useEffect, useRef, useState } from "react";
import { Song, thumbUrl } from "../data/songs";

interface Props {
  song: Song | null;
}

export default function BgScene({ song }: Props) {
  const [layerA, setLayerA] = useState("");
  const [layerB, setLayerB] = useState("");
  const [activeLayer, setActiveLayer] = useState<"a" | "b">("a");
  const toggle = useRef(false);

  useEffect(() => {
    if (!song) return;
    const url = thumbUrl(song.id, "max");
    toggle.current = !toggle.current;
    if (toggle.current) {
      setLayerA(url);
      setActiveLayer("a");
    } else {
      setLayerB(url);
      setActiveLayer("b");
    }
  }, [song?.id]);

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: -60,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(80px) saturate(1.8) brightness(0.6)",
    transition: "opacity 2s ease",
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div style={{ ...baseStyle, backgroundImage: layerA ? `url(${layerA})` : undefined, opacity: activeLayer === "a" ? 0.45 : 0 }} />
      <div style={{ ...baseStyle, backgroundImage: layerB ? `url(${layerB})` : undefined, opacity: activeLayer === "b" ? 0.45 : 0 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,6,14,0.5) 0%, rgba(6,6,14,0.78) 60%, rgba(6,6,14,0.97) 100%)" }} />
    </div>
  );
}
