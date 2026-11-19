"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryService } from "../service/organization.service";
import { ICategory } from "../type/organization";
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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PenIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UseCategory() {
  const categoryQuery = useQuery({
    queryKey: ["category"],
    queryFn: () => CategoryService.getCategories(),
  });

  const queryClient = useQueryClient();

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<ICategory>) =>
      CategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Erro ao criar categoria");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: Partial<ICategory>) => {
      const { id, ...payload } = data;
      return CategoryService.updateCategory(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Categoria atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Erro ao atualizar categoria");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => CategoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Categoria deletada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Erro ao deletar categoria");
    },
  });

  // States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    title: true,
    slug: true,
    updatedAt: true,
    actions: true,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null,
  );

  // Tabela
  const columns: ColumnDef<ICategory>[] = [
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
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Apelido
          {column.getIsSorted() && column.getIsSorted() === "asc" ? (
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {row.getValue("slug")}
          </span>
        </div>
      ),
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
            <ArrowDownIcon className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) =>
        format(
          new Date(row.getValue("updatedAt") as string),
          "dd/MM/yyyy '-' HH:mm",
        ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            className="hover:bg-green-200 hover:text-green-600 text-green-500"
            size="icon"
            onClick={() => {
              setSelectedCategory(row.original);
              setMode("edit");
              setOpenModal(true);
            }}
          >
            <PenIcon />
          </Button>
          <Button
            variant="destructive"
            className="border-0"
            size="icon"
            onClick={() => {
              deleteCategoryMutation.mutate(row.original.id!);
            }}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable<ICategory>({
    data: categoryQuery.data || [],
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

  return {
    categories: categoryQuery.data,
    isLoadingcategories: categoryQuery.isLoading,
    errorcategories: categoryQuery.error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,

    columns,
    table,

    setOpenModal,
    setSelectedCategory,
    setMode,
    openModal,
    selectedCategory,
    mode,
  };
}
