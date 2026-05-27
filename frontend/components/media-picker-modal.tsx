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
import { useMediaViewModel } from "../app/viewmodel/media.viewmodel";
import { IMedia } from "../app/type/media";
import { Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

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
  const { mediaList, isLoadingMedia, uploadMedia, isUploading } =
    useMediaViewModel();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados para Upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");

  const handleSelect = (media: IMedia) => {
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(media.id)
          ? prev.filter((id) => id !== media.id)
          : [...prev, media.id],
      );
    } else {
      setSelectedIds([media.id]);
    }
  };

  const handleConfirm = () => {
    const selectedMedia = mediaList.filter((m) => selectedIds.includes(m.id));
    if (multiple) {
      onSelect(selectedMedia);
    } else {
      onSelect(selectedMedia[0]);
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
            setSelectedIds((prev) => [...prev, newMedia.id]);
          } else {
            setSelectedIds([newMedia.id]);
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
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : mediaList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhuma mídia encontrada na biblioteca.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaList.map((media) => {
                    const isSelected = selectedIds.includes(media.id);
                    const isReady =
                      media.status === "ready" || (!media.status && media.key);
                    const src = `${API_URL}/media/file/${media.key}`;
                    return (
                      <div
                        key={media.id}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground"} ${!isReady ? "opacity-60 pointer-events-none" : ""}`}
                        onClick={() => isReady && handleSelect(media)}
                      >
                        {isReady ? (
                          <img
                            src={src}
                            alt={media.alt_text || media.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-2 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-1" />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              Processando...
                            </span>
                          </div>
                        )}
                        {isSelected && isReady && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-between items-center border-t mt-4">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selecionado(s)
              </span>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedIds.length === 0}
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
