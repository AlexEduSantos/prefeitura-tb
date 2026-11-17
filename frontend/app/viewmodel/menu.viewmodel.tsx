"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItemService, MenuService } from "../service/menu.service";
import { IMenu, IMenuItem } from "../type/menu";
import { useState } from "react";
import { toast } from "sonner";

export function useMenu() {
  const queryClient = useQueryClient();

  // ─── Estados de filtros ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Estados dos modais ────────────────────────────────────────────────
  const [openMenuModal, setOpenMenuModal] = useState(false);
  const [menuModalMode, setMenuModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [menuToEdit, setMenuToEdit] = useState<IMenu | undefined>();

  const [openMenuItemModal, setOpenMenuItemModal] = useState(false);
  const [menuItemModalMode, setMenuItemModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [menuItemToEdit, setMenuItemToEdit] = useState<IMenuItem | undefined>();
  const [menuItemParentId, setMenuItemParentId] = useState<string | null>(null);
  const [menuItemMenuId, setMenuItemMenuId] = useState<string>("");

  // ─── Queries ───────────────────────────────────────────────────────────
  const {
    data: menus,
    isLoading: isLoadingMenus,
    error: errorMenus,
    isError: isErrorMenus,
  } = useQuery({
    queryKey: ["menus"],
    queryFn: () => MenuService.getMenus(),
  });

  // ─── Mutations - Menu ──────────────────────────────────────────────────
  const createMenuMutation = useMutation({
    mutationFn: (data: Partial<IMenu>) => MenuService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu cadastrado com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao cadastrar menu!", { description: error.message }),
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IMenu> }) =>
      MenuService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu atualizado com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao atualizar menu!", { description: error.message }),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id: string) => MenuService.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu excluído com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao excluir menu!", { description: error.message }),
  });

  // ─── Mutations - Menu Item ─────────────────────────────────────────────
  const createMenuItemMutation = useMutation({
    mutationFn: ({
      data,
      menuId,
    }: {
      data: Partial<IMenuItem>;
      menuId: string;
    }) => MenuItemService.createMenuItem(data, menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Item cadastrado com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao cadastrar item!", { description: error.message }),
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IMenuItem> }) =>
      MenuItemService.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao atualizar item!", { description: error.message }),
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: (id: string) => MenuItemService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Item excluído com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao excluir item!", { description: error.message }),
  });

  const reorderMenuItemsMutation = useMutation({
    mutationFn: ({
      menuId,
      items,
    }: {
      menuId: string;
      items: Partial<IMenuItem>[];
    }) => MenuItemService.reorderMenuItems(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Itens reordenados com sucesso!");
    },
    onError: (error: Error) =>
      toast.error("Erro ao reordenar itens!", { description: error.message }),
  });

  // ─── Handlers - Menu ───────────────────────────────────────────────────
  const handleCreateMenu = (data: Partial<IMenu>) =>
    createMenuMutation.mutate(data);

  const handleUpdateMenu = (data: Partial<IMenu>) => {
    if (!menuToEdit) return;
    updateMenuMutation.mutate({ id: menuToEdit.id, data });
  };

  const handleDeleteMenu = (id: string) => deleteMenuMutation.mutate(id);

  /** Abre o modal de menu em modo create */
  const openCreateMenuModal = () => {
    setMenuToEdit(undefined);
    setMenuModalMode("create");
    setOpenMenuModal(true);
  };

  /** Abre o modal de menu em modo edit */
  const openEditMenuModal = (menu: IMenu) => {
    setMenuToEdit(menu);
    setMenuModalMode("edit");
    setOpenMenuModal(true);
  };

  // ─── Handlers - Menu Item ──────────────────────────────────────────────
  const handleCreateMenuItem = (data: Partial<IMenuItem>) => {
    if (!menuItemMenuId) return;
    createMenuItemMutation.mutate({ data, menuId: menuItemMenuId });
  };

  const handleUpdateMenuItem = (data: Partial<IMenuItem>) => {
    if (!menuItemToEdit) return;
    updateMenuItemMutation.mutate({ id: menuItemToEdit.id, data });
  };

  const handleDeleteMenuItem = (id: string) =>
    deleteMenuItemMutation.mutate(id);

  const handleReorderMenuItems = (
    menuId: string,
    items: Partial<IMenuItem>[],
  ) => reorderMenuItemsMutation.mutate({ menuId, items });

  /** Abre o modal de item em modo create (com ou sem pai) */
  const openCreateMenuItemModal = (
    menuId: string,
    parentId: string | null = null,
  ) => {
    setMenuItemMenuId(menuId);
    setMenuItemParentId(parentId);
    setMenuItemToEdit(undefined);
    setMenuItemModalMode("create");
    setOpenMenuItemModal(true);
  };

  /** Abre o modal de item em modo edit */
  const openEditMenuItemModal = (item: IMenuItem) => {
    setMenuItemMenuId(item.menuId);
    setMenuItemParentId(item.parentId);
    setMenuItemToEdit(item);
    setMenuItemModalMode("edit");
    setOpenMenuItemModal(true);
  };

  return {
    // Dados
    menus,
    isLoadingMenus,
    errorMenus,
    isErrorMenus,

    // Modal - Menu
    openMenuModal,
    setOpenMenuModal,
    menuModalMode,
    menuToEdit,
    openCreateMenuModal,
    openEditMenuModal,

    // Modal - Menu Item
    openMenuItemModal,
    setOpenMenuItemModal,
    menuItemModalMode,
    menuItemToEdit,
    menuItemParentId,
    menuItemMenuId,
    openCreateMenuItemModal,
    openEditMenuItemModal,

    // Handlers
    handleCreateMenu,
    handleUpdateMenu,
    handleDeleteMenu,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleReorderMenuItems,

    // Filtros
    searchQuery,
    setSearchQuery,
  };
}

export function useMenuOnly(id: string) {
  const {
    data: menu,
    isLoading: isLoadingMenu,
    isError: isErrorMenu,
  } = useQuery({
    queryKey: ["menus", id],
    queryFn: () => MenuService.getMenu(id),
    enabled: !!id,
  });
  return { menu, isLoadingMenu, isErrorMenu };
}

export function useMenuByLocation(
  location: "header" | "footer" | "sidebar" | "mobile",
  preferredTitle?: string,
) {
  const {
    data: menus,
    isLoading: isLoadingMenu,
    isError: isErrorMenu,
  } = useQuery({
    queryKey: ["menus", "location", location],
    queryFn: () =>
      MenuService.getMenuByField({ field: "location", value: location }),
    enabled: !!location,
  });

  const activeMenus = (menus || []).filter((m) => m.active !== false);
  const pool = activeMenus.length > 0 ? activeMenus : menus || [];

  let menu: IMenu | undefined;
  if (preferredTitle) {
    const target = preferredTitle.trim().toLowerCase();
    menu = pool.find((m) => m.title?.trim().toLowerCase() === target);
  }
  if (!menu) {
    menu = pool[0];
  }

  return { menu, isLoadingMenu, isErrorMenu };
}
