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
import Link from "next/link";

export function useMenusViewModel() {
  const router = useRouter();

  const queryClient = useQueryClient();

  // NOVO: estados para paginação dos menus
  const [menuPage, setMenuPage] = useState(1);
  const [menuLimit, setMenuLimit] = useState(10);
  const [menuSortBy, setMenuSortBy] = useState<string | undefined>("name");
  const [menuOrder, setMenuOrder] = useState<"asc" | "desc">("asc");

  // Query para buscar menus com paginação
  const {
    data: menus,
    isLoading: isLoadingMenus,
    error: errorMenus,
  } = useQuery({
    queryKey: ["menus", menuPage, menuLimit, menuSortBy, menuOrder],
    queryFn: () =>
      MenusService.getAll({
        page: menuPage,
        limit: menuLimit,
        sortBy: menuSortBy,
        order: menuOrder,
      }),
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

  const updateMenuMutation = useMutation({
    mutationFn: ({
      menuId,
      data,
    }: {
      menuId: string;
      data: Partial<ICreateMenu>;
    }) => MenusService.updateMenu(menuId, data),
    onSuccess: (updatedMenu) => {
      queryClient.invalidateQueries({
        queryKey: ["menu", updatedMenu.location, updatedMenu.entityId],
      });
      toast.success("Menu atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar o menu.");
    },
  });

  // Mutation para deletar um menu
  const deleteMenuMutation = useMutation({
    mutationFn: (menuId: string) => MenusService.deleteMenu(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar o menu.");
    },
  });

  // Query para buscar todos os subitens (se ainda for usado) - com paginação
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: errorMenuItems,
  } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => MenusService.getAllMenuItems(),
    retry: false,
  });

  // Mutation para criar um item individual (se necessário)
  const createItemMutation = useMutation({
    mutationFn: ({
      menuId,
      data,
    }: {
      menuId: string;
      data: Partial<IMenuItem>;
    }) => MenusService.createItem(menuId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subitems"] });
      toast.success("Item criado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar item.");
    },
  });

  // Mutation para atualizar um item
  const updateItemMutation = useMutation({
    mutationFn: ({
      menuId,
      itemId,
      data,
    }: {
      menuId: string;
      itemId: string;
      data: Partial<IMenuItem>;
    }) => MenusService.updateItem(menuId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Item atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar item.");
    },
  });

  // Mutation para deletar um item
  const deleteItemMutation = useMutation({
    mutationFn: ({ menuId, itemId }: { menuId: string; itemId: string }) =>
      MenusService.deleteItem(menuId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Item removido!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover item.");
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
    const data = menus as IMenu[] | undefined;
    if (!data || !Array.isArray(data)) return new Map<string, string>();
    return new Map(data.map((m) => [m.id, m.name]));
  }, [menus]);

  // 1. Converte todos os subMenus em lista plana com níveis (com memo)
  const allFlatItems = useMemo(() => {
    if (!menuItems) return [] as FlatMenuItem[];
    return flattenTreeWithLevel(menuItems);
  }, [menuItems]);

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
  const hasFullUrl = (item: string) => {
    if (item && item !== "#" && item !== "/") {
      return true;
    }
    return false;
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
          return <span>{row.original.menu.name}</span>;
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
          const item = row.original.page?.slug || row.original.url;
          const url = item ? item : "#";

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!hasFullUrl(url!)}
              >
                <Link href={url!} target="_blank">
                  <EyeIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => {
                  setSelectedMode("edit");
                  setSelectedItem(row.original); // agora row.original é acessível
                  setIsMenuModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => {
                  deleteItemMutation.mutate({
                    menuId: row.original.menuId,
                    itemId: row.original.id,
                  });
                }}
              >
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

  // 1. Primeiro, filtre os itens (aplicando os filtros de menu, busca e nível - mas nível será ignorado na árvore)
  const filteredMenuItems = useMemo(() => {
    let items = menuItems || [];

    if (selectedMenuId !== "all") {
      items = items.filter((item: IMenuItem) => item.menuId === selectedMenuId);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      items = items.filter((item: IMenuItem) =>
        item.label.toLowerCase().includes(term),
      );
    }

    return items;
  }, [menuItems, selectedMenuId, searchTerm]);

  const rootItems = useMemo(() => {
    const itemMap = new Map<string, IMenuItem & { children: IMenuItem[] }>();
    const roots: (IMenuItem & { children: IMenuItem[] })[] = [];

    filteredMenuItems.forEach((item: IMenuItem) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    filteredMenuItems.forEach((item: IMenuItem) => {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (nodes: any[]) => {
      nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      nodes.forEach((node) => sortChildren(node.children));
    };
    sortChildren(roots);

    return roots;
  }, [filteredMenuItems]);

  return {
    menus,
    isLoadingMenus,
    errorMenus,

    menuItems,
    isLoadingMenuItems,
    errorMenuItems,

    createMenu: createMenuMutation,
    updateMenu: updateMenuMutation,
    deleteMenu: deleteMenuMutation,

    createItem: createItemMutation,
    updateItem: updateItemMutation,
    deleteItem: deleteItemMutation,

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
    setSelectedMode,

    rootItems,
    filteredMenuItems,
    menuMap,
  };
}

export function useMenuByLocation(entityId: string, location: string) {
  const { data: menuByLocation, isLoading: isLoadingMenuByLocation } = useQuery(
    {
      queryKey: ["menu", entityId, location],
      queryFn: () => MenusService.getMenuByLocation(entityId, location),
      retry: false,
    },
  );

  return { menuByLocation, isLoadingMenuByLocation };
}
