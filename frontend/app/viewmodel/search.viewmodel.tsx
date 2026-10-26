import useDebounce from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ServicesService } from "../service/services.service";
import { ArticleService } from "../service/article.service";
import { PagesService } from "../service/pages.service";

export default function useSearch(term: string) {
  const [search, setSearch] = useState<string>(term);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  const articlesQuery = useQuery({
    queryKey: ["articles", page, limit, debouncedSearch],
    queryFn: () => ArticleService.getArticles(debouncedSearch),
    staleTime: 1000 * 60 * 5,
  });

  const pagesQuery = useQuery({
    queryKey: ["pages", page, limit, debouncedSearch],
    queryFn: () => PagesService.getPublicPages(debouncedSearch),
    staleTime: 1000 * 60 * 5,
  });

  const { services } = servicesQuery.data || {};
  const articles = articlesQuery.data;
  const pages = pagesQuery.data;

  return {
    search,
    setSearch,
    isLoading:
      servicesQuery.isLoading &&
      pagesQuery.isLoading &&
      articlesQuery.isLoading,
    error:
      servicesQuery.error || pagesQuery.error || articlesQuery.error || null,
    isError:
      servicesQuery.isError || pagesQuery.isError || articlesQuery.isError,
    refetch:
      servicesQuery.refetch || pagesQuery.refetch || articlesQuery.refetch,
    services,
    pages,
    articles,
  };
}
