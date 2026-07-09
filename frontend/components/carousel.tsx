"use client";

import { IGalleryImage } from "@/app/type/gallery";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  slides: IGalleryImage[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

export function Carousel({
  slides,
  className,
  autoPlay = true,
  interval = 5000,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };
  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length, currentIndex]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">Nenhum slide disponível</p>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: { duration: 0.3 },
    }),
  };

  const imageLoader = (src: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/media/file/${src}`;
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Container do carrossel */}
      <div className="relative overflow-hidden rounded-xl bg-muted/10 aspect-video">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            className={`absolute inset-0 ${slides[currentIndex].link ? `cursor-pointer` : ``}`}
            onClick={() => {
              if (slides[currentIndex].link) {
                window.open(slides[currentIndex].link, "_blank");
              }
            }}
          >
            <Image
              loader={() => imageLoader(slides[currentIndex].media.key)}
              src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${slides[currentIndex].media.key}`}
              alt={slides[currentIndex].caption ?? "Slide"}
              fill
              className="object-cover"
              priority
            />
            {slides[currentIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center text-sm">
                {slides[currentIndex].caption}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navegação - setas laterais */}
        {slides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-0 h-10 w-10 backdrop-blur-sm"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-0 h-10 w-10 backdrop-blur-sm"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Indicadores (dots) */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={cn(
                "h-2 rounded-full transition-all p-0 min-w-0",
                currentIndex === i
                  ? "w-8 bg-primary"
                  : "w-2 bg-gray-300 hover:bg-gray-400",
              )}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
