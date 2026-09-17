"use client";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import Image from "next/image";
import { sortByDateDesc } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton"; // Assumindo que você tem um componente Skeleton
import { useMemo } from "react";
import { IMedia } from "@/app/type/media";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col gap-4 w-full group">
      <div
        className="max-h-168 min-h-128 w-full rounded-lg relative overflow-hidden group-hover:cursor-pointer group-hover:scale-101 transition-transform duration-300"
        onClick={() => {
          router.push(`/noticias/${article.slug}`);
        }}
      >
        <ArticleImage coverData={article.cover} alt={article.title} />
      </div>
      <h3 className="w-full bg-primary rounded-lg h-32 shadow text-primary-foreground text-3xl font-semibold p-6 line-clamp-2 group-hover:cursor-pointer group-hover:scale-101 transition-transform duration-300">
        {article.title}
      </h3>
    </div>
  );
}

// Componente para artigos pequenos na sidebar
function SmallArticleCard({ article }: { article: any }) {
  const router = useRouter();

  return (
    <div className="h-full rounded-lg relative overflow-hidden shadow group cursor-pointer hover:scale-102 transition-transform duration-300">
      <div
        className="w-full h-3/4 relative overflow-hidden"
        onClick={() => {
          router.push(`/noticias/${article.slug}`);
        }}
      >
        <ArticleImage coverData={article.cover} alt={article.title} />
      </div>
      <div
        className="w-full h-1/4 bg-card text-primary px-3 py-2 flex items-center gap-2"
        onClick={() => router.push(`/noticias/${article.slug}`)}
      >
        <span className="h-6 w-1 bg-primary rounded-full shrink-0" />
        <p className="line-clamp-2 text-sm leading-tight font-medium group-hover:text-primary transition-colors">
          {article.title}
        </p>
      </div>
    </div>
  );
}

// Componente principal
export function ArticlesBlock() {
  const router = useRouter();
  const { article, isLoadingArticle, isErrorArticle } = ArticleViewModel();

  // Memoizar os artigos processados
  const { featuredArticle, recentArticles, hasSidebar } = useMemo(() => {
    if (!article || article.length === 0) {
      return { featuredArticle: null, recentArticles: [], hasSidebar: false };
    }

    const [first, ...rest] = article;
    const recent = sortByDateDesc(rest).slice(0, 3);

    return {
      featuredArticle: first,
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
    <section className="w-full max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="w-full flex items-center gap-2">
        <span className="h-5 w-1 bg-primary rounded-full" />
        <h3 className="uppercase text-nowrap tracking-widest text-sm">
          Últimas Notícias
        </h3>
        <span className="w-full h-px bg-muted-foreground/20 rounded-full" />
        <Button
          variant="ghost"
          className="text-xs text-primary text-nowrap hover:font-semibold hover:scale-105 hover:text-primary group transition-all duration-300 px-0 cursor-pointer"
          onClick={() => router.push("/noticias")}
        >
          Todas as notícias
          <ChevronRight />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="w-full flex gap-4">
        {/* Artigo em destaque */}
        {featuredArticle && featuredArticle.coverId && (
          <div className={hasSidebar ? "w-3/4" : "w-full"}>
            <FeaturedArticle article={featuredArticle} />
          </div>
        )}

        {/* Sidebar com artigos recentes */}
        {hasSidebar && (
          <div className="w-1/4 grid grid-rows-3 gap-4">
            {recentArticles.map((item) => (
              <SmallArticleCard key={item.id} article={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
