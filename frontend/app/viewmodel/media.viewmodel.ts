"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MediaService } from "../service/media.service";

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
      metadata: { title: string; alt_text?: string; description?: string; folderId?: string };
    }) => MediaService.uploadMedia(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const updateMediaMutation = useMutation({
    mutationFn: (metadata: {
      title: string;
      alt_text?: string;
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
  });

  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      MediaService.createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      MediaService.renameFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      MediaService.moveFolder(id, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => MediaService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
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
    createFolder: createFolderMutation.mutate,
    isCreatingFolder: createFolderMutation.isPending,
    renameFolder: renameFolderMutation.mutate,
    isRenamingFolder: renameFolderMutation.isPending,
    moveFolder: moveFolderMutation.mutate,
    isMovingFolder: moveFolderMutation.isPending,
    deleteFolder: deleteFolderMutation.mutate,
    isDeletingFolder: deleteFolderMutation.isPending,
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
