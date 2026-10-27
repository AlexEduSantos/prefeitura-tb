"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  OrganizationService,
  SpaceService,
  CategoryService,
} from "../service/organization.service";
import { IOrganization, ISpace, ICategory } from "../type/organization";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const EMPTY_ARRAY: any[] = [];

export function useOrganizationViewModel() {
  const queryClient = useQueryClient();

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => OrganizationService.getOrganizations(),
  });

  const orgsTreeQuery = useQuery({
    queryKey: ["organizations-tree", { includeInactive: "all" }],
    queryFn: () => OrganizationService.getTree("all"),
  });

  const spacesQuery = useQuery({
    queryKey: ["spaces"],
    queryFn: () => SpaceService.getSpaces(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoryService.getCategories(),
  });

  const categoriesTreeQuery = useQuery({
    queryKey: ["categories-tree"],
    queryFn: () => CategoryService.getTree(),
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: Partial<IOrganization>) =>
      OrganizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
      toast.success("Item criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar item", { description: error.message });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IOrganization> }) =>
      OrganizationService.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item", { description: error.message });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
      toast.success("Item excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir item", { description: error.message });
    },
  });

  const changeParentMutation = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      OrganizationService.changeParent(id, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
      toast.success("Hierarquia atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao mover unidade", { description: error.message });
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (data: Partial<ISpace>) => SpaceService.createSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Item criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar item", { description: error.message });
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ISpace> }) =>
      SpaceService.updateSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item", { description: error.message });
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: (id: string) => SpaceService.deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Item excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir item", { description: error.message });
    },
  });

  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentOrg, setCurrentOrg] = useState<IOrganization | null>(null);
  const [parentOrg, setParentOrg] = useState<IOrganization | null>(null);

  const handleAddChild = useCallback((org?: IOrganization) => {
    setModalMode("create");
    if (org) {
      setParentOrg(org);
    } else {
      setParentOrg(null);
    }
    setCurrentOrg(null);
    setOpen(true);
  }, []);

  const handleEdit = useCallback((org: IOrganization) => {
    setModalMode("edit");
    setCurrentOrg(org);
    setOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
    setModalMode("create");
    setParentOrg(null);
    setCurrentOrg(null);
  }, []);

  const handleSubmitModal = useCallback(
    (data: Partial<IOrganization>) => {
      const payload = {
        title: data.title,
        acronym: data.acronym,
        type: data.type,
        active: data.active,
        parentId: data.parentId || null,
        defaultSpaceId: data.defaultSpaceId || null,
      };

      if (currentOrg?.id) {
        updateOrgMutation.mutate({ id: currentOrg.id, data: payload });
      } else {
        createOrgMutation.mutate(payload);
      }
      handleCloseModal();
    },
    [currentOrg, updateOrgMutation, createOrgMutation, handleCloseModal],
  );

  const deleteOrgMutationRef = useRef(deleteOrgMutation);
  deleteOrgMutationRef.current = deleteOrgMutation;

  const handleDelete = useCallback((id: string) => {
    deleteOrgMutationRef.current.mutate(id);
  }, []);

  return {
    // Organizations
    organizations: orgsQuery.data ?? (EMPTY_ARRAY as IOrganization[]),
    organizationsTree: orgsTreeQuery.data ?? (EMPTY_ARRAY as IOrganization[]),
    isLoadingOrganizations: orgsQuery.isLoading || orgsTreeQuery.isLoading,
    createOrganization: createOrgMutation.mutate,
    updateOrganization: updateOrgMutation.mutate,
    deleteOrganization: deleteOrgMutation.mutate,
    changeParent: changeParentMutation.mutate,

    // Spaces
    spaces: spacesQuery.data ?? (EMPTY_ARRAY as ISpace[]),
    isLoadingSpaces: spacesQuery.isLoading,
    createSpace: createSpaceMutation.mutate,
    updateSpace: updateSpaceMutation.mutate,
    deleteSpace: deleteSpaceMutation.mutate,

    // Categories
    categories: categoriesQuery.data ?? (EMPTY_ARRAY as ICategory[]),
    categoriesTree: categoriesTreeQuery.data ?? (EMPTY_ARRAY as ICategory[]),
    isLoadingCategories: categoriesQuery.isLoading,

    // Modal
    open,
    setOpen,
    currentOrg,
    setCurrentOrg,
    handleAddChild,
    handleEdit,
    handleDelete,
    handleCloseModal,
    handleSubmitModal,
    modalMode,
    parentOrg,
  };
}
