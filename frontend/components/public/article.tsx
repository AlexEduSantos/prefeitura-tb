"use client";

import { useArticleBySlug } from "@/app/viewmodel/article.viewmodel";
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
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link2Icon, Mail, Printer } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { FacebookIcon } from "../icons/facebook-icon";
import DynamicIcon from "../icons/dynamic-icon";
import { useRouter } from "next/navigation";

interface ArticleViewerProps {
  slug: string;
}

export default function ArticleViewer({ slug }: ArticleViewerProps) {
  const router = useRouter();
  const { article, isLoading, isError } = useArticleBySlug(slug);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (isError || !article) {
    return <div>Erro ao carregar notícia</div>;
  }

  const relativeDate = formatDistanceToNow(new Date(article?.updatedAt || ""), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="p-4 gap-4 w-full max-w-2xl mx-auto my-2 shadow-none border-none ring-0 bg-background">
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
          {article && article.categories && (
            <BreadcrumbItem>
              <BreadcrumbLink href={`/noticias/${article.categories[0].slug}`}>
                {article.categories[0].title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-50 line-clamp-1 text-primary">
              {article?.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Content */}
      <CardTitle className="sm:text-4xl font-bold text-xl">
        {article?.title}
      </CardTitle>
      <CardContent className="p-0 gap-4 flex flex-col">
        {article?.headline && (
          <h3 className="text-muted-foreground leading-snug italic">
            {article.headline}
          </h3>
        )}
        <div className="text-xs space-y-1">
          <p>
            Por{" "}
            <span className="font-bold text-primary">
              {article?.author?.name}, {article?.author?.organization?.title}
            </span>
          </p>
          <p className="text-muted-foreground">
            {format(
              new Date(article?.createdAt || ""),
              "EEEE, dd 'de' MMMM 'de' yyyy  'às' H:mm",
              {
                locale: ptBR,
              },
            )}{" "}
            {article?.createdAt !== article?.updatedAt && (
              <span>| atualizado {relativeDate}</span>
            )}
          </p>
        </div>
        <div>
          <div className="relative max-h-100 min-h-60 aspect-3/2 w-full overflow-hidden rounded-lg ">
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
          <small className="rounded text-muted-foreground">
            Foto: {article.cover?.title || article.cover?.altText}
          </small>
        </div>
        {/* Share buttons */}
        <div className="grid sm:grid-cols-5 sm:grid-rows-1 grid-cols-3 grid-rows-2 gap-2">
          <Button
            variant={"secondary"}
            className="flex gap-2 flex-1 group text-muted-foreground hover:bg-blue-600 hover:text-white transition-all duration-100 cursor-pointer"
          >
            <FacebookIcon className="w-4 h-4 fill-blue-600 group-hover:fill-white" />{" "}
            Facebook
          </Button>
          <Button
            variant={"secondary"}
            className="flex gap-2 flex-1 group text-muted-foreground hover:bg-green-600 hover:text-white transition-all duration-100 cursor-pointer"
          >
            <DynamicIcon
              src="/icons/whatsapp.svg"
              className="w-4 h-4 fill-green-600 group-hover:fill-white"
            />
            Whatsapp
          </Button>
          <Button
            variant={"secondary"}
            className="flex gap-2 flex-1 group hover:bg-primary hover:text-white transition-all duration-100 cursor-pointer text-muted-foreground"
          >
            <Mail className="text-primary group-hover:text-white" /> Email
          </Button>
          <Button
            variant={"secondary"}
            className="flex gap-2 flex-1 group hover:bg-primary hover:text-white transition-all duration-100 cursor-pointer text-muted-foreground"
          >
            <Link2Icon className="text-primary group-hover:text-white" /> Copiar
            link
          </Button>
          <Button
            variant={"secondary"}
            className="flex gap-2 flex-1 group hover:bg-primary hover:text-white transition-all duration-100 cursor-pointer text-muted-foreground"
          >
            <Printer className="text-primary group-hover:text-white" /> Imprimir
          </Button>
        </div>
        {/* Article body */}
        <div className="block">
          <LexicalViewer content={article?.body || {}} />
        </div>
        {/* Galeria de Imagens */}
        {article?.galleryId && article?.gallery && (
          <GaleryView gallery={article?.gallery || {}} />
        )}

        {/* Article tags */}
        <div className="flex flex-col flex-wrap gap-2 mt-4">
          <h3 className="text-lg font-bold text-primary">Tópicos</h3>
          {article?.tags?.map((tag, index) => (
            <div
              key={index}
              onClick={() => router.push(`/noticias?tag=${tag}`)}
              className="text-sm w-fit rounded-lg! p-2 bg-background border border-border capitalize cursor-pointer hover:border-primary transition-colors"
            >
              {tag}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
