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
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
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
import { useState } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const columns: ColumnDef<IPage>[] = [
  {
    accessorKey: "published",
    header: "Estado",
    cell: ({ row, table }) => {
      const published = row.original.published;
      const meta = table.options.meta as any;

      const handlePublishedChange = () => {
        console.log({ id: row.original.id, published: !published });
        meta?.changePublished?.mutate({
          id: row.original.id,
          published: !published,
        });
      };

      const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
          case "published":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
          case "unpublished":
            return <Trash className="h-4 w-4 text-red-500" />;
          default:
            return <FileText className="h-4 w-4 text-gray-500" />;
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer stroke-1"
            onClick={handlePublishedChange}
            title={published ? "Despublicar" : "Publicar"}
            type="button"
          >
            {published ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium px-4">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "slug",
    header: "Caminho",
    cell: ({ row }) => (
      <div className="font-medium text-muted-foreground">
        {row.getValue("slug")}
      </div>
    ),
  },
  {
    id: "Ações",
    header: "Ações",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 w-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          title="Ver"
        >
          <EyeIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          title="Deletar"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

export function PageManager() {
  const {
    pages,
    refetchPages,
    isLoadingPage,
    isErrorPage,
    errorPage,
    savePage,
    updatePage,
    deletePage,
    changePublished,
  } = usePagesViewModel();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    published: true,
    title: true,
    slug: true,
    Ações: true,
  });
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: pages || [],
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
    meta: {
      changePublished,
    },
  });

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
              className="w-[200px] max-h-96 overflow-y-auto"
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
              <SelectTrigger className="h-8 w-[70px]">
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
          >
            <PlusIcon className="h-4 w-4" />
            Criar Página
          </Button>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
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
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center gap-2 min-w-[280px]">
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
