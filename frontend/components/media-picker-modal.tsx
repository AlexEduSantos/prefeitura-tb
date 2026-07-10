"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, SearchIcon, Undo2Icon } from "lucide-react";
import { Card } from "./ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { FileItem } from "./file-item";
import {
  useMediaList,
  useMediaViewModel,
} from "../app/viewmodel/media.viewmodel";
import { IMedia } from "../app/type/media";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: IMedia | IMedia[]) => void;
  multiple?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
}: MediaPickerModalProps) {
  const { uploadMedia, isUploading } = useMediaViewModel();
  const [selectedMediaItems, setSelectedMediaItems] = useState<IMedia[]>([]);

  // Explorer States
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const currentPath = pathStack.join("/");

  const { data, isLoading: isLoadingMedia } = useMediaList(
    currentPath || "root",
    1,
    "desc",
    100,
  );

  const filteredFolders =
    data?.folders?.filter((f: any) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];
  const filteredFiles =
    data?.files?.filter((f: any) =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  // Estados para Upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");

  const handleSelect = (media: IMedia) => {
    if (multiple) {
      setSelectedMediaItems((prev) =>
        prev.some((m) => m.id === media.id)
          ? prev.filter((m) => m.id !== media.id)
          : [...prev, media],
      );
    } else {
      setSelectedMediaItems([media]);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      onSelect(selectedMediaItems);
    } else {
      onSelect(selectedMediaItems[0]);
    }
    onClose();
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    uploadMedia(
      { file, metadata: { title, alt_text: altText } },
      {
        onSuccess: (newMedia) => {
          setFile(null);
          setTitle("");
          setAltText("");
          // Auto-selecionar após upload
          if (multiple) {
            setSelectedMediaItems((prev) => [...prev, newMedia]);
          } else {
            setSelectedMediaItems([newMedia]);
          }
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Mídia</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="library"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Biblioteca de Mídia</TabsTrigger>
            <TabsTrigger value="upload">Fazer Upload</TabsTrigger>
          </TabsList>

          <TabsContent
            value="library"
            className="flex-1 flex flex-col overflow-hidden mt-4"
          >
            {/* Toolbar: Breadcrumb e Pesquisa */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex-1">
                <Input
                  placeholder="Pesquisar arquivo ou pasta..."
                  className="pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchIcon
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </span>
            </div>

            <Breadcrumb className="mb-4">
              <BreadcrumbList className="pl-2">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => setPathStack([])}
                    className="cursor-pointer"
                  >
                    Mídias
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathStack.map((folder, index) => (
                  <div key={folder} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className="capitalize cursor-pointer"
                        onClick={() =>
                          setPathStack(pathStack.slice(0, index + 1))
                        }
                      >
                        {folder}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1 overflow-y-auto pr-2">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Nenhuma mídia encontrada na biblioteca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
                  {/* Botão de Voltar Pasta */}
                  {pathStack.length > 0 && !searchTerm && (
                    <Card
                      className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center"
                      onClick={() => setPathStack(pathStack.slice(0, -1))}
                    >
                      <Undo2Icon className="text-primary" />
                      <p className="text-sm font-medium">Voltar</p>
                    </Card>
                  )}

                  {/* Pastas */}
                  {filteredFolders.map((folder: any) => (
                    <Card
                      key={folder.id}
                      className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center bg-muted/20"
                      onClick={() => setPathStack([...pathStack, folder.name])}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500 fill-blue-500/20"
                      >
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                      </svg>
                      <p className="text-sm font-medium text-center line-clamp-2">
                        {folder.name}
                      </p>
                    </Card>
                  ))}

                  {/* Arquivos */}
                  {filteredFiles.map((file: any) => {
                    const isSelected = selectedMediaItems.some(
                      (m) => m.id === file.id,
                    );
                    return (
                      <div key={file.id} onClick={() => handleSelect(file)}>
                        <FileItem
                          file={file}
                          isSelected={isSelected}
                          onCheckedChange={() => handleSelect(file)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-between items-center border-t mt-4">
              <span className="text-sm text-muted-foreground">
                {selectedMediaItems.length} selecionado(s)
              </span>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedMediaItems.length === 0}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-y-auto mt-4">
            <form
              onSubmit={handleUpload}
              className="space-y-6 max-w-md mx-auto"
            >
              <div className="space-y-2">
                <Label htmlFor="file">
                  Arquivo de Imagem <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Foto da Prefeitura"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altText">
                  Texto Alternativo (Acessibilidade)
                </Label>
                <Input
                  id="altText"
                  placeholder="Ex: Fachada do prédio principal da prefeitura"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isUploading || !file || !title}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Fazer Upload"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
