"use client";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import Image from "next/image";
import { sortByDateDesc } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton"; // Assumindo que você tem um componente Skeleton
import { useMemo } from "react";
import { IMedia } from "@/app/type/media";
import { useRouter } from "next/navigation";
import { BlockHeader } from "./block-header";

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
      className="object-cover object-top"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Componente para o artigo em destaque
function FeaturedArticle({ article }: { article: any }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 sm:gap-4 w-full group">
      <div
        className="sm:max-h-168 sm:min-h-128 max-h-60 min-h-48 w-full rounded-lg relative overflow-hidden group-hover:cursor-pointer group-hover:scale-101 transition-transform duration-300"
        onClick={() => {
          router.push(`/noticias/${article.slug}`);
        }}
      >
        <ArticleImage coverData={article.cover} alt={article.title} />
      </div>
      <h3 className="w-full bg-primary rounded-lg sm:h-32 min-h-16 shadow text-primary-foreground sm:text-3xl text-xl font-semibold sm:p-6 p-2 line-clamp-2 group-hover:cursor-pointer group-hover:scale-101 transition-transform duration-300">
        {article.title}
      </h3>
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
      return { featuredArticle: null, recentArticles: [], hasSidebar: false };
    }

    const features = article.filter((article) => article.featured);
    const recent = sortByDateDesc(article).slice(0, 3);

    return {
      featuredArticle: features.length > 0 ? features[0] : null,
      recentArticles: recent,
      hasSidebar: recent.length === 3,
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
        {/* Artigo em destaque */}
        {featuredArticle && featuredArticle.coverId && (
          <div className={hasSidebar ? "w-full sm:w-3/4" : "w-full sm:w-full"}>
            <FeaturedArticle article={featuredArticle} />
          </div>
        )}

        {/* Sidebar com artigos recentes */}
        {hasSidebar && (
          <div className="w-full sm:w-1/4 grid sm:grid-rows-3 sm:grid-cols-1 grid-cols-3 gap-2 sm:gap-4">
            {recentArticles.map((item) => (
              <SmallArticleCard key={item.id} article={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
