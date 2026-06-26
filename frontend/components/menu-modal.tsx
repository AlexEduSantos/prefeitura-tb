import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMenuItem } from "@/app/type/menu";
import { usePagesViewModel } from "@/app/viewmodel/pages.viewmodel";

interface MenuModalProps {
  menuItem: IMenuItem | null;
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<IMenuItem>) => void;
  allItems?: IMenuItem[];
}

export function MenuModal({
  menuItem,
  mode,
  isOpen,
  onClose,
  onSave,
  allItems = [],
}: MenuModalProps) {
  const { pages } = usePagesViewModel(null);

  const [formData, setFormData] = useState<Partial<IMenuItem>>({
    label: "",
    url: "",
    pageId: null,
    parentId: null,
    order: 0,
  });

  useEffect(() => {
    if (menuItem && mode === "edit") {
      setFormData({
        label: menuItem.label || "",
        url: menuItem.url || "",
        pageId: menuItem.pageId || null,
        parentId: menuItem.parentId || null,
        order: menuItem.order || 0,
      });
    } else if (mode === "create") {
      setFormData({
        label: "",
        url: "",
        pageId: null,
        parentId: null,
        order: 0,
      });
    }
  }, [menuItem, mode, isOpen]);

  const handleChange = (field: keyof IMenuItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const parentOptions = allItems.filter((item) => item.id !== menuItem?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar novo item" : "Editar item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Nome do Menu</Label>
            <Input
              id="label"
              value={formData.label || ""}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Ex: Sobre Nós"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL (opcional)</Label>
            <Input
              id="url"
              value={formData.url || ""}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="Ex: /sobre ou https://exemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Preencha para um link externo ou caminho personalizado. Deixe
              vazio para usar uma página.
            </p>
          </div>

          {/* Página */}
          <div className="space-y-2">
            <Label htmlFor="page">Página (opcional)</Label>
            <Select
              value={formData.pageId || "none"}
              onValueChange={(value) =>
                handleChange("pageId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {pages?.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.title || page.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item pai */}
          <div className="space-y-2">
            <Label htmlFor="parent">Item pai (opcional)</Label>
            <Select
              value={formData.parentId || "none"}
              onValueChange={(value) =>
                handleChange("parentId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum (item raiz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {parentOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordem */}
          <div className="space-y-2">
            <Label htmlFor="order">Ordem</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={formData.order ?? 0}
              onChange={(e) =>
                handleChange("order", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
