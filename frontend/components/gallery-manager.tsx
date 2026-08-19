"use client";

import { useGalleryViewModel } from "@/app/viewmodel/gallery.viewmodal";
import { Input } from "./ui/input";
import {
  ChevronDown,
  Grid2X2,
  PlusIcon,
  Search,
  Table2Icon,
} from "lucide-react";
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
import { IGallery } from "@/app/type/gallery";
import { useState } from "react";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Carousel } from "./carousel";
import Image from "next/image";

export function GalleriesManager() {
  const {
    galleryList,
    isLoadingGallery,
    isErrorGallery,
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
  const [viewMode, setViewMode] = useState<"table" | "picker">("table");

  if (isLoadingGallery) {
    return <div>Carregando banners...</div>;
  }

  if (isErrorGallery) {
    return <div>Erro ao carregar banners</div>;
  }

  const imageLoader = (src: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/media/file/${src}`;
  };

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
            variant="outline"
            size={"icon"}
            className="cursor-pointer min-w-fit px-2"
            onClick={() =>
              setViewMode(viewMode === "table" ? "picker" : "table")
            }
          >
            {viewMode === "table" ? (
              <>
                <Grid2X2 />
                Visualizar Galeria
              </>
            ) : (
              <>
                <Table2Icon />
                Visualizar Tabela
              </>
            )}
          </Button>
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
            Criar Galeria
          </Button>
        </div>
      </div>

      {/* Table */}
      {viewMode === "table" ? (
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
                    Nenhuma galeria encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {galleryList.map((gallery) => (
            <Card key={gallery.id} className="p-2 gap-0">
              <CardTitle className="px-2">{gallery.name}</CardTitle>
              <CardContent className="p-0">
                <div className="min-w-sm p-2">
                  {gallery.slides.length > 1 ? (
                    <Carousel
                      slides={gallery.slides}
                      className="w-full"
                      autoPlay={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full relative overflow-y-auto rounded-xl"
                      key={gallery.slides[0].id}
                    >
                      <Image
                        loader={() => imageLoader(gallery.slides[0].media.key)}
                        src={gallery.slides[0].media.key}
                        alt={gallery.slides[0].caption ?? ""}
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
