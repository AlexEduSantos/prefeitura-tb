"use client";
import { usePagesViewModel } from "@/app/viewmodel/pages.viewmodel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { IPage } from "@/app/type/page";
import { Tabs, TabsList } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  EyeIcon,
  FileText,
  Pencil,
  PlusIcon,
  Search,
  Star,
  StickyNoteIcon,
  Trash,
  XCircleIcon,
} from "lucide-react";
import { ColumnDef, flexRender } from "@tanstack/react-table";
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
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { NewPageModal } from "./new-page-modal";
import { ViewPageModal } from "./view-page-modal";

export function PageManager() {
  const {
    pages,
    isLoadingPage,
    isErrorPage,
    errorPage,
    isOpenNewPageModal,
    isOpenViewModal,
    setIsOpenViewModal,
    modalMode,
    columns,
    table,
    page,
    isLoadingPageById,
    handleSubmitPage,
    handleOpenCreate,
    handleCloseNewPageModal,
  } = usePagesViewModel();

  if (isLoadingPage) return <div>Carregando...</div>;
  if (isErrorPage)
    return (
      <div className="flex items-center justify-center">
        Erro ao carregar páginas: {errorPage?.message}
      </div>
    );

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 w-full relative">
            <Input
              placeholder="Pesquisar por nome..."
              value={
                (table.getColumn("title")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="w-full relative z-10"
            />
            <Search className="size-5 absolute z-20 right-2 text-muted-foreground cursor-pointer" />
          </div>
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
              <DropdownMenuLabel>Estado</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={
                  table.getColumn("published")?.getFilterValue() === true
                    ? "published"
                    : table.getColumn("published")?.getFilterValue() === false
                      ? "unpublished"
                      : ""
                }
                onValueChange={(value) => {
                  const filterValue =
                    value === "published"
                      ? true
                      : value === "unpublished"
                        ? false
                        : undefined;
                  table.getColumn("published")?.setFilterValue(filterValue);
                }}
              >
                <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="published">
                  Publicado
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unpublished">
                  Não publicado
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  table.getColumn("published")?.setFilterValue(undefined);
                }}
              >
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
          <Button
            variant={"default"}
            size={"icon"}
            className="cursor-pointer min-w-fit px-2"
            onClick={handleOpenCreate}
          >
            <PlusIcon className="h-4 w-4" />
            Criar Página
          </Button>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        {pages && pages.length ? (
          <Table>
            <TableHeader className="bg-white ">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    Nenhuma página encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-24">
            <p>Nenhuma página encontrada.</p>
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-end px-2">
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
      <NewPageModal
        isOpen={isOpenNewPageModal}
        onClose={handleCloseNewPageModal}
        mode={modalMode}
        onSubmit={handleSubmitPage}
        initialData={
          page
            ? {
                content: page.content,
                organizationId: page.organizationId || "",
                spaceId: page.spaceId || "",
                title: page.title,
                slug: page.slug,
              }
            : undefined
        }
      />
      <ViewPageModal
        isOpen={isOpenViewModal}
        onClose={() => setIsOpenViewModal(false)}
        page={page}
        isLoading={isLoadingPageById}
      />
    </div>
  );
}
