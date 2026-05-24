"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
import { useState } from "react";
export const columns: ColumnDef<IArticle>[] = [
  {
    accessorKey: "status",
    header: "Estado",
    filterFn: "equals",
    cell: ({ row, table }) => {
      const status = row.original.status;
      const featured = row.original.featured;
      const meta = table.options.meta as any;

      const handleStatusChange = (newStatus: string) => {
        meta?.changeStatus({ id: row.original.id, status: newStatus });
      };

      const handleFeaturedChange = () => {
        meta?.changeFeatured({ id: row.original.id, featured: !featured });
      };

      const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
          case "published":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
          case "deleted":
            return <Trash className="h-4 w-4 text-red-500" />;
          default: // draft
            return <FileText className="h-4 w-4 text-gray-500" />;
        }
      };
      return (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-8 w-8 cursor-pointer stroke-1"
                title={
                  status === "published"
                    ? "Publicado"
                    : status === "draft"
                      ? "Rascunho"
                      : "Excluído"
                }
              >
                {getStatusIcon(status)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={handleStatusChange}
              >
                {status !== "published" && (
                  <DropdownMenuRadioItem value="published">
                    Publicar
                  </DropdownMenuRadioItem>
                )}
                {status !== "draft" && (
                  <DropdownMenuRadioItem value="draft">
                    Rascunho
                  </DropdownMenuRadioItem>
                )}
                {status !== "deleted" && (
                  <DropdownMenuRadioItem value="deleted">
                    Excluir
                  </DropdownMenuRadioItem>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer stroke-1"
            onClick={handleFeaturedChange}
            title={
              featured ? "Remover dos destaques" : "Adicionar aos destaques"
            }
            type="button"
          >
            {featured ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <Star className="h-4 w-4 text-gray-400" />
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
    accessorKey: "author",
    header: "Autor",
    cell: ({ row }) => <div>{row.getValue("author")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data da criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      const formatted = dateStr
        ? format(new Date(dateStr), "dd/MM/yyyy - HH:mm")
        : "-";
      return <div className="px-4">{formatted}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    filterFn: "equals",
    cell: ({ row }) => {
      const typeMap: Record<string, string> = {
        article: "Matéria",
        event: "Evento",
        note: "Nota",
      };
      const rawType = row.getValue("type") as string;
      return <div className="capitalize">{typeMap[rawType] || rawType}</div>;
    },
  },
  {
    id: "categoria",
    accessorFn: (row) => row.entity?.name,
    header: "Categoria",
    cell: ({ row }) => <div>{row.getValue("categoria") as string}</div>,
  },
  {
    accessorKey: "featured",
    id: "featured",
    enableHiding: true,
    filterFn: "equals",
  },
];
export function ArticlesList() {
  const {
    article,
    isLoadingArticle,
    isErrorArticle,
    errorArticle,
    changeStatus,
    changeFeatured,
  } = ArticleViewModel();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    featured: false,
  });
  const table = useReactTable({
    data: article || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      changeStatus,
      changeFeatured,
    },
  });
  if (isLoadingArticle) {
    return <div>Carregando...</div>;
  }
  if (isErrorArticle) {
    return <div>Error: {errorArticle?.message}</div>;
  }
  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Input
              placeholder="Pesquisar por nome..."
              value={
                (table.getColumn("title")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
            <Button>
              <Search className="h-4 w-4" />
            </Button>
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
                <DropdownMenuRadioItem value="published">
                  Publicado
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="draft">
                  Rascunho
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deleted">
                  Excluído
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
              <DropdownMenuRadioGroup
                value={
                  (table.getColumn("categoria")?.getFilterValue() as string) ||
                  ""
                }
                onValueChange={(value) =>
                  table
                    .getColumn("categoria")
                    ?.setFilterValue(value || undefined)
                }
              >
                <DropdownMenuRadioItem value="">Todas</DropdownMenuRadioItem>
                {Array.from(
                  new Set(article?.map((a) => a.entity?.name).filter(Boolean)),
                ).map((cat) => (
                  <DropdownMenuRadioItem
                    key={cat as string}
                    value={cat as string}
                  >
                    {cat as string}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  table.getColumn("featured")?.setFilterValue(undefined);
                  table.getColumn("status")?.setFilterValue(undefined);
                  table.getColumn("type")?.setFilterValue(undefined);
                  table.getColumn("categoria")?.setFilterValue(undefined);
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
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
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
                  Nenhum artigo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
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
