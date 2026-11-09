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
import { IArticle } from "../type/article";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
          <div className="font-medium px-4">{row.getValue("title")}</div>
        ),
      },
      {
        accessorKey: "author",
        header: "Autor",
        cell: ({ row }) => {
          return <div>{row.original.author?.name}</div>;
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
          return <div className="px-4">{formatted}</div>;
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
            <div className="capitalize">{typeMap[rawType] || rawType}</div>
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
          return <div>{categories?.map((c) => c.title).join(", ") || "-"}</div>;
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
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
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
