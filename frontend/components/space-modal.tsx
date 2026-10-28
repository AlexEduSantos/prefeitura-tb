// components/space-modal.tsx
"use client";

import { ISpace } from "@/app/type/organization";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

interface SpaceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ISpace>) => void;
  modalMode: "create" | "edit";
  initialData: Partial<ISpace> | null;
}

export function SpaceModal({
  open,
  onClose,
  onSubmit,
  modalMode,
  initialData,
}: SpaceModalProps) {
  const [formData, setFormData] = useState<Partial<ISpace>>({
    title: "",
    slug: "",
    description: "",
  });

  // Sincroniza os dados ao abrir o modal
  useEffect(() => {
    if (open) {
      setFormData(
        initialData || {
          title: "",
          slug: "",
          description: "",
        },
      );
    }
  }, [open, initialData]);

  // Helper simples para gerar o slug a partir do título
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "-") // Substitui espaços e símbolos por hífen
      .replace(/^-+|-+$/g, ""); // Remove hífens do começo e fim
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      // Se for criação, gera o slug automaticamente enquanto digita
      ...(modalMode === "create" && { slug: generateSlug(newTitle) }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.slug?.trim()) return;

    // Envia apenas os campos editáveis, limpando o objeto
    onSubmit({
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      description: formData.description?.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create" ? "Adicionar Novo Espaço" : "Editar Espaço"}
          </DialogTitle>
          <DialogDescription>
            Espaços definem a URL base para as páginas (ex: /governo/sobre).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={handleTitleChange}
              placeholder="Ex: Secretaria de Governo"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">
              Slug (URL) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">
                /
              </span>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="secretaria-de-governo"
                className="rounded-l-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Uma breve descrição do propósito deste espaço."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!formData.title || !formData.slug}>
              {modalMode === "create" ? "Criar Espaço" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
