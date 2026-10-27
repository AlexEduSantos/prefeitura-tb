import { IOrganization, OrganizationTypes } from "@/app/type/organization";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import { Loader2 } from "lucide-react";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IOrganization>) => void;
  initialData?: Partial<IOrganization> | null;
  modalMode: "create" | "edit";
  parent?: IOrganization | null;
}

export function OrganizationModal({
  isOpen,
  onClose,
  modalMode,
  parent,
  onSubmit,
  initialData,
}: OrganizationModalProps) {
  const [formData, setFormData] = useState<Partial<IOrganization>>(
    initialData || {
      title: "",
      acronym: "",
      type: "secretaria",
      active: true,
      parentId: parent?.id ?? null,
      defaultSpaceId: null,
    },
  );

  const { spaces, isLoadingSpaces } = useOrganizationViewModel();

  // ✅ Sincroniza o estado do form quando o modal abre (especial para modo edição)
  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          title: "",
          acronym: "",
          type: "secretaria",
          active: true,
          parentId: parent?.id ?? null,
          defaultSpaceId: null,
        },
      );
    }
  }, [isOpen, initialData, parent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return; // Validação básica
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create"
              ? parent
                ? "Adicionar subunidade em: " + parent.title
                : "Adicionar Nova Unidade"
              : "Editar Unidade"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para{" "}
            {modalMode === "create" ? "criar" : "editar"} a unidade
            organizacional.
          </DialogDescription>
        </DialogHeader>

        {/* ✅ O form agora envolve TODOS os campos e o Footer com os botões */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">
              Nome da unidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Secretaria de Obras"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="acronym">Sigla (Opcional)</Label>
              <Input
                id="acronym"
                value={formData.acronym || ""}
                onChange={(e) =>
                  setFormData({ ...formData, acronym: e.target.value })
                }
                placeholder="Ex: SMOSP"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type || "secretaria"}
                onValueChange={(val: OrganizationTypes) =>
                  setFormData({ ...formData, type: val })
                }
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefeitura">Prefeitura</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="divisão">Divisão</SelectItem>
                  <SelectItem value="seção">Seção</SelectItem>
                  <SelectItem value="conselho">Conselho</SelectItem>
                  <SelectItem value="projeto">Projeto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingSpaces ? (
            <div className="flex items-center justify-center">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultSpaceId">Espaço Padrão (Opcional)</Label>
              <Select
                value={formData.defaultSpaceId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, defaultSpaceId: value || null })
                }
              >
                <SelectTrigger id="defaultSpaceId" className="w-full">
                  <SelectValue placeholder="Selecione um espaço" />
                </SelectTrigger>
                <SelectContent>
                  {spaces?.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label
                htmlFor="active"
                className="text-base font-semibold cursor-pointer"
              >
                Ativo no sistema
              </Label>
              <p className="text-xs text-muted-foreground">
                Desative para ocultar esta unidade sem excluí-la.
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active ?? true}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!formData.title?.trim()}>
              {modalMode === "create" ? "Criar Unidade" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
