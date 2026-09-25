"use client";

import { flexRender } from "@tanstack/react-table";
import { usePopupsViewModel } from "../app/viewmodel/popups.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { PlusIcon, Search, CalendarIcon, ImageUp } from "lucide-react";
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
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { useEntityViewModel } from "@/app/viewmodel/entity.viewmodel";
import { MediaPickerModal } from "./media-picker-modal";
import { IMedia } from "@/app/type/media";
import { useEffect, useState } from "react";
import { ImageVisualizer } from "./image-visualizer";
import { IPopups } from "@/app/type/popup";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";

// Valores padrão para o formulário
const initialFormData: Partial<IPopups> = {
  title: "",
  link: "",
  active: true,
  displayTime: 10,
  status: "rascunho",
  type: "popup",
  position: "center",
  closeButton: true,
  priority: 0,
  publicationDate: new Date(),
  expirationDate: new Date(),
  entityId: "",
  imageId: "",
};

export function PopupsManager() {
  const {
    popups,
    popupsTable,
    columns,
    openModal,
    setOpenModal,
    mode,
    setMode,
    selectedPopup,
    setSelectedPopup,
    formData,
    setFormData,
    handleSave,
  } = usePopupsViewModel();

  const { entities } = useEntityViewModel();

  // Estado para controlar a abertura do seletor de mídia
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  // Estado para armazenar a imagem selecionada (para exibição)
  const [selectedImage, setSelectedImage] = useState<IMedia | null>(null);

  // Quando o popup selecionado mudar (edição), preenche o formulário
  useEffect(() => {
    if (selectedPopup) {
      setFormData({
        ...selectedPopup,
        publicationDate: selectedPopup.publicationDate
          ? new Date(selectedPopup.publicationDate)
          : new Date(),
        expirationDate: selectedPopup.expirationDate
          ? new Date(selectedPopup.expirationDate)
          : new Date(),
      });
      // Se houver imagem, busca os dados para exibir
      if (selectedPopup.image) {
        setSelectedImage(selectedPopup.image);
      } else {
        setSelectedImage(null);
      }
    } else {
      setFormData(initialFormData);
      setSelectedImage(null);
    }
  }, [selectedPopup, setFormData]);

  // Função para lidar com a seleção de imagem no modal
  const handleMediaSelect = (media: IMedia | IMedia[]) => {
    const selected = Array.isArray(media) ? media[0] : media;
    if (selected) {
      setSelectedImage(selected);
      setFormData({ ...formData, imageId: selected.id });
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 w-full relative">
            <Input
              placeholder="Pesquisar por título..."
              value={
                (popupsTable.getColumn("title")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                popupsTable
                  .getColumn("title")
                  ?.setFilterValue(event.target.value)
              }
              className="w-full relative z-10"
            />
            <Search className="size-5 absolute z-20 right-2 text-muted-foreground cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={`${popupsTable.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                popupsTable.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-17.5 cursor-pointer">
                <SelectValue
                  placeholder={popupsTable.getState().pagination.pageSize}
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
            variant="default"
            size="icon"
            className="cursor-pointer min-w-fit px-2"
            onClick={() => {
              setMode("create");
              setSelectedPopup(null);
              setOpenModal(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Criar PopUp
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-white ">
            {popupsTable.getHeaderGroups().map((headerGroup) => (
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
            {popupsTable.getRowModel().rows?.length ? (
              popupsTable.getRowModel().rows.map((row) => (
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
                  Nenhum Pop-Up encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Drawer de Edição/Criação */}
        <Drawer open={openModal} onOpenChange={setOpenModal} direction="right">
          <DrawerContent className="w-150 max-w-[90vw]">
            <DrawerHeader>
              <DrawerTitle>
                {mode === "create" ? "Criar PopUp" : "Editar PopUp"}
              </DrawerTitle>
              <DrawerDescription>
                {mode === "create"
                  ? "Crie um novo PopUp"
                  : "Edite as informações do PopUp"}
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
                {/* Nome */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Link */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="link">Link (URL)</Label>
                  <Input
                    id="link"
                    name="link"
                    value={formData.link || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="https://exemplo.com"
                  />
                </div>

                {/* Entidade */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="entityId">Entidade *</Label>
                  <Select
                    name="entityId"
                    value={formData.entityId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, entityId: value })
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Imagem */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mediaPicker">Imagem</Label>
                  <div className="flex items-center gap-2">
                    {selectedImage ? (
                      <div
                        onClick={() => setMediaPickerOpen(true)}
                        className="flex relative items-center justify-center cursor-pointer group"
                      >
                        <button
                          type="button"
                          className="absolute hidden z-10 group-hover:block  transition-all duration-300"
                        >
                          <ImageUp className="size-8 stroke-1 bg-white rounded-full p-1" />
                        </button>
                        <div className="group-hover:blur-xs hover:opacity-80  transition-all duration-300">
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

                {/* Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      name="status"
                      value={formData.status || "rascunho"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="expirado">Expirado</SelectItem>
                        <SelectItem value="excluido">Excluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Tipo */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      name="type"
                      value={formData.type || "modal"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modal">Janela</SelectItem>
                        <SelectItem value="bar">Barra</SelectItem>
                        <SelectItem value="corner">Canto</SelectItem>
                        <SelectItem value="fullscreen">Tela Cheia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Posição */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="position">Posição</Label>
                  <Select
                    name="position"
                    value={formData.position || "center"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a posição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Topo</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="bottom">Fundo</SelectItem>
                      <SelectItem value="top-left">Topo Esquerda</SelectItem>
                      <SelectItem value="top-right">Topo Direita</SelectItem>
                      <SelectItem value="bottom-left">
                        Fundo Esquerda
                      </SelectItem>
                      <SelectItem value="bottom-right">
                        Fundo Direita
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="priority">Prioridade (número)</Label>
                  <Input
                    id="priority"
                    name="priority"
                    type="number"
                    value={formData.priority ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Tempo de exibição (segundos) */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="displayTime">
                    Tempo de exibição (segundos)
                  </Label>
                  <Input
                    id="displayTime"
                    name="displayTime"
                    type="number"
                    value={formData.displayTime ?? 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayTime: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>

                {/* Ativo */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.active ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked })
                    }
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>

                {/* Botão fechar */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="closeButton"
                    checked={formData.closeButton ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, closeButton: !!checked })
                    }
                  />
                  <Label htmlFor="closeButton">Exibir botão fechar</Label>
                </div>

                {/* Data de Publicação */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="publicationDate">Data de Publicação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!formData.publicationDate}
                        className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      >
                        <CalendarIcon />
                        {formData.publicationDate ? (
                          format(formData.publicationDate, "PPP", {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        locale={ptBR}
                        mode="single"
                        selected={formData.publicationDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, publicationDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Data de Expiração */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="expirationDate">Data de Expiração</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!formData.expirationDate}
                        className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      >
                        <CalendarIcon />
                        {formData.expirationDate ? (
                          format(formData.expirationDate, "PPP", {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        locale={ptBR}
                        selected={formData.expirationDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, expirationDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </form>
            <DrawerFooter>
              <Button onClick={handleSave}>Salvar</Button>
              <DrawerClose asChild>
                <Button
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData);
                    setSelectedImage(null);
                    setSelectedPopup(null);
                  }}
                  variant="outline"
                >
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
      </div>
    </div>
  );
}
