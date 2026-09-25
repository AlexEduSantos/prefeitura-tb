"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GalleryService } from "../service/gallery.service";
import { EntityService } from "../service/entity.service";
import { MediaService } from "../service/media.service";
import { IGallery } from "../type/gallery";
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
import { format } from "date-fns";
import { useState } from "react";
import { EyeClosedIcon, EyeIcon, PenIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function useGalleryViewModel() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    title: true,
    entityId: true,
    active: true,
    slides: true,
    updatedAt: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  const queryClient = useQueryClient();

  const galleryQuery = useQuery({
    queryKey: ["gallery"],
    queryFn: () => GalleryService.getGalleryList(),
  });

  // Mutations
  const createBannerMutation = useMutation({
    mutationFn: (banner: Partial<IGallery>) =>
      GalleryService.createGallery(banner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const entitiesQuery = useQuery({
    queryKey: ["entities"],
    queryFn: () => EntityService.getEntities(),
  });

  const mediaQuery = useQuery({
    queryKey: ["media"],
    queryFn: () => MediaService.getMediaList(),
  });

  const updateBannerMutation = useMutation({
    mutationFn: (banner: IGallery) => GalleryService.updateGallery(banner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => GalleryService.deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [selectedGallery, setSelectedGallery] = useState<IGallery | null>(null);

  const columns: ColumnDef<IGallery>[] = [
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.active;
        return active ? (
          <Badge
            variant="default"
            className="bg-green-500 hover:bg-green-600 p-0 h-4 w-4 rounded-full"
          ></Badge>
        ) : (
          <Badge
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 p-0 h-4 w-4 rounded-full"
          ></Badge>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Título",
    },
    {
      accessorKey: "slides",
      header: "Slides",
      cell: ({ row }) => row.original.slides.length,
    },
    {
      accessorKey: "updatedAt",
      header: "Atualizado em",
      cell: ({ row }) =>
        format(new Date(row.getValue("updatedAt")), "dd/MM/yyyy HH:mm"),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.slides.length > 0 ? (
            <Button
              variant="ghost"
              className="hover:bg-muted-foreground/20"
              size="icon"
              onClick={() => {
                setSelectedGallery(row.original);
                setMode("view");
                setOpenModal(true);
              }}
            >
              <EyeIcon />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="hover:bg-muted-foreground/20"
              size="icon"
            >
              <EyeClosedIcon />
            </Button>
          )}
          <Button
            variant="ghost"
            className="hover:bg-green-200 hover:text-green-600 text-green-500"
            size="icon"
            onClick={() => {
              setSelectedGallery(row.original);
              setMode("edit");
              setOpenModal(true);
            }}
          >
            <PenIcon />
          </Button>
          <Button
            variant="destructive"
            className="border-0"
            size="icon"
            onClick={() => deleteBannerMutation.mutate(row.original.id)}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable<IGallery>({
    data: galleryQuery.data ?? [],
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

  return {
    galleryList: galleryQuery.data ?? [],
    isLoadingGallery: galleryQuery.isLoading,
    isErrorGallery: galleryQuery.isError,
    errorGallery: galleryQuery.error,
    refetchGallery: galleryQuery.refetch,

    entities: entitiesQuery.data ?? [],
    isLoadingEntities: entitiesQuery.isLoading,

    mediaList: mediaQuery.data ?? [],
    isLoadingMedia: mediaQuery.isLoading,

    updateBanner: updateBannerMutation.mutate,
    isUpdating: updateBannerMutation.isPending,
    errorUpdating: updateBannerMutation.error,
    deleteBanner: deleteBannerMutation.mutate,
    isDeleting: deleteBannerMutation.isPending,
    errorDeleting: deleteBannerMutation.error,
    createBanner: createBannerMutation.mutate,
    isCreating: createBannerMutation.isPending,
    errorCreating: createBannerMutation.error,

    table,
    columns,

    openModal,
    setOpenModal,
    mode,
    setMode,
    selectedGallery,
    setSelectedGallery,
  };
}
