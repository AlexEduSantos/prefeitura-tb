"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  usePublicArticlesViewModel,
  type PublicArticleSortOption,
  type PublicPaginationMode,
} from "@/app/viewmodel/article.viewmodel";
import { IArticle } from "@/app/type/article";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { format, startOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { extractTextFromLexical } from "@/lib/lexical-utils";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const TYPE_LABELS: Record<string, string> = {
  article: "Matéria",
  event: "Evento",
  note: "Nota",
};

const SORT_LABELS: Record<PublicArticleSortOption, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigas",
  title_asc: "Título (A–Z)",
  title_desc: "Título (Z–A)",
};

export function ArticleCard({ article }: { article: IArticle }) {
  const router = useRouter();

  const coverKey = article.cover?.key;
  const primaryCategory = article.categories?.[0]?.title;
  const typeLabel = TYPE_LABELS[article.type] || article.type;
  const rawDate = article.publicationDate || article.createdAt;
  const formattedDate = useMemo(() => {
    if (!rawDate) return null;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return null;
    return format(d, "dd 'de' MMM, yyyy", { locale: ptBR });
  }, [rawDate]);

  const summary = useMemo(() => {
    if (article.headline && article.headline.trim()) {
      return article.headline;
    }
    return extractTextFromLexical(article.body);
  }, [article.headline, article.body]);

  return (
    <article
      onClick={() => router.push(`/noticias/${article.slug}`)}
      className="flex flex-col rounded-xl overflow-hidden bg-card border border-border/60 shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer h-full"
    >
      {/* Imagem de Capa */}
      <div className="w-full h-48 relative overflow-hidden bg-muted shrink-0">
        {coverKey ? (
          <Image
            loader={() =>
              `${process.env.NEXT_PUBLIC_API_URL}/media/file/${coverKey}`
            }
            src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${coverKey}`}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground gap-1.5">
            <FileText className="size-8 opacity-40" />
            <span className="text-xs">Sem imagem de capa</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Badges sobre a imagem */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {primaryCategory ? (
            <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground text-[11px] font-medium px-2.5 py-0.5 shadow-xs truncate max-w-[70%]">
              {primaryCategory}
            </Badge>
          ) : (
            <span />
          )}
          {typeLabel && (
            <Badge
              variant="secondary"
              className="bg-black/60 text-white border-0 backdrop-blur-xs text-[10px] px-2 py-0.5 shrink-0"
            >
              {typeLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-foreground group-hover:text-primary text-lg font-bold leading-snug line-clamp-2 transition-colors">
            {article.title}
          </h3>
          {summary && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        {/* Metadados inferiores (Data e Autor) */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {formattedDate ? (
            <span className="flex items-center gap-1.5 truncate">
              <CalendarIcon className="size-3.5 shrink-0 text-primary/80" />
              {formattedDate}
            </span>
          ) : (
            <span />
          )}
          {article.author?.name && (
            <span
              className="flex items-center gap-1 truncate max-w-[50%]"
              title={`Autor: ${article.author.name}`}
            >
              <User className="size-3.5 shrink-0 text-primary/80" />
              <span className="truncate">{article.author.name}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

interface ToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  authorFilter: string;
  setAuthorFilter: (val: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  sortBy: PublicArticleSortOption;
  setSortBy: (val: PublicArticleSortOption) => void;
  limit: number;
  setLimit: (val: number) => void;
  paginationMode: PublicPaginationMode;
  setPaginationMode: (mode: PublicPaginationMode) => void;
  availableCategories: { id: string; title: string }[];
  availableAuthors: { id: string; name: string }[];
  activeFilterCount: number;
  clearAllFilters: () => void;
}

function Toolbar({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  typeFilter,
  setTypeFilter,
  authorFilter,
  setAuthorFilter,
  dateRange,
  setDateRange,
  sortBy,
  setSortBy,
  limit,
  setLimit,
  paginationMode,
  setPaginationMode,
  availableCategories,
  availableAuthors,
  activeFilterCount,
  clearAllFilters,
}: ToolbarProps) {
  const formattedDateRange = useMemo(() => {
    if (!dateRange?.from) return null;
    if (dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(
        dateRange.to,
        "dd/MM/yyyy",
        { locale: ptBR },
      )}`;
    }
    return format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
  }, [dateRange]);

  const handleQuickRange = (days: number | "month" | "today") => {
    const now = new Date();
    if (days === "today") {
      setDateRange({ from: now, to: now });
    } else if (days === "month") {
      setDateRange({ from: startOfMonth(now), to: now });
    } else {
      setDateRange({ from: subDays(now, days), to: now });
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
      {/* Linha 1: Busca + Ordenação + Modo de exibição / Limite */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar notícias por título ou subtítulo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              title="Limpar busca"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Ordenação */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as PublicArticleSortOption)}
          >
            <SelectTrigger className="w-full sm:w-48 bg-background">
              <ArrowUpDown className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigas</SelectItem>
              <SelectItem value="title_asc">Título (A–Z)</SelectItem>
              <SelectItem value="title_desc">Título (Z–A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Modo de paginação */}
          <Select
            value={paginationMode}
            onValueChange={(val) =>
              setPaginationMode(val as PublicPaginationMode)
            }
          >
            <SelectTrigger
              className="w-full sm:w-44 bg-background"
              title="Modo de navegação"
            >
              <Layers className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <SelectValue placeholder="Navegação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pagination">Paginação</SelectItem>
              <SelectItem value="infinite">Carregamento infinito</SelectItem>
            </SelectContent>
          </Select>

          {/* Quantidade por página */}
          <Select
            value={String(limit)}
            onValueChange={(val) => setLimit(Number(val))}
          >
            <SelectTrigger
              className="w-28 bg-background shrink-0"
              title="Itens por página"
            >
              <SelectValue placeholder="9 / pág" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 / pág</SelectItem>
              <SelectItem value="9">9 / pág</SelectItem>
              <SelectItem value="12">12 / pág</SelectItem>
              <SelectItem value="24">24 / pág</SelectItem>
              <SelectItem value="48">48 / pág</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: Filtros (Categoria, Tipo, Autor, Range de Datas com Shadcn Calendar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Filtro de Categoria */}
        <Select
          value={categoryFilter || "all"}
          onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full bg-background">
            <FolderKanban className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Tipo */}
        <Select
          value={typeFilter || "all"}
          onValueChange={(val) => setTypeFilter(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full bg-background">
            <Tag className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="article">Matéria</SelectItem>
            <SelectItem value="event">Evento</SelectItem>
            <SelectItem value="note">Nota</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Autor */}
        <Select
          value={authorFilter || "all"}
          onValueChange={(val) => setAuthorFilter(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full bg-background">
            <User className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
            <SelectValue placeholder="Todos os autores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os autores</SelectItem>
            {availableAuthors.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                {author.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Range de Datas (Shadcn Calendar) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-background cursor-pointer truncate",
                !dateRange?.from && "text-muted-foreground",
                dateRange?.from && "border-primary/50 text-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {formattedDateRange || "Período de publicação"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b border-border flex flex-wrap items-center gap-1.5 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="cursor-pointer"
                onClick={() => handleQuickRange("today")}
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="cursor-pointer"
                onClick={() => handleQuickRange(7)}
              >
                Últimos 7 dias
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="cursor-pointer"
                onClick={() => handleQuickRange(30)}
              >
                Últimos 30 dias
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="cursor-pointer"
                onClick={() => handleQuickRange("month")}
              >
                Este mês
              </Button>
            </div>

            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />

            {(dateRange?.from || dateRange?.to) && (
              <div className="p-3 border-t border-border flex items-center justify-between bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  {formattedDateRange}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setDateRange(undefined)}
                  className="text-xs text-destructive hover:text-destructive cursor-pointer"
                >
                  Limpar datas
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Linha 3: Chips de Filtros Ativos */}
      {(activeFilterCount > 0 ||
        search.trim().length > 0 ||
        sortBy !== "recent") && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 text-xs">
          <span className="text-muted-foreground font-medium mr-1">
            Ativos:
          </span>

          {search.trim().length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>Busca: &quot;{search}&quot;</span>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {categoryFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>
                Categoria:{" "}
                {availableCategories.find((c) => c.id === categoryFilter)
                  ?.title || categoryFilter}
              </span>
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {typeFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>Tipo: {TYPE_LABELS[typeFilter] || typeFilter}</span>
              <button
                type="button"
                onClick={() => setTypeFilter("")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {authorFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>
                Autor:{" "}
                {availableAuthors.find((a) => a.id === authorFilter)?.name ||
                  authorFilter}
              </span>
              <button
                type="button"
                onClick={() => setAuthorFilter("")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {formattedDateRange && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>Período: {formattedDateRange}</span>
              <button
                type="button"
                onClick={() => setDateRange(undefined)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {sortBy !== "recent" && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-0.5 text-xs rounded-full font-normal border border-border"
            >
              <span>Ordem: {SORT_LABELS[sortBy]}</span>
              <button
                type="button"
                onClick={() => setSortBy("recent")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-destructive cursor-pointer ml-auto"
          >
            <RotateCcw className="mr-1 size-3" />
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PublicArticlesList() {
  const {
    articles,
    totalFilteredCount,
    isLoadingArticle,
    isErrorArticle,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    typeFilter,
    setTypeFilter,
    authorFilter,
    setAuthorFilter,
    dateRange,
    setDateRange,
    sortBy,
    setSortBy,
    activeFilterCount,
    clearAllFilters,
    availableCategories,
    availableAuthors,
    paginationMode,
    setPaginationMode,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    hasMore,
    loadMore,
  } = usePublicArticlesViewModel();

  // Sentinel ref para carregamento infinito automático via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paginationMode !== "infinite" || !hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [paginationMode, hasMore, loadMore]);

  // Números de páginas visíveis na paginação
  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  if (isLoadingArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto p-4 space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (isErrorArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Erro ao carregar notícias. Tente novamente mais tarde.
        </div>
      </section>
    );
  }

  const startItem = totalFilteredCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem =
    paginationMode === "infinite"
      ? articles.length
      : Math.min(page * limit, totalFilteredCount);

  return (
    <section className="w-full max-w-7xl mx-auto p-4 pb-12 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-50 line-clamp-1 text-primary">
              Notícias
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notícias</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as últimas publicações, eventos e comunicados oficiais.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {totalFilteredCount}{" "}
          {totalFilteredCount === 1
            ? "notícia encontrada"
            : "notícias encontradas"}
        </span>
      </div>

      {/* Barra de Busca, Filtros e Ordenação */}
      <Toolbar
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        authorFilter={authorFilter}
        setAuthorFilter={setAuthorFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        limit={limit}
        setLimit={setLimit}
        paginationMode={paginationMode}
        setPaginationMode={setPaginationMode}
        availableCategories={availableCategories}
        availableAuthors={availableAuthors}
        activeFilterCount={activeFilterCount}
        clearAllFilters={clearAllFilters}
      />

      {/* Listagem de Cards ou Estado Vazio */}
      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>

          {/* Rodapé: Paginação ou Carregamento Infinito */}
          {paginationMode === "pagination" ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Exibindo <span className="font-semibold">{startItem}</span>–
                <span className="font-semibold">{endItem}</span> de{" "}
                <span className="font-semibold">{totalFilteredCount}</span>{" "}
                notícias
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    title="Primeira página"
                    className="cursor-pointer"
                  >
                    <ChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    title="Página anterior"
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {visiblePageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="min-w-8 h-8 px-2.5 text-xs cursor-pointer"
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    title="Próxima página"
                    className="cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    title="Última página"
                    className="cursor-pointer"
                  >
                    <ChevronsRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 pt-6">
              <p className="text-xs text-muted-foreground">
                Exibindo{" "}
                <span className="font-semibold">{articles.length}</span> de{" "}
                <span className="font-semibold">{totalFilteredCount}</span>{" "}
                notícias
              </p>
              {hasMore && (
                <>
                  <div ref={sentinelRef} className="h-2 w-full" />
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="cursor-pointer gap-2"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    Carregar mais notícias
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-border rounded-xl space-y-3">
          <div className="p-3 rounded-full bg-muted text-muted-foreground">
            <Search className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Não encontramos publicações correspondentes aos filtros ou termos
              de pesquisa selecionados.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="cursor-pointer mt-2"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Limpar todos os filtros
          </Button>
        </div>
      )}
    </section>
  );
}
