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

export function usePagesViewModel(columns: ColumnDef<IPage>[] | null) {
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
      savePageMutation.mutate(
        data as any,
        {
          onSuccess: () => {
            setIsOpenNewPageModal(false);
            setTitle("");
            setSlug("");
          },
        },
      );
    } else {
      updatePageMutation.mutate(
        { id, data: data as any },
        {
          onSuccess: () => {
            setIsOpenNewPageModal(false);
            setTitle("");
            setSlug("");
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

  // ── Table ────────────────────────────────────────────────────────────────────
  const table = useReactTable<IPage>({
    data: getPagesListQuery.data || [],
    columns: columns || [],
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
    table,

    // Handlers
    handleSubmitPage,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseNewPageModal,
  };
}
