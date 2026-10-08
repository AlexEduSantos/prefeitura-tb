import { ICategory } from "@/app/type/organization";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

interface CategoryModalProps {
  category?: ICategory | null;
  mode: "create" | "edit" | "view";
  isOpen: boolean;
  onClose: () => void;
  onSave?: (item: any) => void;
}

export function CategoryModal({
  category,
  mode,
  isOpen,
  onClose,
  onSave,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<Partial<ICategory>>({
    title: category?.title || "",
    slug: category?.slug || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode !== "create" && category) {
        setFormData({
          id: category.id,
          title: category.title,
          slug: category.slug,
        });
      } else {
        setFormData({
          title: "",
          slug: "",
        });
      }
    }
  }, [category, mode, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Adicionar Categoria" : "Editar Categoria"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Preencha os dados abaixo para criar uma nova categoria"
              : "Preencha os dados abaixo para editar a categoria selecionada"}
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da Categoria</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ex: Notícias"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Apelido</Label>
            <Input
              id="slug"
              value={formData.slug || ""}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="Ex: news"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
