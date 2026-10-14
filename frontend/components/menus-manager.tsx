"use client";

import { useMemo } from "react";
import { useMenu } from "@/app/viewmodel/menu.viewmodel";
import { MenuTreeManager } from "./menu-tree-manager";
import { MenuModal } from "./menu-modal";
import { MenuItemModal } from "./menu-item-modal";
import { Button } from "./ui/button";
import { PlusIcon, Search } from "lucide-react";
import { Input } from "./ui/input";
import { IMenuItem } from "@/app/type/menu";

export default function MenusList() {
  const {
    menus,
    isLoadingMenus,
    errorMenus,
    searchQuery,
    setSearchQuery,

    openMenuModal,
    setOpenMenuModal,
    menuModalMode,
    menuToEdit,
    openCreateMenuModal,
    openEditMenuModal,
    handleCreateMenu,
    handleUpdateMenu,
    handleDeleteMenu,

    openMenuItemModal,
    setOpenMenuItemModal,
    menuItemModalMode,
    menuItemToEdit,
    menuItemParentId,
    menuItemMenuId,
    openCreateMenuItemModal,
    openEditMenuItemModal,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleReorderMenuItems,
  } = useMenu();

  // Função para remover acentos e converter para minúsculo
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // ✅ Filtro local por título
  const filteredMenus = useMemo(() => {
    if (!menus) return [];
    const query = normalize(searchQuery.trim());
    if (!query) return menus;

    return menus.filter((menu) => {
      if (normalize(menu.title).includes(query)) return true;
      // Busca recursiva nos itens
      const matchesItem = (items: IMenuItem[]): boolean =>
        items.some(
          (item) =>
            normalize(item.label).includes(query) ||
            (item.children && matchesItem(item.children)),
        );
      return matchesItem(menu.items);
    });
  }, [menus, searchQuery]);

  if (isLoadingMenus) return <>Carregando...</>;
  if (errorMenus) return <>Erro ao carregar menus</>;

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center gap-2">
        <div className="flex items-center gap-2 w-full relative">
          <Input
            placeholder="Pesquisar por título..."
            className="w-full relative z-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="size-5 absolute z-20 right-2 text-muted-foreground pointer-events-none" />
        </div>
        <Button onClick={openCreateMenuModal}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Criar Menu
        </Button>
      </div>

      {/* ✅ Estado vazio quando a busca não retorna nada */}
      {filteredMenus.length === 0 && searchQuery.trim() !== "" ? (
        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
          Nenhum menu encontrado para "{searchQuery}"
        </div>
      ) : (
        filteredMenus.map((menu) => (
          <MenuTreeManager
            key={menu.id}
            menu={menu}
            onEditMenu={openEditMenuModal}
            onDeleteMenu={handleDeleteMenu}
            onAddItemChild={(parentId) =>
              openCreateMenuItemModal(menu.id, parentId)
            }
            onEditItem={openEditMenuItemModal}
            onDeleteItem={handleDeleteMenuItem}
            onReorder={(items) => handleReorderMenuItems(menu.id, items)}
          />
        ))
      )}

      <MenuModal
        mode={menuModalMode}
        isOpen={openMenuModal}
        onClose={() => setOpenMenuModal(false)}
        onSubmit={(data) => {
          if (menuModalMode === "create") handleCreateMenu(data);
          else handleUpdateMenu(data);
          setOpenMenuModal(false);
        }}
        menu={menuToEdit}
      />

      <MenuItemModal
        mode={menuItemModalMode}
        isOpen={openMenuItemModal}
        onClose={() => setOpenMenuItemModal(false)}
        onSubmit={(data) => {
          if (menuItemModalMode === "create") handleCreateMenuItem(data);
          else handleUpdateMenuItem(data);
          setOpenMenuItemModal(false);
        }}
        item={menuItemToEdit}
        menuId={menuItemMenuId}
        parentId={menuItemParentId}
        siblingItems={menus?.find((m) => m.id === menuItemMenuId)?.items ?? []}
      />
    </div>
  );
}
