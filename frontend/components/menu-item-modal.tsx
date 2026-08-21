import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "./ui/switch";
import { useMenusViewModel } from "@/app/viewmodel/menus.viewmodel";
import { Combobox } from "./ui/combobox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type ParentOption =
  | IMenuItem
  | { id: string; label: string; order: number; isRoot: true };

interface MenuModalProps {
  menuItem: IMenuItem | null;
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<IMenuItem>) => void;
  allItems?: IMenuItem[];
}

export function MenuItemModal({
  menuItem,
  mode,
  isOpen,
  onClose,
  onSave,
  allItems = [],
}: MenuModalProps) {
  const { menus } = useMenusViewModel();

  if (menus?.data.length == 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criação de Item de Menu</DialogTitle>
          </DialogHeader>
          Nenhum menu encontrado. Por favor, crie um menu primeiro.
        </DialogContent>
      </Dialog>
    );
  }

  const { pages } = usePagesViewModel(null);

  const [formData, setFormData] = useState<Partial<IMenuItem>>({
    label: "",
    url: "",
    pageId: null,
    parentId: null,
    menuId: "",
    order: 0,
  });
  const [linkMode, setLinkMode] = useState<"page" | "url">("page");

  useEffect(() => {
    if (menuItem && mode === "edit") {
      setFormData({
        label: menuItem.label || "",
        url: menuItem.url || "",
        pageId: menuItem.pageId || null,
        parentId: menuItem.parentId || null,
        menuId: menuItem.menuId || "",
        order: menuItem.order || 0,
      });
    } else if (mode === "create") {
      setFormData({
        label: "",
        url: "",
        pageId: null,
        parentId: null,
        menuId: "",
        order: 0,
      });
    }
  }, [menuItem, mode, isOpen]);

  const handleChange = (field: keyof IMenuItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ao salvar, se o parentId for '__root__', envia null
    const dataToSave = {
      ...formData,
      parentId: formData.parentId === "__root__" ? null : formData.parentId,
    };
    onSave(dataToSave);
    onClose();
  };

  // Opções para o seletor de pai, incluindo a opção "Raiz"
  const selectedMenuName = useMemo(() => {
    if (!formData.menuId || !menus?.data) return "Menu";
    return (
      menus.data.find((m: any) => m.id === formData.menuId)?.name || "Menu"
    );
  }, [formData.menuId, menus]);

  const parentOptions = useMemo<ParentOption[]>(() => {
    const items = allItems.filter((item) => item.id !== menuItem?.id);
    const rootOption: ParentOption = {
      id: "__root__",
      label: `Raiz (${selectedMenuName})`,
      order: -1,
      isRoot: true,
    };
    return [rootOption, ...items];
  }, [allItems, menuItem, selectedMenuName]);

  // Filtra os itens que podem ser pais (exclui o próprio item e seus descendentes? Para simplificar, lista todos)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
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

          <div className="flex justify-between gap-4">
            {/* Menu */}
            <div className="space-y-2 w-full">
              <Label htmlFor="menu">
                Menu <small>(obrigatório)</small>
              </Label>
              <Select
                name="menu"
                value={formData.menuId || "none"}
                onValueChange={(value) =>
                  handleChange("menuId", value === "none" ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {menus?.data?.map((menu: any) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Item pai */}
            <div className="space-y-2 w-full">
              <Label htmlFor="parent">Item pai (opcional)</Label>
              <Combobox
                items={parentOptions}
                value={formData.parentId || "__root__"}
                onChange={(value) => handleChange("parentId", value)}
                getLabel={(item) => item.label}
                getSublabel={(item) => {
                  if ("isRoot" in item && item.isRoot) {
                    return "Item ficará na raiz do menu";
                  }
                  return `Ordem: ${item.order}`;
                }}
                getValue={(item) => item.id}
                placeholder="Selecione um item pai"
                searchPlaceholder="Buscar pai..."
                emptyText="Nenhuma opção disponível"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="airplane-mode">Página</Label>
            <Switch
              id="airplane-mode"
              checked={linkMode === "url"}
              onCheckedChange={(checked) =>
                setLinkMode(checked ? "url" : "page")
              }
            />
            <Label htmlFor="airplane-mode">Link externo</Label>
          </div>

          {linkMode === "page" ? (
            <div className="space-y-2">
              <Label htmlFor="page">Página (opcional)</Label>
              <Combobox
                items={pages || []}
                value={formData.pageId || null}
                onChange={(value) => handleChange("pageId", value)}
                getLabel={(page) => page.title || page.slug}
                getSublabel={(page) => `/${page.slug}`}
                getValue={(page) => page.id}
                placeholder="Selecione uma página"
                searchPlaceholder="Buscar página..."
                emptyText="Nenhuma página encontrada"
              />
            </div>
          ) : (
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
          )}

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
