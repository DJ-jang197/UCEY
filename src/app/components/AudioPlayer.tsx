"use client";

import { useEffect, useRef, useState } from "react";

type AudioPlayerProps = {
  audioUrl: string | null;
  summaryText?: string | null;
  theme?: "light" | "dark";
};

export default function AudioPlayer({ audioUrl: audioUrlProp, summaryText }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);
  const shouldAutoPlayRef = useRef(false);

  const audioUrl = audioUrlProp ?? generatedAudioUrl;

  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  /* Poll progress while playing (timeupdate can be unreliable with data-URL audio) */
  useEffect(() => {
    if (!isPlaying || !audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const tick = () => {
      const el = audioRef.current;
      if (!el) return;
      if (el.ended || !isFinite(el.duration) || el.duration <= 0) {
        setIsPlaying(false);
        setProgress(0);
        return;
      }
      setProgress((el.currentTime / el.duration) * 100);
    };

    tick();
    const id = setInterval(tick, 150);

    return () => clearInterval(id);
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    queueMicrotask(() => setProgress(0));
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrlProp != null) setGeneratedAudioUrl(null);
  }, [audioUrlProp]);

  useEffect(() => {
    if (!audioUrl || !shouldAutoPlayRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    shouldAutoPlayRef.current = false;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [audioUrl]);

  const SKIP_SECONDS = 5;

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

  const skipBack = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    const next = Math.max(0, audio.currentTime - SKIP_SECONDS);
    audio.currentTime = next;
    if (audio.duration && !isNaN(audio.duration)) {
      setProgress((next / audio.duration) * 100);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    const duration = audio.duration && !isNaN(audio.duration) ? audio.duration : 0;
    const next = duration ? Math.min(duration, audio.currentTime + SKIP_SECONDS) : audio.currentTime + SKIP_SECONDS;
    audio.currentTime = next;
    if (duration) setProgress((next / duration) * 100);
  };

  const handleSynthesizeAndPlay = async () => {
    if (!summaryText?.trim() || synthesizing) return;
    setSynthesizing(true);
    setSynthesizeError(null);
    try {
      const res = await fetch("/api/audio/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSynthesizeError(data?.error?.message ?? "Could not generate audio");
        return;
      }
      const url = data.audioUrl;
      if (url) {
        shouldAutoPlayRef.current = true;
        setGeneratedAudioUrl(url);
      } else {
        setSynthesizeError("No audio returned");
      }
    } catch {
      setSynthesizeError("Request failed");
    } finally {
      setSynthesizing(false);
    }
  };

  if (!audioUrl) {
    const canSynthesize = Boolean(summaryText?.trim());
    return (
      <div className={`audio-player mt-4 rounded-xl border border-[var(--divider)] bg-[var(--bg-input)] p-3 ${canSynthesize ? "" : "opacity-70"}`}>
        {canSynthesize ? (
          <button
            type="button"
            className="play-btn play-btn-legible"
            onClick={handleSynthesizeAndPlay}
            disabled={synthesizing}
          >
            {synthesizing ? "⏳ Generating…" : "🔊 Generate and play audio"}
          </button>
        ) : (
          <button type="button" className="play-btn play-btn-legible cursor-not-allowed" disabled>
            🔊 Audio unavailable
          </button>
        )}
        {synthesizeError && (
          <p className="mt-2 text-xs text-[var(--error-text)]">{synthesizeError}</p>
        )}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "0%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player mt-4 rounded-xl border border-[var(--divider)] bg-[var(--bg-input)] p-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="play-btn play-btn-legible" onClick={skipBack} title="Back 5 s">
            −5s
          </button>
          <button type="button" id="play-btn" className="play-btn play-btn-legible" onClick={togglePlayback}>
            {isPlaying ? "⏸ Pause" : "🔊 Listen"}
          </button>
          <button type="button" className="play-btn play-btn-legible" onClick={skipForward} title="Forward 5 s">
            +5s
          </button>
        </div>
        <audio id="report-audio" ref={audioRef} src={audioUrl} preload="none" />
        <div className="progress-bar">
        <div
          className="progress-fill"
          id="progress-fill"
          style={{ width: `${progress}%` }}
        />
        </div>
      </div>
    </div>
  );
}
