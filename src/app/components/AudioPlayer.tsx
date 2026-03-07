"use client";

import { useEffect, useRef, useState } from "react";

type AudioPlayerProps = {
  audioUrl: string | null;
  theme?: "light" | "dark";
};

export default function AudioPlayer({ audioUrl, theme = "light" }: AudioPlayerProps) {
  const isDark = theme === "dark";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    queueMicrotask(() => setProgress(0));
  }, [audioUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        console.error("Unable to start audio playback");
      }
    }
  };

  if (!audioUrl) {
    return (
      <div
        className={`audio-player mt-4 rounded-xl border p-3 opacity-70 ${
          isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-slate-100/80"
        }`}
      >
        <button
          type="button"
          className="play-btn cursor-not-allowed bg-slate-500 text-slate-200"
          disabled
        >
          🔊 Audio unavailable
        </button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "0%" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`audio-player mt-4 rounded-xl border p-3 ${
        isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-slate-100/80"
      }`}
    >
      <button type="button" id="play-btn" className="play-btn" onClick={togglePlayback}>
        {isPlaying ? "⏸ Pause" : "🔊 Listen to Report"}
      </button>
      <audio id="report-audio" ref={audioRef} src={audioUrl} preload="none" />
      <div className="progress-bar">
        <div
          className="progress-fill"
          id="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
