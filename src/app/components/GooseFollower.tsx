"use client";

import { useEffect, useState } from "react";

type Pos = { x: number; y: number };

export default function GooseFollower() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });

  useEffect(() => {
    const isTextInput = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement => {
      if (!el) return false;
      if (el instanceof HTMLTextAreaElement) return true;
      if (el instanceof HTMLInputElement) {
        const type = (el.type || "text").toLowerCase();
        return ["text", "search", "email", "url", "password", "number"].includes(type);
      }
      return false;
    };

    const updateForElement = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width + 8;
      const y = rect.top - 32;
      setPos({ x, y });
      setVisible(true);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (isTextInput(target)) {
        updateForElement(target);
      } else {
        setVisible(false);
      }
    };

    const handleInput = (event: Event) => {
      const target = event.target as Element | null;
      if (isTextInput(target)) {
        updateForElement(target);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (isTextInput(target)) {
        updateForElement(target);
      }
    };

    const handleFocusOut = () => {
      setVisible(false);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="goose-sticker"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
      }}
      aria-hidden="true"
    >
      <div className="goose-body" />
    </div>
  );
}

