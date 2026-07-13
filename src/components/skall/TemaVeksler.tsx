"use client";

import { useEffect, useState } from "react";

export function TemaVeksler() {
  const [morketid, setMorketid] = useState(false);

  useEffect(() => {
    setMorketid(document.documentElement.classList.contains("morketid"));
  }, []);

  function veksle() {
    const neste = !morketid;
    setMorketid(neste);
    document.documentElement.classList.toggle("morketid", neste);
    try {
      localStorage.setItem("tema", neste ? "morketid" : "dagslys");
    } catch {}
  }

  return (
    <button
      onClick={veksle}
      title={morketid ? "Bytt til dagslys" : "Bytt til mørketid"}
      className="rounded-lg p-2 text-lg hover:bg-flate-dyp transition-colors cursor-pointer"
    >
      {morketid ? "🌌" : "☀️"}
    </button>
  );
}
