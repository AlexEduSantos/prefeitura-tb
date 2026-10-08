"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Star,
  FileText,
  CheckCircle,
  Trash,
  Search,
  ChevronDown,
  ClockAlertIcon,
  ArchiveIcon,
  Edit,
  PlusIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import { IArticle } from "@/app/type/article";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ArticlesList() {
  const {
    article,
    isLoadingArticle,
    isErrorArticle,
    errorArticle,
    searchInput,
    setSearchInput,
    handleSearchSubmit,
    handleSearchKeyDown,
    handleClearSearch,
    clearFilters,
    onNewArticle,
    columns,
    table,
  } = ArticleViewModel();

  if (isLoadingArticle) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Carregando artigos...
      </div>
    );
  }

  if (isErrorArticle) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Erro ao carregar artigos: {errorArticle?.message}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="relative w-full flex items-center">
              <Input
                placeholder="Pesquisar por título..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchInput.length > 0 && (
                <X
                  className="absolute size-4 cursor-pointer right-2 text-muted-foreground"
                  onClick={() => handleClearSearch()}
                />
              )}
            </div>
            <Button
              type="button"
              onClick={handleSearchSubmit}
              title="Pesquisar"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="whitespace-nowrap"
            onClick={onNewArticle}
            type="button"
          >
            <PlusIcon />
            Novo Artigo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-white">
                Filtros <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-50 max-h-96 overflow-y-auto"
            >
              <DropdownMenuLabel>Destaque</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("featured")?.getFilterValue() === true}
                onCheckedChange={(value) =>
                  table
                    .getColumn("featured")
                    ?.setFilterValue(value ? true : undefined)
                }
              >
                Apenas destaques
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={
                  (table.getColumn("status")?.getFilterValue() as string) || ""
                }
                onValueChange={(value) =>
                  table.getColumn("status")?.setFilterValue(value || undefined)
                }
              >
                <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="publicado">
                  Publicado
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rascunho">
                  Rascunho
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="excluido">
                  Excluído
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="arquivado">
                  Arquivado
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expirado">
                  Expirado
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Tipo</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={
                  (table.getColumn("type")?.getFilterValue() as string) || ""
                }
                onValueChange={(value) =>
                  table.getColumn("type")?.setFilterValue(value || undefined)
                }
              >
                <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="article">
                  Matéria
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="event">
                  Evento
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="note">Nota</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Categoria</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={clearFilters}>
                Limpar filtros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
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
                  Nenhum artigo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 px-2">
        <div className="flex items-center gap-2 min-w-70">
          <Button
            variant="outline"
            size="sm"
            className="w-1/2"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-1/2"
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
