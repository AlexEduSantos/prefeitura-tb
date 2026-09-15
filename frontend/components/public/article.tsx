"use client";

import { useArticleById } from "@/app/viewmodel/article.viewmodel";
import { LexicalViewer } from "@/components/public/article-body-visualizer";
import { GaleryView } from "@/components/public/gallery-viewer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Printer, Send, Share2 } from "lucide-react";
import Image from "next/image";

interface ArticleViewerProps {
  slug: string;
}

export default function ArticleViewer({ slug }: ArticleViewerProps) {
  const { article, isLoading, isError } = useArticleById(slug);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (isError) {
    return <div>Erro ao carregar notícia</div>;
  }

  return (
    <Card className="p-4 gap-2">
      {/* Breadcrumb - links navigate */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/noticias">Notícias</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-50 line-clamp-1 text-primary">
              {article?.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Autor - Data */}
      <div className="w-full flex gap-2 justify-between items-center">
        <div className="w-full flex gap-2 items-center">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <span>Por {article?.author?.name}</span>
          <div className="text-muted-foreground text-md">
            {format(
              new Date(article?.createdAt || ""),
              "EEEE, dd 'de' MMMM 'de' yyyy  |  'Horário' H:mm",
              {
                locale: ptBR,
              },
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Printer className="size-4 stroke-1 hover:stroke-2 cursor-pointer text-primary" />
          <Mail className="size-4 stroke-1 hover:stroke-2 cursor-pointer text-primary" />
          <Send className="size-4 stroke-1 hover:stroke-2 cursor-pointer text-primary" />
          <Share2 className="size-4 stroke-1 hover:stroke-2 cursor-pointer text-primary" />
        </div>
      </div>

      {/* Content */}
      <CardTitle className="text-2xl">{article?.title}</CardTitle>
      <CardContent className="p-0 gap-2 flex flex-col">
        {article?.headline && (
          <h3 className="text-muted-foreground leading-snug italic">
            {article.headline}
          </h3>
        )}
        <div className="relative max-h-100 min-h-60 aspect-3/2 w-full overflow-hidden rounded-lg">
          <Image
            loader={() =>
              `${process.env.NEXT_PUBLIC_API_URL}/media/file/${article?.cover?.key}`
            }
            priority
            unoptimized
            loading="eager"
            src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${article?.cover?.key}`}
            alt={article?.title || ""}
            fill
            className="transition-transform duration-300 group-hover:scale-105 object-cover"
          />
        </div>
        <div className="block">
          <LexicalViewer content={article?.body || {}} />
        </div>
        {/* Galeria de Imagens */}
        {article?.galleryId && article?.gallery && (
          <GaleryView gallery={article?.gallery || {}} />
        )}
      </CardContent>
    </Card>
  );
}
