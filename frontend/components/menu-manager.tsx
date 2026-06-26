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
import { MenuModal } from "./menu-modal";
import { IMenu, IMenuItem } from "@/app/type/menu";
import { MenuItemTree } from "./menu-item-tree";

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
    selectedItem,
    setSelectedItem,
    isMenuModalOpen,
    setIsMenuModalOpen,
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
              <SelectTrigger className="w-[180px]">
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
          <Button>
            <Plus />
            Novo Menu
          </Button>
          <Button
            onClick={() => {
              setSelectedMode("create");
              setSelectedItem(null);
              setIsMenuModalOpen(true);
            }}
          >
            <Plus />
            Adicionar item
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {/* <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div> */}

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
        menuItem={selectedItem}
        mode={selectedItem ? "edit" : "create"}
        isOpen={isMenuModalOpen}
        onClose={() => {
          setIsMenuModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveItem}
        allItems={menuItems || []}
      />
    </div>
  );
}
