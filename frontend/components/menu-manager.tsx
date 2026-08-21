import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useMenusViewModel } from "@/app/viewmodel/menus.viewmodel";
import { MenuItemModal } from "./menu-item-modal";
import { IMenu, IMenuItem } from "@/app/type/menu";
import { MenuItemTree } from "./menu-item-tree";
import { MenuModal } from "./menu-modal";

export function MenusManager() {
  const {
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
    levelOptions,
    table,
    columns,
    selectedMenu,
    setSelectedMenu,
    selectedItem,
    setSelectedItem,
    isMenuModalOpen,
    setIsMenuModalOpen,
    isMenuItemModalOpen,
    setIsMenuItemModalOpen,
    selectedMode,
    setSelectedMode,
    rootItems,
    filteredMenuItems,
    menuMap,
  } = useMenusViewModel();

  const handleSaveItem = (data: Partial<IMenuItem>) => {
    if (selectedItem) {
      updateItemMutation.mutate({
        menuId: data.menuId || selectedItem.menuId,
        itemId: selectedItem.id,
        data,
      });
    } else {
      createItemMutation.mutate({
        menuId: data.menuId || (selectedMenuId !== "all" ? selectedMenuId : ""),
        data: data as IMenuItem,
      });
    }
    setIsMenuModalOpen(false);
    setSelectedItem(null);
  };

  // Estados de loading e erro
  if (isLoadingMenus || isLoadingMenuItems) {
    return <div>Carregando itens...</div>;
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Seletor de Menu */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-auto">
            <Select
              value={selectedMenuId}
              onValueChange={(value) => setSelectedMenuId(value)}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Todos os menus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os menus</SelectItem>
                {menus?.data?.map((menu: IMenu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Barra de pesquisa */}
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Pesquisar por label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedMode("create");
              setSelectedItem(null);
              setIsMenuModalOpen(true);
            }}
          >
            <Plus />
            Novo Menu
          </Button>
          {menus && menus?.data && menus.data.length > 0 && (
            <Button
              onClick={() => {
                setSelectedMode("create");
                setSelectedItem(null);
                setIsMenuItemModalOpen(true);
              }}
            >
              <Plus />
              Adicionar item
            </Button>
          )}
        </div>
      </div>

      <div>
        <MenuItemTree
          items={rootItems}
          onEdit={(item) => {
            setSelectedItem(item);
            setSelectedMode("edit");
            setIsMenuModalOpen(true);
          }}
          onDelete={(item) => {
            deleteItemMutation.mutate({
              menuId: item.menuId,
              itemId: item.id,
            });
          }}
          onView={(item) => {
            // opcional
          }}
        />
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>

      <MenuModal
        isOpen={isMenuModalOpen}
        mode={selectedMode}
        menu={selectedMenu}
        onSave={(data) => {
          if (selectedMode === "edit") {
            updateMenuMutation.mutate({
              menuId: selectedMenu?.id || "",
              data,
            });
          } else {
            createMenuMutation.mutate(data);
          }
        }}
        onClose={() => setIsMenuModalOpen(false)}
      />

      <MenuItemModal
        menuItem={selectedItem}
        mode={selectedItem ? "edit" : "create"}
        isOpen={isMenuItemModalOpen}
        onClose={() => {
          setIsMenuItemModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveItem}
        allItems={menuItems || []}
      />
    </div>
  );
}
