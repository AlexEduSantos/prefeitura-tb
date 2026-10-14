"use client";

import { IMenu } from "@/app/type/menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useMenu } from "@/app/viewmodel/menu.viewmodel";

interface MenuModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMenu>) => void;
  menu?: IMenu;
}

const MENU_LOCATIONS = [
  { value: "header", label: "Cabeçalho" },
  { value: "footer", label: "Rodapé" },
  { value: "sidebar", label: "Lateral" },
  { value: "mobile", label: "Mobile" },
] as const;

// Sentinel para "nenhum" no Select (Radix não aceita null/"" como value)
const NONE = "__none__";

export function MenuModal({
  isOpen,
  onClose,
  onSubmit,
  menu,
  mode,
}: MenuModalProps) {
  const { organizations, isLoadingOrganizations, spaces, isLoadingSpaces } =
    useOrganizationViewModel();

  const [formData, setFormData] = useState<Partial<IMenu>>({
    title: "",
    location: "header",
    description: "",
    active: true,
    organizationId: null,
    spaceId: null,
  });

  // Sincroniza o form quando abre em modo edit
  useEffect(() => {
    if (isOpen && mode === "edit" && menu) {
      setFormData({
        title: menu.title ?? "",
        location: menu.location ?? "header",
        description: menu.description ?? "",
        active: menu.active ?? true,
        organizationId: menu.organizationId ?? null,
        spaceId: menu.spaceId ?? null,
      });
    } else if (isOpen && mode === "create") {
      setFormData({
        title: "",
        location: "header",
        description: "",
        active: true,
        organizationId: null,
        spaceId: null,
      });
    }
  }, [isOpen, mode, menu]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      organizationId:
        formData.organizationId === NONE ? null : formData.organizationId,
      spaceId: formData.spaceId === NONE ? null : formData.spaceId,
    });
    onClose();
  };

  const isValid = formData.title?.trim() && formData.location;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-2 max-w-lg">
        <DialogTitle>
          {mode === "create" ? "Criar Menu" : "Editar Menu"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Preencha os campos para criar um novo menu."
            : "Altere os campos desejados."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Header Principal"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>
              Local <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.location}
              onValueChange={(v) => setFormData({ ...formData, location: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {MENU_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Setor Responsável{" "}
              <small className="text-muted-foreground">(opcional)</small>
            </Label>
            <Select
              value={formData.organizationId ?? NONE}
              onValueChange={(v) =>
                setFormData({ ...formData, organizationId: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum (global)</SelectItem>
                {isLoadingOrganizations ? (
                  <SelectItem value="__loading__" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Área de exibição{" "}
              <small className="text-muted-foreground">(opcional)</small>
            </Label>
            <Select
              value={formData.spaceId ?? NONE}
              onValueChange={(v) => setFormData({ ...formData, spaceId: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a área onde será exibido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas as áreas (global)</SelectItem>
                {isLoadingSpaces ? (
                  <SelectItem value="__loading__" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  spaces?.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="active"
              checked={formData.active ?? true}
              onCheckedChange={(v) => setFormData({ ...formData, active: v })}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Menu ativo
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {mode === "create" ? "Criar Menu" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
