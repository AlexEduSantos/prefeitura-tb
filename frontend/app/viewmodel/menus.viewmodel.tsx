"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenusService } from "../service/menus.service";
import { toast } from "sonner";
import { ICreateMenu, IMenu, IMenuItem } from "../type/menu";
import { useMemo, useState } from "react";
import { FlatMenuItem, flattenTreeWithLevel } from "@/lib/menuUtils";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeIcon,
  Pencil,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export function useMenusViewModel() {
  const router = useRouter();

  const queryClient = useQueryClient();

  // Query to fetch menu by location and entityId
  const getMenuQuery = useQuery<IMenu>({
    queryKey: ["menus"],
    queryFn: () => MenusService.getAll(),
    retry: false,
  });

  const getSubMenuQuery = useQuery<IMenuItem[]>({
    queryKey: ["subitems"],
    queryFn: () => MenusService.getAllSubItems(),
    retry: false,
  });

  // Mutation to create a menu
  const createMenuMutation = useMutation({
    mutationFn: (data: ICreateMenu) => MenusService.createMenu(data),
    onSuccess: (newMenu) => {
      queryClient.invalidateQueries({
        queryKey: ["menu", newMenu.location, newMenu.entityId],
      });
      toast.success("Menu criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar o menu.");
    },
  });

  // Mutation to sync menu items
  const syncMenuItemsMutation = useMutation({
    mutationFn: ({ menuId, items }: { menuId: string; items: IMenuItem[] }) =>
      MenusService.syncMenuItems(menuId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu"] }); // invalidate all menu queries to fetch updated hierarchy
      toast.success("Menu sincronizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao sincronizar os itens do menu.");
    },
  });

  // Estados dos filtros
  const [selectedMenuId, setSelectedMenuId] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"create" | "edit">("create");

  // Mapa menuId -> nome (para exibir na coluna "Menu")
  const menuMap = useMemo(() => {
    const data = getMenuQuery.data as IMenu[] | undefined;
    if (!data || !Array.isArray(data)) return new Map<string, string>();
    return new Map(data.map((m) => [m.id, m.name]));
  }, [getMenuQuery.data]);

  // 1. Converte todos os subMenus em lista plana com níveis (com memo)
  const allFlatItems = useMemo(() => {
    if (!getSubMenuQuery.data) return [] as FlatMenuItem[];
    return flattenTreeWithLevel(getSubMenuQuery.data as any);
  }, [getSubMenuQuery.data]);

  // 2. Aplica os filtros sobre a lista plana
  const filteredItems = useMemo(() => {
    let result = allFlatItems;

    if (selectedMenuId !== "all") {
      result = result.filter((item) => item.menuId === selectedMenuId);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => item.label.toLowerCase().includes(term));
    }

    if (selectedLevel !== "all") {
      result = result.filter((item) => item.level === selectedLevel);
    }

    return result;
  }, [allFlatItems, selectedMenuId, searchTerm, selectedLevel]);

  // 3. Handle View
  const hasFullUrl = (item: FlatMenuItem) => {
    if (item.url && item.url !== "#" && item.url !== "/") {
      return true;
    }
    return false;
  };

  const handleView = (slug: string) => {
    let url: string = "";
    if (slug !== "#" && slug !== "/") {
      url = slug;
    } else if (slug.startsWith("/")) {
      url = slug;
    } else if (slug.startsWith("http")) {
      url = slug;
    }
    console.log("slug", url);
    window.open(url, "_blank");
  };

  // Definição das colunas (use useMemo para evitar recriação)
  const columns = useMemo<ColumnDef<FlatMenuItem>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-4 h-4 ml-1 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-4 h-4 ml-1 text-primary" />
              ) : (
                <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const item = row.original;
          const indent = `\u00A0 - \u00A0`.repeat(item.level);
          const prefix = item.level > 0 ? `${indent} ` : "";
          return (
            <span className="font-medium">
              {prefix}
              {item.label}
            </span>
          );
        },
      },
      {
        accessorKey: "url",
        header: "Caminho",
        cell: ({ row }) => {
          let url: string;
          const slug = row.original.page?.slug;
          if (slug) {
            url = `/${slug}`;
          } else if (
            !row.original.url ||
            row.original.url === "#" ||
            row.original.url === "/"
          ) {
            url = "-";
          } else {
            url = row.original.url;
          }
          return <span className="max-w-40">{url}</span>;
        },
      },
      {
        id: "menu",
        accessorKey: "menuId",
        sortingFn: (rowA, rowB) => {
          const nameA = menuMap.get(rowA.original.menuId) || "";
          const nameB = menuMap.get(rowB.original.menuId) || "";
          return nameA.localeCompare(nameB);
        },
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Menu
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="w-4 h-4 ml-1 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="w-4 h-4 ml-1 text-primary" />
            ) : (
              <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const menuName = menuMap.get(row.original.menuId) || " ";
          return <span>{menuName}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Criado em
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="w-4 h-4 ml-1 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="w-4 h-4 ml-1 text-primary" />
            ) : (
              <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.original.createdAt;
          if (!date) return <span>-</span>;
          return <span>{format(new Date(date), "dd/MM/yyyy 'às' HH:mm")}</span>;
        },
      },
      {
        id: "Ações",
        header: "Ações",
        cell: ({ row }) => {
          const item = row.original;
          const url = row.original.page?.slug || item.url;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!hasFullUrl(item)}
                onClick={() => handleView(url!)}
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSelectedMode("edit");
                  setSelectedItem(row.original); // agora row.original é acessível
                  setIsMenuModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [menuMap],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(), // <-- adicione
    onSortingChange: setSorting, // <-- conecte
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      sorting, // <-- inclua
    },
  });

  // Opções para o seletor de nível
  const levelOptions = useMemo(() => {
    const levels = new Set(allFlatItems.map((item) => item.level));
    return Array.from(levels).sort((a, b) => a - b);
  }, [allFlatItems]);

  return {
    menus: getMenuQuery.data,
    isLoadingMenu: getMenuQuery.isLoading,
    isErrorMenu: getMenuQuery.isError,
    errorMenu: getMenuQuery.error,
    refetchMenu: getMenuQuery.refetch,

    subMenus: getSubMenuQuery.data,
    isLoadingSubMenu: getSubMenuQuery.isLoading,
    isErrorSubMenu: getSubMenuQuery.isError,
    errorSubMenu: getSubMenuQuery.error,
    refetchSubMenu: getSubMenuQuery.refetch,

    createMenu: createMenuMutation,
    syncMenuItems: syncMenuItemsMutation,

    selectedMenuId,
    setSelectedMenuId,
    searchTerm,
    setSearchTerm,
    selectedLevel,
    setSelectedLevel,
    rowSelection,
    setRowSelection,
    columns,
    table,
    levelOptions,
    sorting,
    setSorting,

    selectedItem,
    setSelectedItem,
    isMenuModalOpen,
    setIsMenuModalOpen,
    selectedMode,
  };
}
