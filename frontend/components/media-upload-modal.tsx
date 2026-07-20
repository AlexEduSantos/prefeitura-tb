"use client";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "./ui/dialog";
import { Input } from "./ui/input";
import { useState } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea"; // Adicionado Textarea para melhor UX
import { IMedia } from "@/app/type/media";
import { useMediaViewModel } from "@/app/viewmodel/media.viewmodel";
import { toast } from "sonner";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (media: IMedia) => void;
  folderId?: string;
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUpload,
  folderId,
}: MediaUploadModalProps) {
  const { uploadMedia, refetchMedia } = useMediaViewModel();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Arquivo e Título são obrigatórios");
      return;
    }

    setIsUploading(true);

    uploadMedia(
      {
        file,
        metadata: { title, altText, description, folderId },
      },
      {
        onSuccess: (data) => {
          toast.success("Upload realizado com sucesso!");
          setFile(null);
          setTitle("");
          setAltText("");
          setDescription("");
          refetchMedia();
          if (onUpload) onUpload(data);
          onClose();
        },
        onError: () => {
          toast.error("Erro ao realizar upload");
        },
        onSettled: () => {
          setIsUploading(false);
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Upload de Mídia</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              placeholder="Digite um título para a imagem"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alt-text">Texto Alternativo</Label>
            <Input
              id="alt-text"
              value={altText}
              placeholder="Digite um texto alternativo para a imagem"
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Digite uma descrição para a imagem"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !title}
          >
            {isUploading ? "Enviando..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
