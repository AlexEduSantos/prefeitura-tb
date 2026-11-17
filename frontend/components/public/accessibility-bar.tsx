"use client";

import { useCallback, useEffect, useState } from "react";
import { Contrast, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

const FONT_SCALE_STORAGE_KEY = "pmtb:accessibility:font-scale";
const CONTRAST_STORAGE_KEY = "pmtb:accessibility:high-contrast";

export function AccessibilityBar() {
  const [fontScale, setFontScale] = useState<number>(100);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  const applyFontScale = useCallback((scale: number) => {
    const clamped = Math.min(130, Math.max(85, scale));
    setFontScale(clamped);
    document.documentElement.style.fontSize = `${clamped}%`;
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    } catch {
      // Ignora indisponibilidade de localStorage
    }
  }, []);

  const applyHighContrast = useCallback((enabled: boolean) => {
    setHighContrast(enabled);
    document.documentElement.classList.toggle("high-contrast", enabled);
    try {
      localStorage.setItem(CONTRAST_STORAGE_KEY, String(enabled));
    } catch {
      // Ignora indisponibilidade de localStorage
    }
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

  // Restaura preferências salvas ao montar
  useEffect(() => {
    try {
      const savedScale = Number(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
      if (Number.isFinite(savedScale) && savedScale >= 85 && savedScale <= 130) {
        setFontScale(savedScale);
        document.documentElement.style.fontSize = `${savedScale}%`;
      }
      const savedContrast = localStorage.getItem(CONTRAST_STORAGE_KEY) === "true";
      if (savedContrast) {
        setHighContrast(true);
        document.documentElement.classList.add("high-contrast");
      }
    } catch {
      // Ignora erro de acesso ao localStorage
    }
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

  return (
    <nav
      aria-label="Barra de Acessibilidade eMAG"
      className="w-full bg-slate-900 text-white text-xs border-b border-white/15"
    >
      <div className="w-full max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Links de Salto e Atalhos eMAG */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#main-content"
            accessKey="1"
            onClick={(e) => {
              e.preventDefault();
              focusSection("main-content");
            }}
            className="hover:underline focus:outline-2 focus:outline-white rounded px-1"
          >
            Ir para conteúdo [Alt+1]
          </a>
          <a
            href="#main-nav"
            accessKey="2"
            onClick={(e) => {
              e.preventDefault();
              focusSection("main-nav");
            }}
            className="hover:underline focus:outline-2 focus:outline-white rounded px-1"
          >
            Ir para menu [Alt+2]
          </a>
          <a
            href="#main-search"
            accessKey="3"
            onClick={(e) => {
              e.preventDefault();
              focusSection("main-search");
            }}
            className="hover:underline focus:outline-2 focus:outline-white rounded px-1"
          >
            Ir para busca [Alt+3]
          </a>
          <a
            href="#main-footer"
            accessKey="4"
            onClick={(e) => {
              e.preventDefault();
              focusSection("main-footer");
            }}
            className="hover:underline focus:outline-2 focus:outline-white rounded px-1"
          >
            Ir para rodapé [Alt+4]
          </a>
        </div>

        {/* Controles de Fonte e Alto Contraste */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyFontScale(fontScale - 10)}
            aria-label="Diminuir fonte"
            title="Diminuir tamanho da fonte"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/15 cursor-pointer"
          >
            <ZoomOut className="size-3.5" />
            <span>A-</span>
          </button>
          <button
            type="button"
            onClick={() => applyFontScale(100)}
            aria-label="Restaurar tamanho da fonte"
            title="Fonte padrão"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/15 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>A</span>
          </button>
          <button
            type="button"
            onClick={() => applyFontScale(fontScale + 10)}
            aria-label="Aumentar fonte"
            title="Aumentar tamanho da fonte"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/15 cursor-pointer"
          >
            <ZoomIn className="size-3.5" />
            <span>A+</span>
          </button>

          <span className="w-px h-3.5 bg-white/25 mx-0.5" />

          <button
            type="button"
            onClick={() => applyHighContrast(!highContrast)}
            aria-pressed={highContrast}
            aria-label="Alternar alto contraste"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/15 cursor-pointer font-medium"
          >
            <Contrast className="size-3.5" />
            <span>Alto Contraste</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
