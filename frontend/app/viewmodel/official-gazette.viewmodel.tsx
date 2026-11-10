"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OfficialGazetteService } from "../service/official-gazette.service";
import { IOfficialGazette } from "../type/official-gazette";
import { toast } from "sonner";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PenIcon,
  TrashIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function useOfficialGazetteViewModel() {
  const queryClient = useQueryClient();

  // Estados de paginação e filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  // Estados de modais (criação / edição)
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedGazette, setSelectedGazette] = useState<IOfficialGazette | null>(null);

  const [formData, setFormData] = useState<Partial<IOfficialGazette>>({
    title: "",
    edition: "",
    description: "",
    publicationDate: new Date().toISOString().split("T")[0],
    fileUrl: "",
    fileSize: undefined,
    pageCount: undefined,
  });

  // Estados de confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gazetteToDelete, setGazetteToDelete] = useState<IOfficialGazette | null>(null);

  // Query principal (área administrativa)
  const gazettesQuery = useQuery({
    queryKey: ["official-gazettes", page, limit, search, selectedYear],
    queryFn: () =>
      OfficialGazetteService.getAdminGazettes({
        page,
        limit,
        search,
        year: selectedYear,
      }),
    staleTime: 1000 * 60 * 3, // 3 minutos
    placeholderData: (prev) => prev,
  });

  // Mutações
  const createGazetteMutation = useMutation({
    mutationFn: (data: Partial<IOfficialGazette>) =>
      OfficialGazetteService.createGazette(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-gazettes"] });
      toast.success("Boletim oficial cadastrado com sucesso!");
      setOpenModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar boletim oficial.");
    },
  });

  const updateGazetteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IOfficialGazette> }) =>
      OfficialGazetteService.updateGazette(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-gazettes"] });
      toast.success("Boletim oficial atualizado com sucesso!");
      setOpenModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar boletim oficial.");
    },
  });

  const deleteGazetteMutation = useMutation({
    mutationFn: (id: string) => OfficialGazetteService.deleteGazette(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-gazettes"] });
      toast.success("Boletim oficial excluído com sucesso!");
      setGazetteToDelete(null);
      setDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir boletim oficial.");
    },
  });

  // Ações de abertura de modais
  const openCreateModal = () => {
    setMode("create");
    setSelectedGazette(null);
    setFormData({
      title: "",
      edition: "",
      description: "",
      publicationDate: new Date().toISOString().split("T")[0],
      fileUrl: "",
      fileSize: undefined,
      pageCount: undefined,
    });
    setOpenModal(true);
  };

  const openEditModal = (gazette: IOfficialGazette) => {
    setMode("edit");
    setSelectedGazette(gazette);

    // Formata a data para YYYY-MM-DD para preencher o input do tipo date
    let formattedDate = "";
    if (gazette.publicationDate) {
      const d = new Date(gazette.publicationDate);
      formattedDate = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : String(gazette.publicationDate).split("T")[0];
    }

    setFormData({
      title: gazette.title,
      edition: gazette.edition || "",
      description: gazette.description || "",
      publicationDate: formattedDate,
      fileUrl: gazette.fileUrl,
      fileSize: gazette.fileSize || undefined,
      pageCount: gazette.pageCount || undefined,
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedGazette(null);
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast.error("O título do boletim é obrigatório.");
      return;
    }
    if (!formData.publicationDate) {
      toast.error("A data de publicação é obrigatória.");
      return;
    }
    if (!formData.fileUrl?.trim()) {
      toast.error("O arquivo PDF (link do documento) é obrigatório.");
      return;
    }

    if (mode === "create") {
      createGazetteMutation.mutate(formData);
    } else if (mode === "edit" && selectedGazette) {
      updateGazetteMutation.mutate({
        id: selectedGazette.id,
        data: formData,
      });
    }
  };

  // Ações de exclusão
  const confirmDelete = (gazette: IOfficialGazette) => {
    setGazetteToDelete(gazette);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setGazetteToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = () => {
    if (gazetteToDelete) {
      deleteGazetteMutation.mutate(gazetteToDelete.id);
    }
  };

  // Configuração TanStack Table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    edition: true,
    title: true,
    publicationDate: true,
    fileUrl: true,
    createdBy: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<IOfficialGazette>[] = [
    {
      accessorKey: "edition",
      header: "Edição",
      cell: ({ row }) => {
        const edition = row.original.edition;
        return (
          <Badge
            variant="secondary"
            className="font-mono text-xs px-2.5 py-1 whitespace-nowrap bg-primary/10 text-primary border border-primary/20"
          >
            {edition ? `#${edition}` : "Extra"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título e Ementa
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const gazette = row.original;
        return (
          <div className="flex flex-col gap-0.5 max-w-[380px]">
            <span className="font-semibold text-sm leading-tight text-foreground line-clamp-1">
              {gazette.title}
            </span>
            {gazette.description && (
              <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {gazette.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "publicationDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent font-medium whitespace-nowrap"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Publicação
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const rawDate = row.original.publicationDate;
        if (!rawDate) return <span className="text-muted-foreground text-xs">—</span>;

        const date = new Date(rawDate);
        const formatted = !isNaN(date.getTime())
          ? format(date, "dd/MM/yyyy", { locale: ptBR })
          : String(rawDate);

        return (
          <span className="text-xs font-mono font-medium text-foreground whitespace-nowrap">
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: "fileUrl",
      header: "Documento PDF",
      cell: ({ row }) => {
        const gazette = row.original;
        const sizeFormatted = formatFileSize(gazette.fileSize);

        // Se for uma chave relativa ou URL completa
        const fullUrl = gazette.fileUrl?.startsWith("http")
          ? gazette.fileUrl
          : `${process.env.NEXT_PUBLIC_API_URL || ""}/media/file/${gazette.fileUrl}`;

        return (
          <div className="flex items-center gap-2">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-md transition-colors border"
              title="Abrir arquivo PDF"
            >
              <FileTextIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>PDF</span>
              <ExternalLinkIcon className="h-3 w-3 opacity-70" />
            </a>

            {(sizeFormatted || gazette.pageCount) && (
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {[
                  sizeFormatted,
                  gazette.pageCount ? `${gazette.pageCount} pág.` : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Criado por",
      cell: ({ row }) => {
        const creator = row.original.createdBy;
        if (!creator) return <span className="text-muted-foreground text-xs">—</span>;

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator.avatar || undefined} />
              <AvatarFallback className="text-[10px]">
                {creator.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate max-w-[120px]">
                {creator.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {creator.role}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const gazette = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => openEditModal(gazette)}
              title="Editar Edição"
            >
              <PenIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => confirmDelete(gazette)}
              title="Excluir Edição"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData = gazettesQuery.data?.data || [];

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return {
    // Dados e queries
    gazettes: tableData,
    total: gazettesQuery.data?.total || 0,
    page: gazettesQuery.data?.page || page,
    limit: gazettesQuery.data?.limit || limit,
    totalPages: gazettesQuery.data?.totalPages || 1,
    isLoading: gazettesQuery.isLoading,
    isFetching: gazettesQuery.isFetching,
    isError: gazettesQuery.isError,
    refetch: gazettesQuery.refetch,

    // Filtros e paginação
    search,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    selectedYear,
    setSelectedYear: (y?: number) => {
      setSelectedYear(y);
      setPage(1);
    },
    setPage,
    setLimit,

    // Tabela
    table,
    columns,

    // Modal de criação / edição
    openModal,
    setOpenModal,
    mode,
    selectedGazette,
    formData,
    setFormData,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    isSaving:
      createGazetteMutation.isPending || updateGazetteMutation.isPending,

    // Exclusão
    deleteModalOpen,
    gazetteToDelete,
    confirmDelete,
    cancelDelete,
    handleDelete,
    isDeleting: deleteGazetteMutation.isPending,
  };
}

