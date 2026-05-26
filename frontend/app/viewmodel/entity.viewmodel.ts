"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EntityService } from "../service/entity.service";

export function useEntityViewModel() {
  const queryClient = useQueryClient();

  const entityQuery = useQuery({
    queryKey: ["entities"],
    queryFn: () => EntityService.getEntities(),
  });

  const createEntityMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) => EntityService.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; slug: string } }) =>
      EntityService.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: (id: string) => EntityService.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  return {
    entities: entityQuery.data ?? [],
    isLoadingEntities: entityQuery.isLoading,
    isErrorEntities: entityQuery.isError,
    errorEntities: entityQuery.error,
    createEntity: createEntityMutation.mutate,
    isCreating: createEntityMutation.isPending,
    updateEntity: updateEntityMutation.mutate,
    isUpdating: updateEntityMutation.isPending,
    deleteEntity: deleteEntityMutation.mutate,
    isDeleting: deleteEntityMutation.isPending,
  };
}
