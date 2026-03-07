"use client";

import { useEffect, useRef, useState } from "react";

type AudioPlayerProps = {
  audioUrl: string | null;
};

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
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
      <div className="audio-player opacity-60">
        <button
          type="button"
          className="play-btn cursor-not-allowed bg-zinc-700 text-zinc-300"
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
    <div className="audio-player">
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
