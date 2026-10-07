"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  OrganizationService,
  SpaceService,
  CategoryService,
} from "../service/organization.service";
import { IOrganization, ISpace, ICategory } from "../type/organization";

export function useOrganizationViewModel() {
  const queryClient = useQueryClient();

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => OrganizationService.getOrganizations(),
  });

  const orgsTreeQuery = useQuery({
    queryKey: ["organizations-tree"],
    queryFn: () => OrganizationService.getTree(),
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
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IOrganization> }) =>
      OrganizationService.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations-tree"] });
    },
  });

  return {
    // Organizations
    organizations: orgsQuery.data ?? [],
    organizationsTree: orgsTreeQuery.data ?? [],
    isLoadingOrganizations: orgsQuery.isLoading,
    createOrganization: createOrgMutation.mutate,
    updateOrganization: updateOrgMutation.mutate,
    deleteOrganization: deleteOrgMutation.mutate,

    // Spaces
    spaces: spacesQuery.data ?? [],
    isLoadingSpaces: spacesQuery.isLoading,

    // Categories
    categories: categoriesQuery.data ?? [],
    categoriesTree: categoriesTreeQuery.data ?? [],
    isLoadingCategories: categoriesQuery.isLoading,
  };
}
