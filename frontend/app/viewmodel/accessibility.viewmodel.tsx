"use client";

import { useCallback, useEffect, useState } from "react";

const FONT_SCALE_STORAGE_KEY = "pmtb:accessibility:font-scale";
const CONTRAST_STORAGE_KEY = "pmtb:accessibility:high-contrast";

export function useAccessibility() {
  // ✅ 1. Inicialização Preguiçosa (Lazy Initializer)
  // Lemos o valor apenas no cliente (typeof window) e sem useEffect
  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window === "undefined") return 100;
    try {
      const saved = Number(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
      if (Number.isFinite(saved) && saved >= 85 && saved <= 130) {
        document.documentElement.style.fontSize = `${saved}%`;
        return saved;
      }
    } catch {}
    return 100;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(CONTRAST_STORAGE_KEY) === "true";
      if (saved) {
        document.documentElement.classList.add("high-contrast");
      }
      return saved;
    } catch {}
    return false;
  });

  const applyFontScale = useCallback((scale: number) => {
    const clamped = Math.min(130, Math.max(85, scale));
    setFontScale(clamped);
    document.documentElement.style.fontSize = `${clamped}%`;
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    } catch {}
  }, []);

  const applyHighContrast = useCallback((enabled: boolean) => {
    setHighContrast(enabled);
    document.documentElement.classList.toggle("high-contrast", enabled);
    try {
      localStorage.setItem(CONTRAST_STORAGE_KEY, String(enabled));
    } catch {}
  }, []);

  const focusSection = useCallback((elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }
    el.focus({ preventScroll: false });
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Atalhos de teclado padrão eMAG (Alt + 1..4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      switch (e.key) {
        case "1":
          e.preventDefault();
          focusSection("main-content");
          break;
        case "2":
          e.preventDefault();
          focusSection("main-nav");
          break;
        case "3":
          e.preventDefault();
          focusSection("main-search");
          break;
        case "4":
          e.preventDefault();
          focusSection("main-footer");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusSection]);

  return {
    fontScale,
    highContrast,
    applyFontScale,
    applyHighContrast,
    focusSection,
  };
}
