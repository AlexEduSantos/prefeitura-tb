"use client";

import { useUser } from "@/app/viewmodel/user.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import React from "react";
import { format } from "date-fns";
import { UsersModal } from "./users-modal";
import { Input } from "./ui/input";
import { Plus, Search } from "lucide-react";
import { Button } from "./ui/button";
import { IUser } from "@/app/type/user";

export function UserManager() {
  const {
    users,
    isUserLoading,
    table,
    columns,
    openModal,
    modalMode,
    initialData,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    globalFilter,
    setGlobalFilter,
  } = useUser();

  if (isUserLoading) return <div>Carregando...</div>;

  if (!users || users.length === 0)
    return <>Você não possui permissão para acessar esta página!</>;

  return (
    <section className="flex flex-col gap-2">
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
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="size-4" />
          Novo Usuário
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-white">
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
                // ✅ 1. Usar React.Fragment com key para envolver as duas linhas
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    onClick={row.getToggleSelectedHandler()}
                    className={cn(
                      "cursor-pointer transition-colors border-b-0", // Remove a borda inferior para juntar com o detalhe
                      row.getIsSelected()
                        ? "bg-primary/10! hover:bg-primary/15!"
                        : "hover:bg-muted/50!",
                    )}
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
                  {/* ✅ 2. Linha de detalhes com colSpan para ocupar toda a largura */}
                  {row.getIsSelected() && (
                    <TableRow className="bg-primary/10 hover:bg-primary/5 border-t ">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="py-1"
                      >
                        {/* Aqui você monta o layout interno com os dados extras */}
                        <div className="flex flex-wrap gap-6 justify-between text-muted-foreground text-xs">
                          <div className="flex gap-1 items-center">
                            <span className="font-medium text-foreground">
                              Criado em:
                            </span>
                            <span>
                              {row.original.createdAt
                                ? format(
                                    new Date(row.original.createdAt),
                                    "dd/MM/yyyy 'às' HH:mm:ss",
                                  )
                                : "Não informado"}
                            </span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="font-medium text-foreground">
                              Última atualização
                            </span>
                            <span>
                              {row.original.updatedAt &&
                              row.original.updatedAt === row.original.createdAt
                                ? "Nunca atualizado"
                                : format(
                                    new Date(row.original.updatedAt),
                                    "dd/MM/yyyy 'às' HH:mm:ss",
                                  )}
                            </span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="font-medium text-foreground">
                              Último Login
                            </span>
                            <span>
                              {row.original.lastLogin
                                ? format(
                                    new Date(row.original.lastLogin),
                                    "dd/MM/yyyy 'às' HH:mm:ss",
                                  )
                                : "Nunca acessou"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <UsersModal
          open={openModal}
          onClose={handleCloseModal}
          initialData={initialData as IUser}
          modalMode={modalMode}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
