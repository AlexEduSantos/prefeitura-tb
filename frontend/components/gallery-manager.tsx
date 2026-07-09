"use client";

import { useGalleryViewModel } from "@/app/viewmodel/gallery.viewmodal";
import { Input } from "./ui/input";
import { ChevronDown, PlusIcon, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { flexRender } from "@tanstack/react-table";
import { GalleryModal } from "./gallery-modal";

export function BannersManager() {
  const {
    galleryList,
    isLoadinggallery,
    isErrorgallery,
    table,
    columns,

    openModal,
    setOpenModal,
    mode,
    setMode,
    selectedGallery,
    setSelectedGallery,
    entities,
    mediaList,
    createBanner,
    updateBanner,
  } = useGalleryViewModel();

  if (isLoadinggallery) {
    return <div>Carregando banners...</div>;
  }

  if (isErrorgallery) {
    return <div>Erro ao carregar banners</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 w-full relative">
            <Input
              placeholder="Pesquisar por nome..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
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
            onClick={() => {
              setOpenModal(true);
              setMode("create");
              setSelectedGallery(null);
            }}
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
              <TableRow key={headerGroup.id} className="p-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${header.column.columnDef.header === "Nome" && "w-2/4"} p-2 `}
                  >
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
      <GalleryModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setMode("create");
          setSelectedGallery(null);
        }}
        gallery={selectedGallery || null}
        mode={mode}
        onSave={(data) => {
          if (mode === "create") {
            createBanner(data);
          } else if (mode === "edit") {
            updateBanner(data as IGallery);
          }
          setOpenModal(false);
        }}
        entities={entities}
        mediaList={mediaList}
      />
    </div>
  );
}
