"use client";
import { IMenu } from "@/app/type/menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";
import { useEntityViewModel } from "@/app/viewmodel/entity.viewmodel";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";

interface MenuModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  menu: IMenu | null;
  onSave: (data: Partial<IMenu>) => void;
  onClose: () => void;
}

export function MenuModal({
  isOpen,
  mode = "create",
  menu,
  onSave,
  onClose,
}: MenuModalProps) {
  const [formData, setFormData] = useState<Partial<IMenu>>({
    name: "",
    location: "",
    entityId: "",
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { entities, isLoadingEntities, errorEntities } = useEntityViewModel();

  if (isLoadingEntities) {
    return;
  }

  if (errorEntities) {
    return;
  }

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar novo menu" : "Editar menu"}
          </DialogTitle>
          <form onSubmit={handleSave} className="pt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do menu</Label>
              <Input
                id="name"
                value={formData.name || ""}
                placeholder="Nome que será exibido no site"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="location">Localização</Label>
                <Select
                  name="location"
                  value={formData.location || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Cabeçalho</SelectItem>
                    <SelectItem value="footer">Rodapé</SelectItem>
                    <SelectItem value="sidebar">Barra lateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity">Categoria</Label>
                <Select
                  name="entity"
                  value={formData.entityId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, entityId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities?.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Button
                type="button"
                className="w-full border-dashed text-muted-foreground"
                variant="outline"
              >
                <PlusIcon />
                Adicionar itens do menu
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="reset" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
