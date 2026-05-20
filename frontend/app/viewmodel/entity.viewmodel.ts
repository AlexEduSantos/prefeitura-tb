"use client";

import { useQuery } from "@tanstack/react-query";
import { EntityService } from "../service/entity.service";

export function useEntityViewModel() {
  const entityQuery = useQuery({
    queryKey: ["entities"],
    queryFn: () => EntityService.getEntities(),
  });

  return {
    entities: entityQuery.data ?? [],
    isLoadingEntities: entityQuery.isLoading,
    isErrorEntities: entityQuery.isError,
    errorEntities: entityQuery.error,
  };
}
