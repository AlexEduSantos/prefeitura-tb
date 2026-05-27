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
      if (Array.isArray(list) && list.some((m: any) => m.status === "pending" || m.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: { title: string; alt_text?: string; description?: string } }) =>
      MediaService.uploadMedia(file, metadata),
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

  return {
    mediaList: mediaQuery.data ?? [],
    isLoadingMedia: mediaQuery.isLoading,
    isErrorMedia: mediaQuery.isError,
    errorMedia: mediaQuery.error,
    uploadMedia: uploadMediaMutation.mutate,
    isUploading: uploadMediaMutation.isPending,
    deleteMedia: deleteMediaMutation.mutate,
  };
}
