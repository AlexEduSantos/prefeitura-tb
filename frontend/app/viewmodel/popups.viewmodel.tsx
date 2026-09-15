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
import { EyeIcon, ImageIcon, PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IUser } from "../type/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function usePopupsViewModel() {
  // STATES
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    name: true,
    entityId: true,
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
    name: "",
    link: "",
    active: true,
    displayTime: 10,
    status: "rascunho",
    type: "",
    position: "",
    closeButton: true,
    priority: 0,
    publicationDate: new Date(),
    expirationDate: new Date(),
    entityId: "",
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
    },
  });

  const updatePopupMutation = useMutation({
    mutationFn: (popup: IPopups) => PopupsService.updatePopups(popup.id, popup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
    },
  });

  const deletePopupMutation = useMutation({
    mutationFn: (id: string) => PopupsService.deletePopups(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
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
        const image = row.getValue("image") as IMedia;
        return (
          <>
            <ImageVisualizer
              name={"teste"}
              image={image}
              alt={image.title}
              mode="modal"
            />
          </>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "publicationDate",
      header: "Data de Publicação",
      cell: ({ row }) =>
        format(new Date(row.getValue("publicationDate")), "dd/MM/yyyy HH:mm"),
    },
    {
      accessorKey: "expirationDate",
      header: "Data de Expiração",
      cell: ({ row }) =>
        format(new Date(row.getValue("expirationDate")), "dd/MM/yyyy HH:mm"),
    },
    {
      accessorKey: "user",
      header: "Criado por",
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

  const handleSave = () => {
    if (mode === "create") {
      createPopupMutation.mutate(formData as IPopups);
    } else if (mode === "edit" && selectedPopup) {
      updatePopupMutation.mutate({
        ...formData,
        id: selectedPopup.id,
      } as IPopups);
    }
    setOpenModal(false);
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
