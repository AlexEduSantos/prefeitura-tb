"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FoldersService } from "../service/folders.service";
import { useMediaViewModel } from "./media.viewmodel";
import { toast } from "sonner";
import { useState } from "react";

export function useFolders() {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "rename">("create");
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Queries & mutations
  const queryClient = useQueryClient();

  const { refetchMedia } = useMediaViewModel();

  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      FoldersService.createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      FoldersService.renameFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      FoldersService.moveFolder(id, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => FoldersService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Pasta excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir pasta");
    },
  });

  // Funções de ação
  const submitCreateFolder = (data: any) => {
    if (modalType === "create") {
      const name = newFolderName.trim();
      if (!name) return;

      createFolderMutation.mutate(
        { name, parentId: data?.currentFolderId || undefined },
        {
          onSuccess: () => {
            toast.success("Pasta criada com sucesso!");
            setNewFolderName(""); // Limpa o input
            setIsFolderModalOpen(false); // Fecha o modal
            refetchMedia();
          },
          onError: () => {
            toast.error("Erro ao criar pasta");
          },
        },
      );
    } else {
      const name = newFolderName.trim();
      if (!name || !currentFolderId) return;

      renameFolderMutation.mutate(
        { id: currentFolderId, name },
        {
          onSuccess: () => {
            toast.success("Pasta renomeada com sucesso!");
            setNewFolderName(""); // Limpa o input
            setIsFolderModalOpen(false); // Fecha o modal
            refetchMedia();
          },
          onError: () => {
            toast.error("Erro ao renomear pasta");
          },
        },
      );
    }
  };

  const handleRenameFolder = (id: string, currentName: string) => {
    setCurrentFolderId(id);
    setModalType("rename");
    setNewFolderName(currentName);
    setIsFolderModalOpen(true);
  };

  return {
    isFolderModalOpen,
    setIsFolderModalOpen,
    newFolderName,
    setNewFolderName,
    submitCreateFolder,
    handleRenameFolder,
    handleDeleteFolder: deleteFolderMutation.mutate,
    modalType,
    setModalType,
  };
}
