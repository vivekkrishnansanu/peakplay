"use client";
import { useEffect, useState } from "react";

interface Props {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        bg-[rgba(28,28,38,0.92)] border border-white/10 backdrop-blur-xl
        rounded-full px-5 py-2.5 text-[13px] text-white whitespace-nowrap z-50
        transition-transform duration-300
        ${visible ? "translate-y-0" : "translate-y-20"}
      `}
    >
      {message}
    </div>
  );
}
