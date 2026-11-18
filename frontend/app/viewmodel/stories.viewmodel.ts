import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StoriesService } from "../service/stories.service";
import { IStories, IStoriesItem } from "../type/stories";
import { toast } from "sonner";

export function useStories(modeType: "admin" | "public" = "admin") {
  const queryClient = useQueryClient();

  // Estados de paginação e busca
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Estados de modais
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    storyId: string;
    itemId: string;
  } | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  // Query de stories
  const {
    data: storiesQuery,
    isLoading: isLoadingStories,
    error: errorStories,
    isSuccess: isSuccessStories,
    isError: isErrorStories,
    refetch: refetchStories,
  } = useQuery({
    queryKey: ["stories", modeType, page, limit, search],
    queryFn: () =>
      modeType === "admin"
        ? StoriesService.getAdminStoriesList({ page, limit, title: search })
        : StoriesService.getStoriesList({ page, limit, title: search }),
    staleTime: 1000 * 60 * 5,
  });

  // --- Mutations ---

  // Criar Story
  const createStoryMutation = useMutation({
    mutationFn: (data: Partial<IStories>) => StoriesService.createStories(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Destaque criado com sucesso!");
      setCreateStoryModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar destaque");
    },
  });

  // Atualizar Story
  const updateStoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IStories> }) =>
      StoriesService.updateStories(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Destaque atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar destaque");
    },
  });

  // Deletar Story
  const deleteStoryMutation = useMutation({
    mutationFn: (id: string) => StoriesService.deleteStories(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Destaque removido com sucesso!");
      setStoryToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover destaque");
    },
  });

  // Criar Item
  const createStoryItemMutation = useMutation({
    mutationFn: ({
      storyId,
      data,
    }: {
      storyId: string;
      data: Partial<IStoriesItem>;
    }) => StoriesService.createStoriesItem(storyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Item adicionado com sucesso!");
      setMediaPickerOpen(false);
      setCurrentStoryId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar item");
    },
  });

  // Atualizar Item
  const updateStoryItemMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<IStoriesItem>;
    }) => StoriesService.updateStoriesItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar item");
    },
  });

  // Deletar Item
  const deleteStoryItemMutation = useMutation({
    mutationFn: (id: string) => StoriesService.deleteStoriesItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Item removido com sucesso!");
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover item");
    },
  });

  // Atualizar ordem
  const updateOrderMutation = useMutation({
    mutationFn: (ids: string[]) => StoriesService.updateOrderStoriesItems(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Ordem atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar ordem");
    },
  });

  // Funções auxiliares
  const openCreateStoryModal = () => setCreateStoryModalOpen(true);
  const closeCreateStoryModal = () => setCreateStoryModalOpen(false);

  const openMediaPicker = (storyId: string) => {
    setCurrentStoryId(storyId);
    setMediaPickerOpen(true);
  };
  const closeMediaPicker = () => {
    setMediaPickerOpen(false);
    setCurrentStoryId(null);
  };

  const handleSelectMedia = (media: { id: string } | Array<{ id: string }>) => {
    if (!currentStoryId) return;
    const selected = Array.isArray(media) ? media[0] : media;
    createStoryItemMutation.mutate({
      storyId: currentStoryId,
      data: { mediaId: selected.id },
    });
  };

  const confirmDeleteItem = (storyId: string, itemId: string) => {
    setItemToDelete({ storyId, itemId });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStory = (storyId: string) => {
    setStoryToDelete(storyId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteStoryItemMutation.mutate(itemToDelete.itemId);
    } else if (storyToDelete) {
      deleteStoryMutation.mutate(storyToDelete);
    }
    setDeleteDialogOpen(false);
  };

  const handleReorder = (storyId: string, newOrder: string[]) => {
    updateOrderMutation.mutate(newOrder);
  };

  return {
    storiesQuery,
    isLoadingStories,
    errorStories,
    isSuccessStories,
    isErrorStories,
    refetchStories,

    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,

    createStoryModalOpen,
    openCreateStoryModal,
    closeCreateStoryModal,
    mediaPickerOpen,
    openMediaPicker,
    closeMediaPicker,
    handleSelectMedia,
    deleteDialogOpen,
    setDeleteDialogOpen,
    confirmDeleteItem,
    confirmDeleteStory,
    handleDeleteConfirm,
    itemToDelete,
    storyToDelete,

    createStoryMutation,
    updateStoryMutation,
    deleteStoryMutation,
    createStoryItemMutation,
    updateStoryItemMutation,
    deleteStoryItemMutation,
    updateOrderMutation,

    handleReorder,
  };
}
