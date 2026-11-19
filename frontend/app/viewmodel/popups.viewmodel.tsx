"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PopupsService } from "../service/popups.service";
import { useState } from "react";
import { IPopups } from "../type/popup";
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
import { format } from "date-fns";
import { IMedia } from "../type/media";
import { ImageVisualizer } from "@/components/image-visualizer";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IUser } from "../type/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export function usePopupsViewModel() {
  // STATES
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    name: true,
    active: true,
    slides: true,
    updatedAt: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPopup, setSelectedPopup] = useState<IPopups | null>(null);
  const [formData, setFormData] = useState<Partial<IPopups>>({
    title: "",
    link: "",
    active: true,
    displayTime: 10,
    status: "rascunho",
    type: "modal",
    position: "center",
    closeButton: true,
    priority: 0,
    publicationDate: new Date(),
    expirationDate: new Date(),
    userId: "",
    imageId: "",
  });

  // QUERYS
  const popupsQuery = useQuery({
    queryKey: ["popups"],
    queryFn: () => PopupsService.getPopupsList(),
  });

  const queryClient = useQueryClient();

  // MUTATIONS
  const createPopupMutation = useMutation({
    mutationFn: (popup: Partial<IPopups>) => PopupsService.createPopups(popup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Pop-Up criado com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar Pop-Up");
    },
  });

  const updatePopupMutation = useMutation({
    mutationFn: (popup: IPopups) => PopupsService.updatePopups(popup.id, popup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Pop-Up atualizado com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar Pop-Up");
    },
  });

  const deletePopupMutation = useMutation({
    mutationFn: (id: string) => PopupsService.deletePopups(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Pop-Up excluído com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir Pop-Up");
    },
  });

  //Table
  const columns: ColumnDef<IPopups>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        switch (status) {
          case "rascunho":
            return (
              <Badge
                variant="default"
                className="bg-blue-500 hover:bg-blue-600 aspect-square"
              />
            );
          case "publicado":
            return (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600 aspect-square"
              />
            );
          case "agendado":
            return (
              <Badge
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600 aspect-square"
              />
            );
          case "expirado":
            return (
              <Badge
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 aspect-square"
              />
            );
          case "excluido":
            return (
              <Badge
                variant="default"
                className="bg-red-500 hover:bg-red-600 aspect-square"
              />
            );
          default:
            return <Badge variant="secondary" className="aspect-square" />;
        }
      },
    },
    {
      accessorKey: "image",
      header: "Imagem",
      cell: ({ row }) => {
        const image = row.getValue("image") as IMedia | null | undefined;
        if (!image) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <ImageVisualizer
            name={image.title || "Imagem"}
            image={image}
            alt={image.title || "Imagem"}
            mode="modal"
          />
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
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "publicationDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Publicação
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const val = row.getValue("publicationDate") as string | Date | null;
        return val ? format(new Date(val), "dd/MM/yyyy HH:mm") : "—";
      },
    },
    {
      accessorKey: "expirationDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Expiração
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const val = row.getValue("expirationDate") as string | Date | null;
        return val ? format(new Date(val), "dd/MM/yyyy HH:mm") : "—";
      },
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Criado por
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.getValue("user") as IUser;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="flex gap-2">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p>{user?.name}</p>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const popup = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                setSelectedPopup(popup);
                setMode("edit");
                setOpenModal(true);
              }}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => deletePopupMutation.mutate(popup.id)}
            >
              <TrashIcon />
            </Button>
          </div>
        );
      },
    },
  ];

  const popupsTable = useReactTable<IPopups>({
    data: popupsQuery.data ?? [],
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
  });

  const handleSave = async () => {
    if (!formData.imageId) {
      toast.error("Selecione uma imagem para o Pop-Up.");
      return;
    }
    try {
      if (mode === "create") {
        await createPopupMutation.mutateAsync(formData as IPopups);
      } else if (mode === "edit" && selectedPopup) {
        await updatePopupMutation.mutateAsync({
          ...formData,
          id: selectedPopup.id,
        } as IPopups);
      }
      setOpenModal(false);
    } catch {
      // Toast de erro já exibido no onError da mutation
    }
  };

  return {
    popups: popupsQuery.data ?? [],
    isLoadingPopups: popupsQuery.isLoading,
    isErrorPopups: popupsQuery.isError,
    errorPopups: popupsQuery.error,
    refetchPopups: popupsQuery.refetch,

    createPopup: createPopupMutation.mutate,
    isCreatingPopup: createPopupMutation.isPending,
    errorCreatingPopup: createPopupMutation.error,
    updatePopup: updatePopupMutation.mutate,
    isUpdatingPopup: updatePopupMutation.isPending,
    errorUpdatingPopup: updatePopupMutation.error,
    deletePopup: deletePopupMutation.mutate,
    isDeletingPopup: deletePopupMutation.isPending,
    errorDeletingPopup: deletePopupMutation.error,

    popupsTable,
    columns,
    openModal,
    setOpenModal,
    mode,
    setMode,
    selectedPopup,
    setSelectedPopup,
    formData,
    setFormData,
    handleSave,
  };
}
