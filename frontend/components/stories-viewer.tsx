"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { IStories, IStoriesItem } from "@/app/type/stories";

export interface StoriesViewerProps {
  stories: IStories | null;
  open: boolean;
  onClose: () => void;
  /**
   * Duração de cada story em milissegundos (padrão: 5000ms = 5s)
   */
  duration?: number;
}

export function StoriesViewer({
  stories,
  open,
  onClose,
  duration = 5000,
}: StoriesViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isPaused = isManualPaused || isHolding;

  // Barra de progresso do item atual (DOM direto para 60fps sem engasgos)
  const activeProgressBarRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Refs de controle de tempo e estado
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  // Refs de controle do toque / clique e gesto swipe
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<number>(0);
  const isLongPressRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sincroniza refs para acesso imediato sem re-trigger desnecessário
  onCloseRef.current = onClose;
  isPausedRef.current = isPaused;
  currentIndexRef.current = currentIndex;

  // Garante portal apenas no cliente (evita hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Itens válidos do story ou fallback para a capa se não houver itens
  const items: Array<Partial<IStoriesItem> & { isCoverFallback?: boolean }> =
    stories?.items && stories.items.length > 0
      ? stories.items
      : stories?.cover
      ? [
          {
            id: `cover-${stories.id}`,
            caption: stories.description || stories.title,
            media: stories.cover,
            isCoverFallback: true,
          } as any,
        ]
      : [];

  const totalItems = items.length;
  const currentItem = items[currentIndex];

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopAnimation();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    startTimeRef.current = null;
    elapsedRef.current = 0;
    if (activeProgressBarRef.current) {
      activeProgressBarRef.current.style.width = "0%";
    }
    // Garante que o onClose é disparado fora do ciclo de render atual
    setTimeout(() => {
      onCloseRef.current();
    }, 0);
  }, [stopAnimation]);

  const handleNext = useCallback(() => {
    stopAnimation();
    startTimeRef.current = null;
    elapsedRef.current = 0;
    if (activeProgressBarRef.current) {
      activeProgressBarRef.current.style.width = "0%";
    }

    if (currentIndexRef.current < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [stopAnimation, totalItems, handleClose]);

  const handlePrev = useCallback(() => {
    stopAnimation();
    startTimeRef.current = null;
    elapsedRef.current = 0;
    if (activeProgressBarRef.current) {
      activeProgressBarRef.current.style.width = "0%";
    }

    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return 0;
    });
  }, [stopAnimation]);

  // Abertura segura de links externos
  const handleOpenLink = useCallback(() => {
    if (!currentItem?.link) return;
    setIsManualPaused(true);
    let target = currentItem.link.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }, [currentItem?.link]);

  // Reset do índice e estados quando abrir novo story
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setIsManualPaused(false);
      setIsHolding(false);
      startTimeRef.current = null;
      elapsedRef.current = 0;
    } else {
      stopAnimation();
    }
  }, [open, stories?.id, stopAnimation]);

  // Controle de reprodução de vídeo sincronizado com a pausa
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, currentIndex]);

  // Loop de animação contínua e suave da barra de progresso
  useEffect(() => {
    if (!open || totalItems === 0) return;

    // Reset visual da barra para o novo item
    if (activeProgressBarRef.current) {
      const pct = (elapsedRef.current / duration) * 100;
      activeProgressBarRef.current.style.width = `${pct}%`;
    }

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      if (!isPausedRef.current) {
        elapsedRef.current += delta;
        const pct = Math.min((elapsedRef.current / duration) * 100, 100);

        if (activeProgressBarRef.current) {
          activeProgressBarRef.current.style.width = `${pct}%`;
        }

        if (elapsedRef.current >= duration) {
          handleNext();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimestamp = performance.now();
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      stopAnimation();
    };
  }, [open, currentIndex, duration, totalItems, handleNext, stopAnimation]);

  // Handlers para clique, swipe-up e pressão longa (> 500ms pausa, não avança/retrocede)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pressStartRef.current = Date.now();
    isLongPressRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsHolding(true);
    }, 500);
  };

  const handlePointerUp = (e: React.PointerEvent, action: "prev" | "next") => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    const elapsed = Date.now() - pressStartRef.current;
    const wasLong = isLongPressRef.current || elapsed >= 500;

    setIsHolding(false);

    // Detecção de arrasto de baixo para cima (bottom-to-top swipe)
    const deltaY = pointerStartPosRef.current.y - e.clientY; // positivo = subiu
    const deltaX = Math.abs(e.clientX - pointerStartPosRef.current.x);

    // Se arrastou para cima pelo menos 50px e o movimento foi vertical
    if (deltaY > 50 && deltaY > deltaX && currentItem?.link) {
      handleOpenLink();
      return;
    }

    // Se NÃO foi long press nem swipe, dispara navegação normal
    if (!wasLong) {
      if (action === "prev") {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsHolding(false);
    isLongPressRef.current = false;
  };

  // Suporte adicional a swipe touch direto no container
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = touchStartYRef.current - endY; // positivo se subiu
    const deltaX = Math.abs(touchStartXRef.current - endX);

    if (deltaY > 50 && deltaY > deltaX && currentItem?.link) {
      handleOpenLink();
    }
    touchStartYRef.current = null;
    touchStartXRef.current = null;
  };

  // Atalhos de teclado (Escape, setas, barra de espaço)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsManualPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose, handleNext, handlePrev]);

  // Previne scroll de fundo quando o viewer estiver aberto
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!mounted || !open || !stories) return null;

  const coverUrl = stories.cover?.key
    ? `${process.env.NEXT_PUBLIC_API_URL}/media/file/${stories.cover.key}`
    : null;

  const currentMediaUrl = currentItem?.media?.key
    ? `${process.env.NEXT_PUBLIC_API_URL}/media/file/${currentItem.media.key}`
    : coverUrl;

  const isVideo =
    currentItem?.media?.mime_type?.startsWith("video/") ||
    currentItem?.media?.key?.match(/\.(mp4|webm|mov|ogg)$/i);

  const content = (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none transition-all cursor-pointer"
    >
      {/* Botão de Fechar Geral no Canto Superior Direito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Fechar stories"
        className="cursor-pointer absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur transition shadow-md hover:scale-105 active:scale-95"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Seta Esquerda (Desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Story anterior"
          className="cursor-pointer hidden sm:flex items-center justify-center absolute left-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur transition hover:scale-110 active:scale-95 shadow-lg"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Seta Direita (Desktop) */}
      {currentIndex < totalItems - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Próximo story"
          className="cursor-pointer hidden sm:flex items-center justify-center absolute right-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur transition hover:scale-110 active:scale-95 shadow-lg"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Container Principal do Story (Estilo Mobile / Meta Stories) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full sm:h-[92vh] sm:max-h-225 sm:w-auto sm:aspect-9/16 sm:rounded-2xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl ring-1 ring-white/10 cursor-default"
      >
        {/* Áreas de Toque/Clique para Navegação: Esquerda (50%) e Direita (50%) */}
        <div className="absolute inset-0 z-20 flex">
          {/* Metade Esquerda: Retroceder */}
          <div
            className="w-1/2 h-full cursor-pointer touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, "prev")}
            onPointerLeave={handlePointerCancel}
            onPointerCancel={handlePointerCancel}
            aria-label="Story anterior"
          />
          {/* Metade Direita: Avançar */}
          <div
            className="w-1/2 h-full cursor-pointer touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, "next")}
            onPointerLeave={handlePointerCancel}
            onPointerCancel={handlePointerCancel}
            aria-label="Próximo story"
          />
        </div>

        {/* Topo: Barras de Progresso e Header do Story */}
        <div className="relative z-30 p-3 sm:p-4 bg-linear-to-b from-black/80 via-black/40 to-transparent flex flex-col gap-2.5 pointer-events-auto">
          {/* Linha das Barras de Progresso */}
          <div className="flex items-center gap-1.5 w-full">
            {items.map((_, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={idx}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm"
                >
                  <div
                    ref={isCurrent ? activeProgressBarRef : null}
                    className="h-full bg-white rounded-full"
                    style={{
                      width: isPast ? "100%" : isCurrent ? "0%" : "0%",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Cabeçalho do Story (Avatar, Título, Controles) */}
          <div className="flex items-center justify-between text-white mt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              {coverUrl ? (
                <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary shrink-0">
                  <Image
                    loader={() => coverUrl}
                    src={coverUrl}
                    alt={stories.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs ring-2 ring-white/30 shrink-0">
                  {stories.title.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm leading-tight truncate text-white drop-shadow-sm">
                  {stories.title}
                </span>
                <span className="text-[11px] text-white/70 truncate">
                  {currentIndex + 1} de {totalItems}
                </span>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-1">
              {/* Botão Toggle Pausar/Continuar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManualPaused((prev) => !prev);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                title={isPaused ? "Continuar" : "Pausar"}
                aria-label={isPaused ? "Continuar" : "Pausar"}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-white" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>

              {isVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                  title={isMuted ? "Ativar som" : "Desativar som"}
                  aria-label={isMuted ? "Ativar som" : "Desativar som"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer sm:hidden"
                title="Fechar"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mídia Central (Imagem ou Vídeo) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          {currentMediaUrl ? (
            isVideo ? (
              <video
                ref={videoRef}
                src={currentMediaUrl}
                autoPlay
                playsInline
                muted={isMuted}
                loop={false}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  loader={() => currentMediaUrl}
                  src={currentMediaUrl}
                  alt={
                    currentItem?.media?.altText ||
                    currentItem?.caption ||
                    stories.title
                  }
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            )
          ) : (
            <div className="text-white/60 text-sm">Sem mídia disponível</div>
          )}
        </div>

        {/* Rodapé: Legenda e Botão de Link */}
        {currentItem?.caption || currentItem?.link ? (
          <div className="relative z-30 p-4 pt-8 bg-linear-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center gap-2 pointer-events-auto">
            {currentItem?.caption && (
              <p className="text-white text-sm text-center line-clamp-3 drop-shadow px-2">
                {currentItem.caption}
              </p>
            )}

            {currentItem?.link && (
              <div className="flex flex-col items-center justify-center pt-1">
                {/* Botão Desktop com ChevronUp */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLink();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white text-xs font-semibold backdrop-blur-md transition shadow cursor-pointer border border-white/20"
                  title="Abrir link"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Acessar link</span>
                </button>

                {/* Indicador Mobile com ChevronUp (Arrastar para cima) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLink();
                  }}
                  className="sm:hidden flex flex-col items-center text-white/90 hover:text-white transition active:scale-95 cursor-pointer pb-1"
                >
                  <ChevronUp className="w-5 h-5 animate-bounce stroke-2" />
                  <span className="text-[11px] font-medium tracking-wide drop-shadow">
                    Arraste para cima
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-6 pointer-events-none" />
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
