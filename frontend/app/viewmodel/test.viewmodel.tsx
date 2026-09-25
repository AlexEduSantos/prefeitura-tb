"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArticleService } from "../service/article.service";

export default function useTest() {
  const [searchInput, setSearchInput] = useState("");
  // Termo de busca ativo enviado para o backend
  const [activeSearch, setActiveSearch] = useState("");

  const queryClient = useQueryClient();

  const articleQuery = useQuery({
    queryKey: ["article", activeSearch],
    queryFn: () => ArticleService.getArticles(activeSearch),
  });

  return {
    article: articleQuery.data,
    isLoadingArticle: articleQuery.isLoading,

    searchInput,
    setSearchInput,
    setActiveSearch,
  };
}
