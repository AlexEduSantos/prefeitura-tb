"use client";

import { useQuery } from "@tanstack/react-query";
import { PagesService } from "../service/pages.service";
import { IPage } from "../type/pages";

interface UsePublicPageOptions {
  spaceSlug?: string | null;
  slug: string;
}

export function usePublicPage({ spaceSlug, slug }: UsePublicPageOptions) {
  const query = useQuery<IPage, Error>({
    queryKey: ["public-page", spaceSlug ?? "root", slug],
    queryFn: () =>
      spaceSlug
        ? PagesService.getPublicSpacePage(spaceSlug, slug)
        : PagesService.getPublicRootPage(slug),
    // Se por algum motivo o slug vier vazio, não busca
    enabled: !!slug,
    // Cache agressivo: página pública muda raramente
    staleTime: 5 * 60 * 1000, // 5 min
    retry: (failureCount, error) => {
      // Não tenta de novo se for 404
      if (error.message === "NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  // Erro 404 → "página não encontrada"
  const isNotFound = query.isError && query.error?.message === "NOT_FOUND";

  return {
    page: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isNotFound,
    error: query.error,
    refetch: query.refetch,
  };
}
