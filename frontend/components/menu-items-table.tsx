// components/MenuItemsTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { flattenTreeWithLevel, FlatMenuItem } from "@/lib/menuUtils";
import { EyeIcon, Pencil, Trash } from "lucide-react";
import { IMenuItem } from "@/app/type/menu";

// Definição das colunas
const columns: ColumnDef<FlatMenuItem>[] = [
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => {
      const item = row.original;
      const indent = "—".repeat(item.level); // hífen para cada nível
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
    header: "URL",
    cell: ({ row }) => <span>{row.original.url || "(nenhuma)"}</span>,
  },
  {
    accessorKey: "order",
    header: "Ordem",
    cell: ({ row }) => <span>{row.original.order}</span>,
  },
  {
    id: "page",
    header: "Página",
    cell: ({ row }) => {
      const slug = row.original.page?.slug;
      return <span>{slug || "—"}</span>;
    },
  },
  {
    id: "Ações",
    header: "Ações",
    cell: () => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <EyeIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

interface MenuItemsTableProps {
  items: IMenuItem[];
  isLoading?: boolean;
}

export function MenuItemsTable({ items, isLoading }: MenuItemsTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  // Transforma a lista plana com níveis
  const flatItems = flattenTreeWithLevel(items);

  const table = useReactTable({
    data: flatItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  if (isLoading) return <div>Carregando itens...</div>;

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
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
