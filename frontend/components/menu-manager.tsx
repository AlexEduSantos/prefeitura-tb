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
import { Search } from "lucide-react";
import { useMenusViewModel } from "@/app/viewmodel/menus.viewmodel";

export function MenusManager() {
  const {
    menus,
    isLoadingMenu,
    isLoadingSubMenu,
    isErrorMenu,
    errorMenu,
    selectedMenuId,
    setSelectedMenuId,
    searchTerm,
    setSearchTerm,
    selectedLevel,
    setSelectedLevel,
    levelOptions,
    table,
    columns,
  } = useMenusViewModel();

  // Estados de loading e erro
  if (isLoadingMenu || isLoadingSubMenu) {
    return <div>Carregando itens...</div>;
  }

  if (isErrorMenu) {
    return <div>Erro ao carregar menus: {errorMenu?.message}</div>;
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Seletor de Menu */}
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
              {menus?.map((menu) => (
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

        {/* Seletor de nível */}
        <div className="w-full md:w-auto">
          <Select
            value={String(selectedLevel)}
            onValueChange={(value) =>
              setSelectedLevel(value === "all" ? "all" : Number(value))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos os níveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {levelOptions.map((level) => (
                <SelectItem key={level} value={String(level)}>
                  Nível {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border overflow-hidden">
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
    </div>
  );
}
