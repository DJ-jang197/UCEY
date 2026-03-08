"use client";

import { useEffect, useState, useRef } from "react";

function getCaretViewportPosition(input: HTMLInputElement | HTMLTextAreaElement): { x: number; y: number } | null {
  try {
    const rect = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    const mirror = document.createElement("div");
    mirror.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "white-space:pre",
      "top:0",
      "left:0",
      "pointer-events:none",
      `font:${style.font}`,
      `letter-spacing:${style.letterSpacing}`,
      `padding-left:${style.paddingLeft}`,
      `padding-right:${style.paddingRight}`,
      `border-left:${style.borderLeftWidth} solid transparent`,
      `box-sizing:${style.boxSizing}`,
    ].join(";");
    document.body.appendChild(mirror);

    const value = input.value || "";
    const start = Math.min(input.selectionStart ?? value.length, value.length);
    const before = value.slice(0, start);
    mirror.textContent = before || " ";

    const textWidth = mirror.getBoundingClientRect().width;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const caretX = rect.left + paddingLeft + borderLeft + textWidth;
    const caretY = rect.top + rect.height / 2;
    document.body.removeChild(mirror);
    return { x: caretX, y: caretY };
  } catch {
    return null;
  }
}

function getActiveInputCaretPosition(): { x: number; y: number } | null {
  const el = document.activeElement;
  if (!el) return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const type = el instanceof HTMLInputElement ? (el.type || "text").toLowerCase() : "text";
    if (el instanceof HTMLInputElement && !["text", "search", "email", "url", "password"].includes(type))
      return null;
    const pos = getCaretViewportPosition(el);
    if (pos) return pos;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return null;
}

const FACE_SIZE = 84;
const EYE_OFFSET_X = 20; // left eye center (symmetric: 42 ± 22)
const EYE_OFFSET_X_RIGHT = 64;
const EYE_OFFSET_Y = 42;
const GAZE_MAX_PX = 12;
const GAZE_MAX_DOWN_PX = 2; // slight downward; nose/mouth move with eyes
const FACE_TILT_MAX = 9;

export default function LoonCharacter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gazeOffset, setGazeOffset] = useState({ x: 0, y: 0 });
  const [faceTilt, setFaceTilt] = useState(0);

  const LOOK_DOWN_DEG = 18;

  useEffect(() => {
    const updateEyes = () => {
      const caret = getActiveInputCaretPosition();
      const container = containerRef.current;
      if (!container || !caret) {
        setGazeOffset({ x: 0, y: 0 });
        setFaceTilt(0);
        return;
      }
      const rect = container.getBoundingClientRect();
      const faceLeft = rect.left + (rect.width - FACE_SIZE) / 2;
      const faceTop = rect.top + (rect.height - FACE_SIZE) / 2;
      const faceCenterX = faceLeft + FACE_SIZE / 2;
      const faceCenterY = faceTop + FACE_SIZE / 2;
      const dx = caret.x - faceCenterX;
      const dy = caret.y - faceCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const scale = Math.min(GAZE_MAX_PX / dist, 1);
      const gy = Math.min(dy * scale, GAZE_MAX_DOWN_PX);
      setGazeOffset({ x: dx * scale, y: gy });
      const faceTiltDeg = Math.max(-FACE_TILT_MAX, Math.min(FACE_TILT_MAX, (caret.x - faceCenterX) * 0.2));
      setFaceTilt(faceTiltDeg);
    };

    const handleFocusIn = () => updateEyes();
    const handleInput = () => updateEyes();
    const handleFocusOut = () => {
      setGazeOffset({ x: 0, y: 0 });
      setFaceTilt(0);
    };
    const handleSelectionChange = () => updateEyes();

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="loon-character"
      aria-hidden="true"
    >
      <div
        className="loon-face-wrapper"
        style={{
          transform: `perspective(280px) rotateX(${LOOK_DOWN_DEG}deg) rotateZ(${-faceTilt}deg)`,
        }}
      >
        <div className="loon-face">
          <div
            className="loon-eyes-group"
            style={{
              transform: `translate(${gazeOffset.x}px, ${gazeOffset.y}px)`,
            }}
          >
            <div className="loon-eye loon-eye-left" />
            <div className="loon-eye loon-eye-right" />
          </div>
          <div
            className="loon-nose-mouth-group"
            style={{ transform: `translate(${gazeOffset.x}px, ${gazeOffset.y}px)` }}
          >
            <div className="loon-nose" />
            <div className="loon-mouth" />
          </div>
          <div className="loon-whiskers">
            <span className="loon-whisker loon-whisker-l1" />
            <span className="loon-whisker loon-whisker-l2" />
            <span className="loon-whisker loon-whisker-l3" />
            <span className="loon-whisker loon-whisker-r1" />
            <span className="loon-whisker loon-whisker-r2" />
            <span className="loon-whisker loon-whisker-r3" />
          </div>
        </div>
      </div>
    </div>
  );
}
