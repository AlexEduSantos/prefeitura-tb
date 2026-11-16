"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Star,
  FileText,
  CheckCircle,
  Trash,
  Search,
  ChevronDown,
  ClockAlertIcon,
  CalendarClock,
  ArchiveIcon,
  Edit,
  PlusIcon,
  EyeIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ArticleService } from "../service/article.service";
import { CategoryService } from "../service/organization.service";
import { IArticle } from "../type/article";
import { ICategory } from "../type/organization";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export type PublicArticleSortOption =
  | "recent"
  | "oldest"
  | "title_asc"
  | "title_desc";

export type PublicPaginationMode = "pagination" | "infinite";

export function ArticleViewModel() {
  const router = useRouter();
  // Input local digitado pelo usuário (não dispara busca automática)
  const [searchInput, setSearchInput] = useState("");
  // Termo de busca ativo enviado para o backend
  const [activeSearch, setActiveSearch] = useState("");

  const queryClient = useQueryClient();

  const articleQuery = useQuery({
    queryKey: ["article-admin", activeSearch],
    queryFn: () => ArticleService.getAdminArticles(activeSearch),
  });

  const publicArticleQuery = useQuery({
    queryKey: ["article", activeSearch],
    queryFn: () => ArticleService.getArticles(activeSearch),
  });

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    featured: false,
  });

  // mutations
  const createArticleMutation = useMutation({
    mutationFn: (data: Partial<IArticle>) => ArticleService.createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-admin"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IArticle> }) =>
      ArticleService.updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-admin"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => ArticleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-admin"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ArticleService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-admin"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const changeFeaturedMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      ArticleService.changeFeatured(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-admin"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const handleSearchSubmit = useCallback(() => {
    setActiveSearch(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit],
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setActiveSearch("");
  }, []);

  const clearFilters = useCallback(() => {
    setColumnFilters([]);
    setSearchInput("");
    setActiveSearch("");
  }, []);

  const onEditArticle = useCallback(
    (id: string) => {
      router.push(`/administrator/articles/${id}`);
    },
    [router],
  );

  const onNewArticle = useCallback(() => {
    router.push("/administrator/articles/new");
  }, [router]);

  const columns = useMemo<ColumnDef<IArticle>[]>(
    () => [
      {
        accessorKey: "status",
        header: "Estado",
        filterFn: "equals",
        cell: ({ row, table }) => {
          const status = row.original.status;
          const featured = row.original.featured;
          const meta = table.options.meta as any;
          const statusTitle = () => {
            switch (status?.toLowerCase()) {
              case "programado":
                return "Programado";
              case "publicado":
                return "Publicado";
              case "excluido":
                return "Excluído";
              case "rascunho":
                return "Rascunho";
              case "arquivado":
                return "Arquivado";
              case "expirado":
                return "Expirado";
            }
          };

          const handleStatusChange = (newStatus: string) => {
            meta?.changeStatus({ id: row.original.id, status: newStatus });
          };

          const handleFeaturedChange = () => {
            meta?.changeFeatured({ id: row.original.id, featured: !featured });
          };

          const getStatusIcon = (status: string) => {
            switch (status?.toLowerCase()) {
              case "programado":
                return <CalendarClock className="h-4 w-4 text-sky-500" />;
              case "publicado":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
              case "excluido":
                return <Trash className="h-4 w-4 text-red-500" />;
              case "rascunho":
                return <FileText className="h-4 w-4 text-gray-500" />;
              case "arquivado":
                return <ArchiveIcon className="h-4 w-4 text-indigo-500" />;
              case "expirado":
                return <ClockAlertIcon className="h-4 w-4 text-amber-600" />;
            }
          };
          return (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 cursor-pointer stroke-1"
                    title={statusTitle()}
                  >
                    {getStatusIcon(status)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={status}
                    onValueChange={handleStatusChange}
                  >
                    {status !== "programado" && (
                      <DropdownMenuRadioItem value="programado">
                        Programar
                      </DropdownMenuRadioItem>
                    )}
                    {status !== "publicado" && (
                      <DropdownMenuRadioItem value="publicado">
                        Publicar
                      </DropdownMenuRadioItem>
                    )}
                    {status !== "rascunho" && (
                      <DropdownMenuRadioItem value="rascunho">
                        Rascunho
                      </DropdownMenuRadioItem>
                    )}
                    {status !== "excluido" && (
                      <DropdownMenuRadioItem value="excluido">
                        Excluir
                      </DropdownMenuRadioItem>
                    )}
                    {status !== "arquivado" && (
                      <DropdownMenuRadioItem value="arquivado">
                        Arquivar
                      </DropdownMenuRadioItem>
                    )}
                    {status !== "expirado" && (
                      <DropdownMenuRadioItem value="expirado">
                        Expirar
                      </DropdownMenuRadioItem>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer stroke-1"
                onClick={handleFeaturedChange}
                title={
                  featured ? "Remover dos destaques" : "Adicionar aos destaques"
                }
                type="button"
              >
                {featured ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Star className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Nome
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium px-4 max-w-120 text-wrap line-clamp-2">
            {row.getValue("title")}
          </div>
        ),
      },
      {
        accessorKey: "author",
        header: "Autor",
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground font-mono">
              {row.original.author?.name}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Data da criação
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const dateStr = row.getValue("createdAt") as string;
          const formatted = dateStr
            ? format(new Date(dateStr), "dd/MM/yyyy - HH:mm")
            : "-";
          return (
            <div className="px-4 text-muted-foreground font-mono">
              {formatted}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Tipo",
        filterFn: "equals",
        cell: ({ row }) => {
          const typeMap: Record<string, string> = {
            article: "Matéria",
            event: "Evento",
            note: "Nota",
            announcement: "Comunicado",
          };
          const rawType = row.getValue("type") as string;
          return (
            <div className="capitalize text-muted-foreground font-mono">
              {typeMap[rawType] || rawType}
            </div>
          );
        },
      },
      {
        accessorKey: "categories",
        header: "Categoria",
        filterFn: (row, columnId, value) => {
          if (!value) return true;
          const categories = row.getValue(columnId) as Array<{
            id?: string;
            title?: string;
            slug?: string;
          }>;
          if (!Array.isArray(categories) || categories.length === 0)
            return false;
          const search = String(value).toLowerCase().trim();
          return categories.some((c) => {
            if (!c) return false;
            return (
              c.id === value ||
              c.slug?.toLowerCase() === search ||
              c.title?.toLowerCase().includes(search)
            );
          });
        },
        cell: ({ row }) => {
          const categories = row.original.categories;
          return (
            <div className="text-muted-foreground font-mono">
              {categories?.map((c) => c.title).join(", ") || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "actions",
        header: ({ column }) => {
          return <div className="text-right mr-6">Ações</div>;
        },
        cell: ({ row, table }) => {
          return (
            <div className="flex items-center gap-2 justify-end">
              {row.original.status === "publicado" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer stroke-1"
                  onClick={() => window.open(`/noticias/${row.original.slug}`)}
                  title="Visualizar"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer stroke-1"
                onClick={() =>
                  (table.options.meta as any)?.onEdit(row.original.id)
                }
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                title="Excluir"
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer stroke-1"
                onClick={() => {
                  if (
                    window.confirm(
                      "Tem certeza que deseja excluir esta matéria?",
                    )
                  ) {
                    (table.options.meta as any)?.changeStatus({
                      id: row.original.id,
                      status: "excluido",
                    });
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "featured",
        id: "featured",
        enableHiding: true,
        filterFn: "equals",
      },
    ],
    [],
  );

  const activeArticles = useMemo(
    () => articleQuery.data?.filter((a) => a.status !== "excluido") || [],
    [articleQuery.data],
  );

  const table = useReactTable({
    data: activeArticles,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      changeStatus: changeStatusMutation.mutate,
      changeFeatured: changeFeaturedMutation.mutate,
      onEdit: onEditArticle,
    },
  });

  return {
    article: articleQuery.data,
    publicArticles: publicArticleQuery.data,
    isLoadingPublicArticles: publicArticleQuery.isLoading,
    isErrorPublicArticles: publicArticleQuery.isError,
    errorPublicArticles: publicArticleQuery.error,
    isLoadingArticle: articleQuery.isLoading,
    isErrorArticle: articleQuery.isError,
    errorArticle: articleQuery.error,
    createArticle: createArticleMutation.mutate,
    updateArticle: updateArticleMutation.mutate,
    deleteArticle: deleteArticleMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    changeFeatured: changeFeaturedMutation.mutate,

    // Search
    searchInput,
    setSearchInput,
    activeSearch,
    setActiveSearch,
    handleSearchSubmit,
    handleSearchKeyDown,
    handleClearSearch,

    // Compatibilidade temporária caso algum outro componente acesse search/limit
    search: searchInput,
    setSearch: setSearchInput,
    limit: 10,
    setLimit: () => {},

    // Table state & handlers
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    clearFilters,
    onEditArticle,
    onNewArticle,

    columns,
    table,
  };
}

export function useArticleBySlug(slug: string) {
  const articleByIdQuery = useQuery({
    queryKey: ["article", slug],
    queryFn: () => ArticleService.getArticle(slug),
  });

  return {
    article: articleByIdQuery.data,
    isLoading: articleByIdQuery.isLoading,
    isError: articleByIdQuery.isError,
    error: articleByIdQuery.error,
  };
}

export function useArticleById(id: string) {
  const articleByIdQuery = useQuery({
    queryKey: ["article", id],
    queryFn: () => ArticleService.getArticleById(id),
  });

  return {
    article: articleByIdQuery.data,
    isLoading: articleByIdQuery.isLoading,
    isError: articleByIdQuery.isError,
    error: articleByIdQuery.error,
  };
}

export function usePublicArticlesViewModel() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<PublicArticleSortOption>("recent");
  const [paginationMode, setPaginationMode] =
    useState<PublicPaginationMode>("pagination");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(9);

  const articlesQuery = useQuery({
    queryKey: ["article", "public-list"],
    queryFn: () => ArticleService.getArticles(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoryService.getCategories(),
  });

  const rawArticles = useMemo<IArticle[]>(
    () => articlesQuery.data ?? [],
    [articlesQuery.data],
  );

  // Categorias disponíveis (da API + fallback das categorias presentes nos artigos)
  const availableCategories = useMemo<ICategory[]>(() => {
    const map = new Map<string, ICategory>();
    if (categoriesQuery.data) {
      categoriesQuery.data.forEach((cat) => {
        if (cat?.id) map.set(cat.id, cat);
      });
    }
    rawArticles.forEach((art) => {
      art.categories?.forEach((cat: any) => {
        if (cat?.id && !map.has(cat.id)) {
          map.set(cat.id, cat);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR"),
    );
  }, [categoriesQuery.data, rawArticles]);

  // Autores disponíveis extraídos dos artigos publicados
  const availableAuthors = useMemo<{ id: string; name: string }[]>(() => {
    const map = new Map<string, { id: string; name: string }>();
    rawArticles.forEach((art) => {
      const id = art.author?.id || art.authorId;
      const name = art.author?.name;
      if (id && name && !map.has(id)) {
        map.set(id, { id, name });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [rawArticles]);

  // Resetar para a página 1 sempre que filtros, busca, ordenação ou limite mudarem
  useEffect(() => {
    setPage(1);
  }, [
    search,
    categoryFilter,
    typeFilter,
    authorFilter,
    dateRange?.from,
    dateRange?.to,
    sortBy,
    limit,
    paginationMode,
  ]);

  const filteredAndSortedArticles = useMemo<IArticle[]>(() => {
    const normalizeText = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const searchNormalized = normalizeText(search);

    const filtered = rawArticles.filter((art) => {
      // 1. Busca por título ou subtítulo (headline)
      if (searchNormalized) {
        const titleMatch = normalizeText(art.title || "").includes(
          searchNormalized,
        );
        const headlineMatch = normalizeText(art.headline || "").includes(
          searchNormalized,
        );
        if (!titleMatch && !headlineMatch) return false;
      }

      // 2. Filtro por Categoria
      if (categoryFilter) {
        const hasCat = art.categories?.some(
          (cat: any) =>
            cat.id === categoryFilter || cat.slug === categoryFilter,
        );
        if (!hasCat) return false;
      }

      // 3. Filtro por Tipo
      if (typeFilter) {
        if (art.type !== typeFilter) return false;
      }

      // 4. Filtro por Autor
      if (authorFilter) {
        const artAuthorId = art.author?.id || art.authorId;
        if (artAuthorId !== authorFilter) return false;
      }

      // 5. Filtro por Range de Datas (data de publicação ou criação)
      if (dateRange?.from || dateRange?.to) {
        const rawDate = art.publicationDate || art.createdAt;
        if (!rawDate) return false;
        const articleDate = new Date(rawDate);
        if (isNaN(articleDate.getTime())) return false;

        if (dateRange.from) {
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          if (articleDate < start) return false;
        }

        if (dateRange.to) {
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (articleDate > end) return false;
        }
      }

      return true;
    });

    // Ordenação
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.publicationDate || a.createdAt).getTime();
      const dateB = new Date(b.publicationDate || b.createdAt).getTime();

      switch (sortBy) {
        case "recent":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "", "pt-BR");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "", "pt-BR");
        default:
          return dateB - dateA;
      }
    });
  }, [
    rawArticles,
    search,
    categoryFilter,
    typeFilter,
    authorFilter,
    dateRange,
    sortBy,
  ]);

  const totalFilteredCount = filteredAndSortedArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / limit));

  const paginatedArticles = useMemo<IArticle[]>(() => {
    if (paginationMode === "infinite") {
      return filteredAndSortedArticles.slice(0, page * limit);
    }
    const startIndex = (page - 1) * limit;
    return filteredAndSortedArticles.slice(startIndex, startIndex + limit);
  }, [filteredAndSortedArticles, paginationMode, page, limit]);

  const hasMore = page * limit < totalFilteredCount;

  const loadMore = useCallback(() => {
    setPage((prev) => (prev * limit < totalFilteredCount ? prev + 1 : prev));
  }, [limit, totalFilteredCount]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (typeFilter) count++;
    if (authorFilter) count++;
    if (dateRange?.from || dateRange?.to) count++;
    return count;
  }, [categoryFilter, typeFilter, authorFilter, dateRange]);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setAuthorFilter("");
    setDateRange(undefined);
    setSortBy("recent");
    setPage(1);
  }, []);

  return {
    articles: paginatedArticles,
    allFilteredArticles: filteredAndSortedArticles,
    totalCount: rawArticles.length,
    totalFilteredCount,
    isLoadingArticle: articlesQuery.isLoading,
    isErrorArticle: articlesQuery.isError,
    errorArticle: articlesQuery.error,

    // Filtros e Busca
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

    // Opções dinâmicas
    availableCategories,
    availableAuthors,

    // Paginação / Infinite Scroll
    paginationMode,
    setPaginationMode,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    hasMore,
    loadMore,
  };
}
