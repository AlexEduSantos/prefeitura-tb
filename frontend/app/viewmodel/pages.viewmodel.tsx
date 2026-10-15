"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PagesService } from "../service/pages.service";
import { IPage } from "../type/page";
import { toast } from "sonner";
import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  CheckCircle,
  EyeIcon,
  Pencil,
  Trash,
  XCircleIcon,
} from "lucide-react";

export function usePagesViewModel() {
  // ── UI State ────────────────────────────────────────────────────────────────
  const [isOpenNewPageModal, setIsOpenNewPageModal] = useState(false);
  const [isOpenViewModal, setIsOpenViewModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [id, setId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // ── Table State ─────────────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    published: true,
    title: true,
    slug: true,
    Ações: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  // ── Queries ─────────────────────────────────────────────────────────────────
  const getPagesListQuery = useQuery<IPage[]>({
    queryKey: ["pages"],
    queryFn: () => PagesService.getPagesList(),
  });

  const getPageByIdQuery = useQuery({
    queryKey: ["page", id],
    queryFn: () => PagesService.getPage(id),
    enabled: !!id,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const savePageMutation = useMutation({
    mutationFn: (data: any) => PagesService.savePage(data),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PagesService.updatePage(id, data),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => PagesService.deletePage(id),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePublishedPageMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      PagesService.changePublishedPage(id, published),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Estado da página alterado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /** Chamado pelo NewPageModal ao confirmar criação ou edição. */
  const handleSubmitPage = (data: {
    title: string;
    slug: string;
    content: any;
    organizationId: string;
    spaceId?: string | null;
  }) => {
    if (modalMode === "create") {
      savePageMutation.mutate(data as any, {
        onSuccess: () => {
          setIsOpenNewPageModal(false);
          setTitle("");
          setSlug("");
          setId("");
        },
      });
    } else {
      if (!id || id.trim() === "") {
        toast.error("ID da página inválido para edição.");
        return;
      }

      updatePageMutation.mutate(
        { id, data: data as any },
        {
          onSuccess: () => {
            setIsOpenNewPageModal(false);
            setTitle("");
            setSlug("");
            setId("");
          },
        },
      );
    }
  };

  /** Abre o modal de criação. */
  const handleOpenCreate = () => {
    setModalMode("create");
    setIsOpenNewPageModal(true);
  };

  /** Abre o modal de edição para a página com o id informado. */
  const handleOpenEdit = (pageId: string) => {
    setId(pageId);
    setModalMode("edit");
    setIsOpenNewPageModal(true);
  };

  /** Abre o modal de visualização para a página com o id informado. */
  const handleOpenView = (pageId: string) => {
    setId(pageId);
    setIsOpenViewModal(true);
  };

  /** Fecha o modal de nova página e reseta os campos. */
  const handleCloseNewPageModal = () => {
    setIsOpenNewPageModal(false);
    setTitle("");
    setSlug("");
  };

  const columns: ColumnDef<IPage>[] = [
    {
      accessorKey: "published",
      header: "Estado",
      cell: ({ row, table }) => {
        const published = row.original.published;
        const meta = table.options.meta as any;

        const handlePublishedChange = () => {
          meta?.changePublished?.mutate({
            id: row.original.id,
            published: !published,
          });
        };

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer stroke-1"
              onClick={handlePublishedChange}
              title={published ? "Despublicar" : "Publicar"}
              type="button"
            >
              {published ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-500" />
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
      accessorKey: "slug",
      header: "Caminho",
      cell: ({ row }) => (
        <div className="font-medium text-muted-foreground">
          {row.getValue("slug")}
        </div>
      ),
    },
    {
      accessorKey: "organization",
      header: "Secretaria / Órgão",
      cell: ({ row }) => {
        const page = row.original as any;
        const orgName = page.organization?.name;
        const spaceSlug = page.space?.slug ? `/${page.space.slug}` : "/";

        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {orgName || "Nenhuma"}
            </span>
            <span className="text-xs text-muted-foreground">
              Espaço: {spaceSlug}
            </span>
          </div>
        );
      },
    },
    {
      id: "Ações",
      header: "Ações",
      cell: ({ row, table }) => {
        const meta = table.options.meta as any;

        return (
          <div className="flex items-center gap-2 w-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              title="Ver"
              onClick={() => meta?.handleOpenView(row.original.id)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              title="Editar"
              onClick={() => meta?.handleOpenEdit(row.original.id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              title="Deletar"
              onClick={() => {
                if (confirm("Tem certeza que deseja deletar esta página?")) {
                  meta?.deletePage?.mutate(row.original.id);
                }
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // ── Table ────────────────────────────────────────────────────────────────────
  const table = useReactTable<IPage>({
    data: getPagesListQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      changePublished: changePublishedPageMutation,
      deletePage: deletePageMutation,
      handleOpenEdit,
      handleOpenView,
    },
  });

  // ── Return ───────────────────────────────────────────────────────────────────
  return {
    // Queries
    pages: getPagesListQuery.data,
    isLoadingPage: getPagesListQuery.isLoading,
    isErrorPage: getPagesListQuery.isError,
    errorPage: getPagesListQuery.error,
    refetchPages: getPagesListQuery.refetch,

    page: getPageByIdQuery.data,
    isLoadingPageById: getPageByIdQuery.isLoading,
    isErrorPageById: getPageByIdQuery.isError,
    errorPageById: getPageByIdQuery.error,
    refetchPageById: getPageByIdQuery.refetch,

    // Mutations expostos para acesso a isPending etc.
    savePage: savePageMutation,
    updatePage: updatePageMutation,
    deletePage: deletePageMutation,
    changePublished: changePublishedPageMutation,

    // UI State
    isOpenNewPageModal,
    setIsOpenNewPageModal,
    isOpenViewModal,
    setIsOpenViewModal,
    title,
    setTitle,
    slug,
    setSlug,
    id,
    setId,
    modalMode,
    setModalMode,

    // Table
    columns,
    table,

    // Handlers
    handleSubmitPage,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseNewPageModal,
  };
}
