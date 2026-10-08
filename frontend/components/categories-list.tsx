"use client";

import UseCategory from "@/app/viewmodel/category.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { flexRender } from "@tanstack/react-table";
import { Input } from "./ui/input";
import { PlusIcon, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { CategoryModal } from "./category-modal";

// Helper function to generate slug from text
const generateSlug = (text: string) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

export function CategoriesList() {
  const {
    categories,
    isLoadingcategories,
    errorcategories,
    updateCategory,
    deleteCategory,
    createCategory,
    table,
    columns,
    setOpenModal,
    setSelectedCategory,
    setMode,
    openModal,
    selectedCategory,
    mode,
  } = UseCategory();

  if (isLoadingcategories) return <div>Carregando...</div>;

  if (errorcategories) return <div>Erro ao carregar categorias</div>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 w-full relative">
            <Input
              placeholder="Pesquisar por título..."
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
          <div className="flex items-center gap-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-17.5 cursor-pointer">
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
            onClick={() => {
              setOpenModal(true);
              setMode("create");
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Criar Categoria
          </Button>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`${header.id === "actions" ? "text-right w-10" : "w-100"}`}
                    >
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
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CategoryModal
        category={selectedCategory}
        mode={mode}
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedCategory(null);
        }}
        onSave={(item) => {
          if (mode === "create") {
            createCategory(item);
          } else {
            updateCategory(item);
          }
        }}
      />
    </div>
  );
}
