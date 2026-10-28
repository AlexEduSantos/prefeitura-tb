"use client";

import { useSpace } from "@/app/viewmodel/organization.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { flexRender } from "@tanstack/react-table";
import { SpaceModal } from "./space-modal";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function SpaceManager() {
  const {
    columns,
    table,
    // States Modal
    openModal,
    initialData,
    modalMode,
    // Handlers
    handleAddSpace,
    handleEditSpace,
    handleCloseModal,
  } = useSpace();

  // Acessamos o hook principal para disparar as mutations de salvar
  const { createSpace, updateSpace } = useSpace(); // ⚠️ Nota: O ideal é exportar isso do useSpace

  // Filtro global simples para a tabela
  const [globalFilter, setGlobalFilter] = useState("");

  const handleSaveSpace = (data: any) => {
    if (modalMode === "create") {
      createSpace(data);
    } else if (initialData?.id) {
      updateSpace({ id: initialData.id, data });
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-4 w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título ou slug..."
            value={globalFilter ?? ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              // Filtra todas as colunas (Título, Slug, Descrição)
              table.setGlobalFilter(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAddSpace} className="gap-2">
          <Plus className="size-4" />
          Novo Espaço
        </Button>
      </div>

      {/* Table */}
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
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum espaço encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SpaceModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleSaveSpace}
        modalMode={modalMode}
        initialData={initialData}
      />
    </div>
  );
}
