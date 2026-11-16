"use client";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import Image from "next/image";
import { sortByDateDesc } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton"; // Assumindo que você tem um componente Skeleton
import { useEffect, useMemo, useRef, useState } from "react";
import { IMedia } from "@/app/type/media";
import { useRouter } from "next/navigation";
import { BlockHeader } from "./block-header";
import { IArticle } from "@/app/type/article";
import { AnimatePresence, motion, PanInfo } from "motion/react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Componente para o loader da imagem
function ArticleImage({ coverData, alt }: { coverData: IMedia; alt: string }) {
  const imageLoader = (src: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/media/file/${src}`;
  };

  if (!coverData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-muted-foreground">Sem imagem</span>
      </div>
    );
  }

  return (
    <Image
      loader={() => imageLoader(coverData.key)}
      src={coverData.key}
      alt={alt || coverData.title}
      fill
      draggable={false}
      className="object-cover object-top select-none pointer-events-none"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Componente para o artigo em destaque
export function RecentArticles({
  recentArticles,
}: {
  recentArticles: IArticle[];
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 para direita, -1 para esquerda
  const [isPaused, setIsPaused] = useState(false);
  const isDraggingRef = useRef(false);

  const totalSlides = recentArticles.length;

  // Se não houver artigos, não renderiza nada
  if (totalSlides === 0) return null;

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleArticleClick = (slug: string) => {
    if (isDraggingRef.current) return;
    router.push(`/noticias/${slug}`);
  };

  // Autoplay de 10 segundos
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setInterval(nextSlide, 10000); // 10.000ms = 10 segundos
    return () => clearInterval(timer);
  }, [isPaused, totalSlides, currentIndex]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsPaused(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);

    const swipeThreshold = 40;
    const velocityThreshold = 400;

    // Deslizar para a esquerda -> próximo slide
    if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      nextSlide();
    }
    // Deslizar para a direita -> slide anterior
    else if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      prevSlide();
    }
  };

  // Variantes de animação para o Motion
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const currentArticle = recentArticles[currentIndex];

  return (
    <div
      className="relative w-full group h-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Container principal do Carrossel (Altura fixa para evitar pulos) */}
      <div className="relative w-full min-h-75 h-full sm:h-175 overflow-hidden rounded-lg touch-pan-y">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={totalSlides > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => {
              isDraggingRef.current = true;
              setIsPaused(true);
            }}
            onDragEnd={handleDragEnd}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex flex-col gap-2 sm:gap-4 cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {/* Imagem do Artigo */}
            <div
              className="sm:max-h-168 sm:min-h-140 max-h-75 min-h-48 w-full rounded-lg relative overflow-hidden cursor-pointer select-none"
              onClick={() => handleArticleClick(currentArticle.slug)}
            >
              <ArticleImage
                coverData={currentArticle.cover!}
                alt={currentArticle.title}
              />
            </div>

            {/* Título do Artigo */}
            <div className="w-full flex items-center-safe bg-primary rounded-lg sm:h-full min-h-16 shadow text-primary-foreground sm:text-3xl text-xl font-semibold sm:p-6 p-2 cursor-pointer hover:bg-primary/90 transition-colors select-none overflow-hidden">
              <h3
                className="line-clamp-2 "
                onClick={() => handleArticleClick(currentArticle.slug)}
              >
                {currentArticle.title}
              </h3>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Setas de Navegação */}
        {totalSlides > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 hover:text-white! text-white border-0 h-10 w-10 backdrop-blur-sm opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.stopPropagation(); // Evita clicar no link da imagem
                prevSlide();
              }}
            >
              <ChevronLeft className="h-5 w-5 group-hover:text-white!" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60  hover:text-white! text-white border-0 h-10 w-10 backdrop-blur-sm opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Indicadores (Pontinhos) na parte inferior */}
      {totalSlides > 1 && (
        <div className="absolute top-6 right-6 sm:top-6 flex justify-center gap-2 z-10">
          {recentArticles.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full transition-all p-0 min-w-0 shadow ring-1 ring-ring/20 ${
                currentIndex === i
                  ? "w-6 bg-primary"
                  : "w-2 bg-white hover:bg-white/80"
              }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para artigos pequenos na sidebar
function SmallArticleCard({ article }: { article: any }) {
  const router = useRouter();

  return (
    <div className="sm:h-full h-32 rounded-lg relative overflow-hidden shadow group cursor-pointer hover:scale-102 transition-transform duration-300">
      <div
        className="w-full sm:h-3/4 h-3/5 relative overflow-hidden"
        onClick={() => {
          router.push(`/noticias/${article.slug}`);
        }}
      >
        <ArticleImage coverData={article.cover} alt={article.title} />
      </div>
      <div
        className="w-full sm:h-1/4 h-2/5 bg-card text-primary sm:px-3 sm:py-2 p-2 flex sm:flex-row flex-col items-start sm:items-center sm:gap-2 gap-1"
        onClick={() => router.push(`/noticias/${article.slug}`)}
      >
        <span className="sm:h-6 sm:w-1 w-4 h-0.5 bg-primary rounded-full shrink-0" />
        <p className="line-clamp-2 sm:text-sm text-xs leading-tight font-medium group-hover:text-primary transition-colors ">
          {article.title}
        </p>
      </div>
    </div>
  );
}

// Componente principal
export function ArticlesBlock() {
  const { article, isLoadingArticle, isErrorArticle } = ArticleViewModel();

  // Memoizar os artigos processados
  const { featuredArticle, recentArticles, hasSidebar } = useMemo(() => {
    if (!article || article.length === 0) {
      return { featuredArticle: [], recentArticles: [], hasSidebar: false };
    }

    const features = article
      .filter((art: IArticle) => art.featured)
      .sort((a, b) =>
        b.createdAt.toString().localeCompare(a.createdAt.toString()),
      )
      .slice(0, 3);
    const recent = article
      .filter((art: IArticle) => !art.featured)
      .sort((a, b) =>
        b.createdAt.toString().localeCompare(a.createdAt.toString()),
      )
      .slice(0, 6);

    return {
      featuredArticle: features,
      recentArticles: recent,
      hasSidebar: features.length === 3,
    };
  }, [article]);

  // Estados de loading e erro
  if (isLoadingArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4">
        <div className="flex gap-4">
          <Skeleton className="w-3/4 h-96" />
          <div className="w-1/4 grid grid-rows-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </section>
    );
  }

  if (isErrorArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Erro ao carregar notícias. Tente novamente mais tarde.
        </div>
      </section>
    );
  }

  if (!article || article.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-2 xl:px-0">
      {/* Cabeçalho */}
      <BlockHeader
        title="Últimas Notícias"
        route="/noticias"
        button="Todas as notícias"
      />

      {/* Conteúdo */}
      <div className="w-full flex sm:flex-row flex-col gap-2 sm:gap-4">
        {/* Sidebar com artigos recentes */}
        <div
          className={`${hasSidebar ? "w-full sm:w-3/4" : "w-full sm:w-full"}`}
        >
          <RecentArticles recentArticles={recentArticles} />
        </div>
        {/* Artigo em destaque */}

        {hasSidebar && (
          <div className="w-full sm:w-1/4 grid sm:grid-rows-3 sm:grid-cols-1 grid-cols-3 gap-2 sm:gap-4">
            {featuredArticle.map((article: IArticle) => (
              <SmallArticleCard article={article} key={article.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
