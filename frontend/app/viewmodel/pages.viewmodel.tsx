"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { PagesService } from "../service/pages.service";
import { IPage } from "../type/pages";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Check,
  CheckCircle,
  EyeIcon,
  Pencil,
  Trash,
  X,
  XCircleIcon,
} from "lucide-react";
import { useProfileViewModel } from "./user.viewmodel";

interface PageTableMeta {
  changePublished: UseMutationResult<
    IPage,
    Error,
    { id: string; published: boolean }
  >;
  deletePage: UseMutationResult<IPage, Error, string>;
  approvePage: UseMutationResult<IPage, Error, string>;
  rejectPage: UseMutationResult<IPage, Error, { id: string; reason?: string }>;
  isReviewer: boolean;
  handleOpenEdit: (pageId: string) => void;
  handleOpenView: (pageId: string) => void;
}

export function usePagesViewModel() {
  const queryClient = useQueryClient();
  const { profile } = useProfileViewModel();
  const isReviewer =
    profile?.role === "MANAGER" || profile?.role === "ADMIN";

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
    workflow: true,
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

  const getPageByIdQuery = useQuery<IPage>({
    queryKey: ["page", id],
    queryFn: () => PagesService.getPage(id),
    enabled: !!id,
  });

  const refreshApprovalState = () => {
    getPagesListQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ["approvals"] });
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const savePageMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => PagesService.savePage(data),
    onSuccess: (result: IPage) => {
      refreshApprovalState();
      if (result?.changeRequestId || result?.workflowStatus === "pendente") {
        toast.success("Página enviada para aprovação do gestor!");
      } else {
        toast.success("Página salva com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({
      id: pageId,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => PagesService.updatePage(pageId, data),
    onSuccess: (result: IPage) => {
      refreshApprovalState();
      if (result?.changeRequestId || result?.workflowStatus === "pendente") {
        toast.success("Alteração enviada para análise na fila de aprovação!");
      } else {
        toast.success("Página atualizada com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => PagesService.deletePage(pageId),
    onSuccess: (result: IPage) => {
      refreshApprovalState();
      if (result?.changeRequestId || result?.workflowStatus === "pendente") {
        toast.success("Solicitação de exclusão enviada para aprovação!");
      } else {
        toast.success("Página removida com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const changePublishedPageMutation = useMutation({
    mutationFn: ({
      id: pageId,
      published,
    }: {
      id: string;
      published: boolean;
    }) => PagesService.changePublishedPage(pageId, published),
    onSuccess: (result: IPage) => {
      refreshApprovalState();
      if (result?.changeRequestId || result?.workflowStatus === "pendente") {
        toast.success("Alteração de publicação enviada para aprovação!");
      } else {
        toast.success("Estado da página alterado com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const approvePageMutation = useMutation({
    mutationFn: (pageId: string) => PagesService.approvePage(pageId),
    onSuccess: () => {
      refreshApprovalState();
      toast.success("Solicitação da página aprovada!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectPageMutation = useMutation({
    mutationFn: ({ id: pageId, reason }: { id: string; reason?: string }) =>
      PagesService.rejectPage(pageId, reason),
    onSuccess: () => {
      refreshApprovalState();
      toast.success("Solicitação rejeitada com rascunho preservado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /** Chamado pelo NewPageModal ao confirmar criação ou edição. */
  const handleSubmitPage = (data: {
    title: string;
    slug: string;
    content: Record<string, unknown>;
    organizationId: string;
    spaceId?: string | null;
  }) => {
    if (modalMode === "create") {
      savePageMutation.mutate(data as unknown as Record<string, unknown>, {
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
        { id, data: data as unknown as Record<string, unknown> },
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
        const meta = table.options.meta as PageTableMeta;

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
      id: "workflow",
      header: "Revisão",
      cell: ({ row }) => {
        const { pendingRequest, lastRejectedRequest, workflowStatus } =
          row.original;

        if (pendingRequest || workflowStatus === "pendente") {
          const actionLabel =
            pendingRequest?.requestType === "delete"
              ? "Exclusão"
              : pendingRequest?.requestType === "create"
                ? "Criação"
                : "Alteração";
          return (
            <Badge
              variant="outline"
              className="bg-amber-500/15 text-amber-700 border-amber-500/30"
            >
              {actionLabel} Pendente
            </Badge>
          );
        }

        if (lastRejectedRequest || workflowStatus === "rejeitado") {
          return (
            <div className="flex flex-col gap-0.5 max-w-44">
              <Badge
                variant="outline"
                className="w-fit bg-rose-500/15 text-rose-700 border-rose-500/30"
              >
                Rejeitado
              </Badge>
              {lastRejectedRequest?.rejectionReason && (
                <span
                  className="text-[11px] text-rose-600 truncate"
                  title={lastRejectedRequest.rejectionReason}
                >
                  {lastRejectedRequest.rejectionReason}
                </span>
              )}
            </div>
          );
        }

        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
          >
            Aprovado
          </Badge>
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
        const page = row.original;
        const orgName = page.organization?.title || page.organization?.acronym;
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
        const meta = table.options.meta as PageTableMeta;
        const hasPending = Boolean(row.original.pendingRequest);

        return (
          <div className="flex items-center gap-1">
            {meta?.isReviewer && hasPending && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-emerald-600"
                  title="Aprovar solicitação pendente"
                  onClick={() => meta?.approvePage?.mutate(row.original.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-rose-600"
                  title="Rejeitar solicitação pendente"
                  onClick={() => {
                    const reason = window.prompt(
                      "Informe o motivo da rejeição (opcional):",
                      "",
                    );
                    if (reason !== null) {
                      meta?.rejectPage?.mutate({
                        id: row.original.id,
                        reason,
                      });
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
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
      approvePage: approvePageMutation,
      rejectPage: rejectPageMutation,
      isReviewer,
      handleOpenEdit,
      handleOpenView,
    } satisfies PageTableMeta,
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
    approvePage: approvePageMutation,
    rejectPage: rejectPageMutation,

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
