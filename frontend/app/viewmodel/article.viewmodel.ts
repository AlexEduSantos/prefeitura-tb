"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArticleService } from "../service/article.service";
import { IArticle } from "../type/article";

export function ArticleViewModel() {
  const queryClient = useQueryClient();

  const articleQuery = useQuery({
    queryKey: ["article"],
    queryFn: () => ArticleService.getArticles(),
  });

  // mutations

  const createArticleMutation = useMutation({
    mutationFn: (data: Partial<IArticle>) =>
      ArticleService.createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IArticle> }) =>
      ArticleService.updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) =>
      ArticleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ArticleService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  const changeFeaturedMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      ArticleService.changeFeatured(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });

  return {
    article: articleQuery.data,
    isLoadingArticle: articleQuery.isLoading,
    isErrorArticle: articleQuery.isError,
    errorArticle: articleQuery.error,
    createArticle: createArticleMutation.mutate,
    updateArticle: updateArticleMutation.mutate,
    deleteArticle: deleteArticleMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    changeFeatured: changeFeaturedMutation.mutate,
  };
}

