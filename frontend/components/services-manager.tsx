"use client";

import { flexRender } from "@tanstack/react-table";
import { useServices } from "@/app/viewmodel/services.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { PlusIcon, Search, ImageUp, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Label } from "./ui/label";
import { MediaPickerModal } from "./media-picker-modal";
import { IMedia } from "@/app/type/media";
import { useEffect, useState } from "react";
import { ImageVisualizer } from "./image-visualizer";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export default function ServicesManager() {
  const { organizations, isLoadingOrganizations } = useOrganizationViewModel();

  const {
    isLoadingServices,
    isErrorServices,
    table,
    columns,

    // Modal
    openModal,
    setOpenModal,
    mode,
    selectedService,
    formData,
    setFormData,
    openCreateModal,
    closeModal,
    handleSave,

    // Delete
    deleteModalOpen,
    serviceToDelete,
    cancelDelete,
    handleDelete,
    deleteServiceMutation,

    // Mutations
    createServiceMutation,
    updateServiceMutation,
  } = useServices();

  // Estado para controlar a abertura do seletor de mídia
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  // Estado para armazenar a imagem selecionada (para exibição)
  const [selectedImage, setSelectedImage] = useState<IMedia | null>(null);

  // Quando o serviço selecionado mudar (edição), preenche a imagem
  useEffect(() => {
    if (selectedService) {
      if (selectedService.image) {
        setSelectedImage(selectedService.image);
      } else {
        setSelectedImage(null);
      }
    } else {
      setSelectedImage(null);
    }
  }, [selectedService]);

  // Função para lidar com a seleção de imagem no modal
  const handleMediaSelect = (media: IMedia | IMedia[]) => {
    const selected = Array.isArray(media) ? media[0] : media;
    if (selected) {
      setSelectedImage(selected);
      setFormData({ ...formData, imageId: selected.id });
    }
  };

  const isSaving =
    createServiceMutation.isPending || updateServiceMutation.isPending;

  if (isLoadingServices) return <div>Carregando...</div>;
  if (isErrorServices) return <div>Erro ao carregar serviços</div>;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          {/* Barra de pesquisa */}
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

          {/* Seletor de quantidade por página */}
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

          {/* Botão criar */}
          <Button
            variant="default"
            size="icon"
            className="cursor-pointer min-w-fit px-2"
            onClick={openCreateModal}
          >
            <PlusIcon className="h-4 w-4" />
            Criar Serviço
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${header.column.columnDef.header === "Título" && "w-2/4"} p-2 `}
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
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Drawer de Criação/Edição */}
      <Drawer open={openModal} onOpenChange={setOpenModal} direction="right">
        <DrawerContent className="w-150 max-w-[90vw]">
          <DrawerHeader>
            <DrawerTitle>
              {mode === "create" ? "Criar Serviço" : "Editar Serviço"}
            </DrawerTitle>
            <DrawerDescription>
              {mode === "create"
                ? "Preencha as informações para criar um novo serviço"
                : "Edite as informações do serviço"}
            </DrawerDescription>
          </DrawerHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="p-4 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
          >
            <div className="grid grid-cols-1 gap-4">
              {/* Título */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nome do serviço"
                  required
                />
              </div>

              {/* Link */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="link">Link (URL) *</Label>
                <Input
                  id="link"
                  name="link"
                  value={formData.link || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://exemplo.com"
                  required
                />
              </div>

              {/* Texto alternativo */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="altText">Texto Alternativo</Label>
                <Input
                  id="altText"
                  name="altText"
                  value={formData.altText || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, altText: e.target.value })
                  }
                  placeholder="Descrição da imagem para acessibilidade"
                />
              </div>

              {/* Secretaria / Órgão Responsável */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="organizationId">Secretaria / Órgão *</Label>
                <Select
                  name="organizationId"
                  value={formData.organizationId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizationId: value })
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingOrganizations
                          ? "Carregando..."
                          : "Selecione uma secretaria/órgão"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Imagem */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="mediaPicker">Imagem de Capa</Label>
                <div className="flex items-center gap-2">
                  {selectedImage ? (
                    <div
                      onClick={() => setMediaPickerOpen(true)}
                      className="flex relative items-center justify-center cursor-pointer group"
                    >
                      <button
                        type="button"
                        className="absolute hidden z-10 group-hover:block transition-all duration-300"
                      >
                        <ImageUp className="size-8 stroke-1 bg-white rounded-full p-1" />
                      </button>
                      <div className="group-hover:blur-xs hover:opacity-80 transition-all duration-300">
                        <ImageVisualizer
                          name={selectedImage.title || "Imagem"}
                          image={selectedImage}
                          alt={selectedImage.title || "Imagem"}
                          mode="full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setMediaPickerOpen(true)}
                      className="flex items-center justify-center cursor-pointer border-2 border-dashed rounded-lg w-full aspect-square"
                    >
                      <ImageUp className="size-8 stroke-1 bg-white rounded-full p-1" />
                      <Input
                        id="mediaPicker"
                        onClick={() => setMediaPickerOpen(true)}
                        hidden
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
          <DrawerFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            <DrawerClose asChild>
              <Button type="button" onClick={closeModal} variant="outline">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={false}
      />

      {/* Alert Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço{" "}
              <strong>{serviceToDelete?.title}</strong>? Essa ação não poderá
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {deleteServiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
