"use client";
import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServicesService } from "../service/services.service";
import { IServices } from "../type/services";
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
import { Button } from "@/components/ui/button";
import { ArrowUpDown, PenIcon, StarIcon, TrashIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageVisualizer } from "@/components/image-visualizer";
import { IMedia } from "../type/media";
import { Switch } from "@/components/ui/switch";
import useDebounce from "@/hooks/use-debounce";

export function useServices() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Modal states (following popups pattern)
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<IServices | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<IServices>>({
    title: "",
    link: "",
    altText: "",
    imageId: "",
  });

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<IServices | null>(
    null,
  );

  const servicesQuery = useQuery({
    queryKey: ["services", page, limit, search],
    queryFn: () =>
      ServicesService.getServicesList({
        page,
        limit,
        title: search,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: Partial<IServices>) =>
      ServicesService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
      setOpenModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar serviço");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IServices> }) =>
      ServicesService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
      setOpenModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => ServicesService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço deletado com sucesso!");
      setServiceToDelete(null);
      setDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar serviço");
    },
  });

  // Modal actions
  const openCreateModal = () => {
    setMode("create");
    setSelectedService(null);
    setFormData({
      title: "",
      link: "",
      altText: "",
      imageId: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (service: IServices) => {
    setMode("edit");
    setSelectedService(service);
    setFormData({
      title: service.title,
      link: service.link,
      altText: service.altText,
      imageId: service.imageId,
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedService(null);
    setFormData({
      title: "",
      link: "",
      altText: "",
      imageId: "",
    });
  };

  const handleSave = () => {
    if (mode === "create") {
      createServiceMutation.mutate(formData);
    } else if (mode === "edit" && selectedService) {
      updateServiceMutation.mutate({
        id: selectedService.id,
        data: formData,
      });
    }
  };

  // Delete actions
  const confirmDelete = (service: IServices) => {
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setServiceToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete.id);
    }
  };

  // Table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    title: true,
    link: true,
    image: true,
    createdAt: true,
    user: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});
  const columns: ColumnDef<IServices>[] = [
    {
      accessorKey: "featured",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Destaque
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div
            onClick={() =>
              updateServiceMutation.mutate({
                id: row.original.id,
                data: { featured: !row.original.featured },
              })
            }
            className="flex items-center gap-2 cursor-pointer"
          >
            {row.original.featured ? (
              <StarIcon className="size-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarIcon className="size-4 text-gray-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "link",
      header: "Link",
      cell: ({ row }) => (
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate max-w-50 block"
        >
          {row.original.link}
        </a>
      ),
    },
    {
      accessorKey: "image",
      header: "Capa",
      cell: ({ row }) => {
        const image = row.getValue("image") as IMedia;
        if (!image)
          return (
            <span className="text-muted-foreground text-xs">Sem imagem</span>
          );
        return (
          <ImageVisualizer
            name={row.original.title}
            image={image}
            alt={image.title}
            mode="modal"
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de criação
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm"),
    },
    {
      accessorKey: "user",
      header: "Criador",
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return null;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="ml-1 text-xs">{user.name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="hover:bg-green-200 hover:text-green-600 text-green-500"
            size="icon"
            onClick={() => openEditModal(row.original)}
          >
            <PenIcon />
          </Button>
          <Button
            variant="destructive"
            className="border-0"
            size="icon"
            onClick={() => confirmDelete(row.original)}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: servicesQuery.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  return {
    services: servicesQuery.data,
    isLoadingServices: servicesQuery.isLoading,
    isErrorServices: servicesQuery.isError,
    errorServices: servicesQuery.error,
    isSuccessServices: servicesQuery.isSuccess,
    refetchServices: servicesQuery.refetch,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,

    // Modal
    openModal,
    setOpenModal,
    mode,
    setMode,
    selectedService,
    setSelectedService,
    formData,
    setFormData,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,

    // Delete
    deleteModalOpen,
    setDeleteModalOpen,
    serviceToDelete,
    confirmDelete,
    cancelDelete,
    handleDelete,

    // Mutations
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation,

    // Table
    table,
    columns,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
  };
}

export function usePublicServices() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const debouncedSearch = useDebounce(search, 1000);

  const servicesQuery = useQuery({
    queryKey: ["services", page, limit, debouncedSearch],
    queryFn: () =>
      ServicesService.getPublicServicesList({
        page,
        limit,
        title: debouncedSearch,
      }),
    staleTime: 1000 * 60 * 5,
  });

  return {
    services: servicesQuery.data,
    isLoadingServices: servicesQuery.isLoading,
    isErrorServices: servicesQuery.isError,
    errorServices: servicesQuery.error,
    isSuccessServices: servicesQuery.isSuccess,
    refetchServices: servicesQuery.refetch,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
  };
}
