"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PagesService } from "../service/pages.service";
import { IPage } from "../type/page";
import { toast } from "sonner";
import { useState } from "react";

export function usePagesViewModel() {
  const [isOpenNewPageModal, setIsOpenNewPageModal] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [id, setId] = useState("");

  const getPagesListQuery = useQuery<IPage[]>({
    queryKey: ["pages"],
    queryFn: () => PagesService.getPagesList(),
  });

  const getPageByIdQuery = useQuery({
    queryKey: ["page"],
    queryFn: () => PagesService.getPage(id),
  });

  // mutations
  const savePageMutation = useMutation({
    mutationFn: (data: any) => PagesService.savePage(data),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      PagesService.updatePage(id, data),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => PagesService.deletePage(id),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Página deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePublishedPageMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      PagesService.changePublishedPage(id, published),
    onSuccess: () => {
      getPagesListQuery.refetch();
      toast.success("Estado da página alterado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    pages: getPagesListQuery.data,
    isLoadingPage: getPagesListQuery.isLoading,
    isErrorPage: getPagesListQuery.isError,
    errorPage: getPagesListQuery.error,
    refetchPages: getPagesListQuery.refetch,
    savePage: savePageMutation,
    updatePage: updatePageMutation,
    deletePage: deletePageMutation,
    changePublished: changePublishedPageMutation,

    page: getPageByIdQuery.data,
    isLoadingPageById: getPageByIdQuery.isLoading,
    isErrorPageById: getPageByIdQuery.isError,
    errorPageById: getPageByIdQuery.error,
    refetchPageById: getPageByIdQuery.refetch,

    isOpenNewPageModal,
    setIsOpenNewPageModal,
    title,
    setTitle,
    slug,
    setSlug,
    id,
    setId,
  };
}
