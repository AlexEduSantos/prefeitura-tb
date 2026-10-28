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
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { format } from "date-fns";

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

export function useSpace() {
  const [openModal, setOpenModal] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ISpace> | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const { spaces, deleteSpace, updateSpace, createSpace } =
    useOrganizationViewModel();

  const columns: ColumnDef<ISpace>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <span className="text-sm text-muted-foreground max-w-80! line-clamp-1">
            {description}
          </span>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Caminho",
      cell: ({ row }) => {
        const slug = row.getValue("slug") as string;
        return <span className="text-sm text-muted-foreground">{slug}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Criado em
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "dd/MM/yyyy")}
          </span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Atualizado em
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as string;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "dd/MM/yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const space = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                handleEditSpace(space);
              }}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => deleteSpace(space.id)}
            >
              <TrashIcon />
            </Button>
          </div>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    title: true,
    slug: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: spaces,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleAddSpace = () => {
    setModalMode("create");
    setOpenModal(true);
    setInitialData(null);
  };

  const handleEditSpace = (space: ISpace) => {
    setModalMode("edit");
    setInitialData(space);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setTimeout(() => {
      setInitialData(null);
    }, 300);
  };

  return {
    columns,
    table,
    openModal,
    setOpenModal,
    initialData,
    setInitialData,
    modalMode,
    setModalMode,
    handleAddSpace,
    handleEditSpace,
    handleCloseModal,
    // 👇 Adicione estas três linhas:
    createSpace,
    updateSpace,
    deleteSpace,
  };
}
