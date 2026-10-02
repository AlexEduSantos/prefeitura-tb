"use client";
import { useGalleryViewModel } from "@/app/viewmodel/gallery.viewmodal";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "motion/react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function MainCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { galleryList: galleries, isLoadingGallery } = useGalleryViewModel();

  const mainGallery = galleries?.find((g) => g.title === "Banner Principal");
  const slides = mainGallery?.slides ?? [];
  const totalSlides = slides.length;

  const nextSlide = () => {
    if (totalSlides === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (totalSlides === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play — pausa no hover
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides, currentIndex]);

  // Reset do índice se a galeria mudar
  useEffect(() => {
    setCurrentIndex(0);
  }, [mainGallery?.id]);

  if (isLoadingGallery) return <Skeleton className="w-full h-72 md:h-96" />;
  if (!mainGallery || totalSlides === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section className="w-full max-w-7xl mx-auto px-2 xl:px-0">
      <div
        className="w-full h-50 md:h-96 aspect-video rounded-lg overflow-hidden relative bg-muted/20 group shadow ring-1 ring-border/10 "
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slides animados */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className={cn(
              "absolute inset-0",
              currentSlide.link && "cursor-pointer",
            )}
            onClick={() => {
              if (currentSlide.link) {
                window.open(currentSlide.link, "_blank", "noopener,noreferrer");
              }
            }}
          >
            <Image
              loader={() =>
                `${process.env.NEXT_PUBLIC_API_URL}/media/file/${currentSlide.media.key}`
              }
              unoptimized
              src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${currentSlide.media.key}`}
              alt={currentSlide.caption ?? mainGallery.title ?? "Slide"}
              fill
              className={`object-cover ${currentSlide.link && "cursor-pointer"}`}
              priority={currentIndex === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
            />

            {currentSlide.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-r from-black/60  to-transparent text-white px-4 py-2 text-left text-sm md:text-base backdrop-blur-sm">
                {currentSlide.caption}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Setas de navegação */}
        {totalSlides > 1 && (
          <>
            <Button
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-0 h-10 w-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
              onClick={prevSlide}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-0 h-10 w-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
              onClick={nextSlide}
              aria-label="Próximo slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Indicadores — agora dentro do container, mas com z-index acima da imagem */}
        {totalSlides > 1 && (
          <div className="absolute top-2 right-2 flex justify-center gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={cn(
                  "h-2 rounded-full transition-all min-w-0 p-0",
                  currentIndex === i
                    ? "sm:w-8 w-3 bg-primary"
                    : "w-2 bg-white/60 hover:bg-white/90",
                )}
                aria-label={`Ir para slide ${i + 1}`}
                aria-current={currentIndex === i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
