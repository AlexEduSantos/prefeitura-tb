"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MediaService } from "../service/media.service";
import { toast } from "sonner";

export function useMediaViewModel() {
  const queryClient = useQueryClient();

  const mediaQuery = useQuery({
    queryKey: ["media"],
    queryFn: () => MediaService.getMediaList(),
    refetchInterval: (query) => {
      const list = query.state.data;
      if (
        Array.isArray(list) &&
        list.some(
          (m: any) => m.status === "pending" || m.status === "processing",
        )
      ) {
        return 2000;
      }
      return false;
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: File;
      metadata: {
        title: string;
        altText?: string;
        description?: string;
        folderId?: string;
      };
    }) => MediaService.uploadMedia(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const updateMediaMutation = useMutation({
    mutationFn: (metadata: {
      title: string;
      altText?: string;
      description?: string;
      id: string;
      tags?: string[];
    }) => MediaService.updateMedia(metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => MediaService.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Não foi possível excluir a mídia selecionada.";
      toast.error(message);
    },
  });

  const massDeleteMediaMutation = useMutation({
    mutationFn: (ids: string[]) => MediaService.massDeleteMedia(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Não foi possível excluir as mídias selecionadas.";
      toast.error(message);
    },
  });

  return {
    mediaList: mediaQuery.data ?? [],
    isLoadingMedia: mediaQuery.isLoading,
    isErrorMedia: mediaQuery.isError,
    errorMedia: mediaQuery.error,
    refetchMedia: mediaQuery.refetch,
    uploadMedia: uploadMediaMutation.mutate,
    isUploading: uploadMediaMutation.isPending,
    errorUploading: uploadMediaMutation.error,
    updateMedia: updateMediaMutation.mutate,
    isUpdating: updateMediaMutation.isPending,
    errorUpdating: updateMediaMutation.error,
    deleteMedia: deleteMediaMutation.mutate,
    isDeleting: deleteMediaMutation.isPending,
    errorDeleting: deleteMediaMutation.error,
    massDeleteMedia: massDeleteMediaMutation.mutate,
    isMassDeleting: massDeleteMediaMutation.isPending,
    errorMassDeleting: massDeleteMediaMutation.error,
  };
}

export const useMediaList = (
  prefix: string,
  page: number,
  sort: "asc" | "desc" = "desc",
  limit: number,
) => {
  return useQuery({
    // A queryKey garante que, se prefix, page ou sort mudarem,
    // o React Query buscará novos dados automaticamente.
    queryKey: ["media", prefix, page, sort],

    queryFn: () => MediaService.listMediaByPrefix(prefix, page, sort, limit),

    placeholderData: (previousData) => previousData, // Mantém dados anteriores enquanto carrega (evita flickering)
  });
};

export const useMediaById = () => {
  const { data: media, isLoading: isLoadingMedia } = useQuery({
    queryKey: ["media", "7261dad1-7ab0-42c9-b535-c4c95c452a29"],
    queryFn: () =>
      MediaService.getMediaById("7261dad1-7ab0-42c9-b535-c4c95c452a29"),
    placeholderData: (previousData) => previousData, // Mantém dados anteriores enquanto carrega (evita flickering)
  });

  return { media, isLoadingMedia };
};
