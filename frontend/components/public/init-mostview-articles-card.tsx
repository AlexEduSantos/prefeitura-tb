"use client";

import { ExternalLink, Eye, Newspaper, RefreshCw, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UseTopNews } from "@/app/viewmodel/analytics.viewmodel";
import { TopNewsRange } from "@/app/type/analytics";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";

export function MostViewArticlesCard() {
  const { range, setRange, topNews, isLoading, isFetching, isError, refetch } =
    UseTopNews("week");

  return (
    <Card className="w-full shadow-xs">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Notícias Mais Visualizadas
                </CardTitle>
                {isFetching && !isLoading && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Top 5 artigos com maior tráfego no período selecionado
              </CardDescription>
            </div>
          </div>

          {/* Filtro por Período */}
          <Tabs
            value={range}
            onValueChange={(val) => setRange(val as TopNewsRange)}
            className="w-auto"
          >
            <TabsList className="h-9">
              <TabsTrigger value="day" className="text-xs px-3">
                Dia
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">
                Mês
              </TabsTrigger>
              <TabsTrigger value="year" className="text-xs px-3">
                Ano
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-3">
                Geral
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <p className="text-sm text-destructive font-medium">
              Não foi possível carregar as notícias mais visualizadas.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        ) : topNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
            <Trophy className="h-8 w-8 text-muted-foreground/40 mb-1" />
            <p className="text-sm font-medium">Nenhuma notícia encontrada</p>
            <p className="text-xs text-muted-foreground">
              Ainda não há acessos registrados a notícias no período
              selecionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto ">
            {/* Tabela Estruturada: Nome do artigo | Slug | Número de visualizações */}
            <Table className="w-full text-left text-sm p-0">
              <TableBody className="divide-y divide-border/40">
                {topNews.map((article, index) => {
                  const articleUrl = `/noticias/${article.slug}`;

                  return (
                    <TableRow
                      key={article.slug}
                      className="group hover:bg-muted-foreground/10 transition-colors duration-300 cursor-pointer"
                      onClick={() =>
                        window.open(articleUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      {/* Nome do Artigo */}
                      <TableCell className="py-3 px-3 align-middle rounded-l-lg ">
                        <a
                          href={articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-foreground group-hover:text-primary transition-colors  duration-300 line-clamp-2 leading-snug"
                        >
                          {article.title}
                        </a>
                        <span className="block text-[11px] text-muted-foreground font-mono mt-0.5 md:hidden truncate max-w-60">
                          /{article.slug}
                        </span>
                      </TableCell>

                      {/* Slug */}
                      <TableCell>
                        <p
                          className="text-sm font-mono text-muted-foreground truncate block max-w-50"
                          title={article.slug}
                        >
                          {article.slug}
                        </p>
                      </TableCell>

                      {/* Número de visualizações */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                            <Eye className="h-3.5 w-3.5 opacity-80" />
                            {article.views.toLocaleString("pt-BR")}
                          </span>
                          {article.visitors !== undefined &&
                            article.visitors > 0 && (
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {article.visitors}{" "}
                                {article.visitors === 1
                                  ? "visitante"
                                  : "visitantes"}
                              </span>
                            )}
                        </div>
                      </TableCell>

                      {/* Ícone de Link Externo */}
                      <TableCell className="rounded-r-lg text-muted-foreground/60 group-hover:text-primary transition-colors duration-300">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
