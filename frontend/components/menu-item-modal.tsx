"use client";

import { IMenuItem } from "@/app/type/menu";
import { IPage } from "@/app/type/pages";
import { ICategory } from "@/app/type/organization";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { usePagesViewModel } from "@/app/viewmodel/pages.viewmodel";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";

type Destination = "page" | "category" | "url";

interface MenuItemModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMenuItem>) => void;
  item?: IMenuItem;
  menuId: string;
  /** Itens já existentes no menu — para o select de "item pai" */
  siblingItems?: IMenuItem[];
  /** Se definido, o novo item será filho deste item automaticamente */
  parentId?: string | null;
}

const NONE = "__none__";

export function MenuItemModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  mode,
  menuId,
  siblingItems = [],
  parentId = null,
}: MenuItemModalProps) {
  const { pages, isLoadingPage } = usePagesViewModel();
  const { categories, isLoadingCategories } = useOrganizationViewModel();

  const [destination, setDestination] = useState<Destination>("page");
  const [formData, setFormData] = useState<Partial<IMenuItem>>({
    label: "",
    description: "",
    icon: "",
    visible: true,
    order: 0,
    url: null,
    pageId: null,
    categoryId: null,
    parentId: parentId,
    menuId,
  });

  // Detecta o destino inicial ao abrir em modo edit
  useEffect(() => {
    if (isOpen && mode === "edit" && item) {
      const dest: Destination = item.pageId
        ? "page"
        : item.categoryId
          ? "category"
          : "url";
      setDestination(dest);
      setFormData({
        label: item.label ?? "",
        description: item.description ?? "",
        icon: item.icon ?? "",
        visible: item.visible ?? true,
        order: item.order ?? 0,
        url: item.url ?? null,
        pageId: item.pageId ?? null,
        categoryId: item.categoryId ?? null,
        parentId: item.parentId ?? null,
        menuId: item.menuId ?? menuId,
      });
    } else if (isOpen && mode === "create") {
      setDestination("page");
      setFormData({
        label: "",
        description: "",
        icon: "",
        visible: true,
        order: 0,
        url: null,
        pageId: null,
        categoryId: null,
        parentId: parentId,
        menuId,
      });
    }
  }, [isOpen, mode, item, menuId, parentId]);

  // Ao trocar o destino, limpa os campos dos outros destinos
  const handleDestinationChange = (dest: Destination) => {
    setDestination(dest);
    setFormData((prev) => ({
      ...prev,
      pageId: dest === "page" ? prev.pageId : null,
      categoryId: dest === "category" ? prev.categoryId : null,
      url: dest === "url" ? prev.url : null,
    }));
  };

  // Filtra os possíveis pais: não pode ser filho de si mesmo nem de um descendente
  const availableParents = useMemo(() => {
    if (!item) return siblingItems;
    const descendantIds = collectDescendantIds(item);
    return siblingItems.filter(
      (s) => s.id !== item.id && !descendantIds.has(s.id),
    );
  }, [siblingItems, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Apenas um destino preenchido
    const payload: Partial<IMenuItem> = {
      ...formData,
      pageId: destination === "page" ? formData.pageId : null,
      categoryId: destination === "category" ? formData.categoryId : null,
      url: destination === "url" ? formData.url : null,
    };
    onSubmit(payload);
  };

  const isValid =
    formData.label?.trim() &&
    ((destination === "page" && formData.pageId) ||
      (destination === "category" && formData.categoryId) ||
      (destination === "url" && formData.url?.trim()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-2 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          {mode === "create" ? "Novo Item de Menu" : "Editar Item"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Configure o item e escolha para onde ele aponta."
            : "Altere os campos desejados."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">
              Rótulo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="Ex: Notícias"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição{" "}
              <small className="text-muted-foreground">(opcional)</small>
            </Label>
            <Textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="resize-none"
              placeholder="Aparece em menus do tipo megamenu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">
              Ícone <small className="text-muted-foreground">(opcional)</small>
            </Label>
            <Input
              id="icon"
              value={formData.icon ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="Ex: Newspaper, FileText (Lucide)"
            />
          </div>

          <div className="space-y-2">
            <Label>Destino</Label>
            <Tabs
              value={destination}
              onValueChange={(v) => handleDestinationChange(v as Destination)}
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="page">Página</TabsTrigger>
                <TabsTrigger value="category">Categoria</TabsTrigger>
                <TabsTrigger value="url">URL externa</TabsTrigger>
              </TabsList>

              <TabsContent value="page" className="pt-3">
                <Select
                  value={formData.pageId ?? NONE}
                  onValueChange={(v) =>
                    setFormData({ ...formData, pageId: v === NONE ? null : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhuma</SelectItem>
                    {isLoadingPage ? (
                      <SelectItem value="__loading__" disabled>
                        Carregando...
                      </SelectItem>
                    ) : (
                      pages?.map((page: IPage) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="category" className="pt-3">
                <Select
                  value={formData.categoryId ?? NONE}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      categoryId: v === NONE ? null : v,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhuma</SelectItem>
                    {isLoadingCategories ? (
                      <SelectItem value="__loading__" disabled>
                        Carregando...
                      </SelectItem>
                    ) : (
                      categories?.map((cat: ICategory) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="url" className="pt-3">
                <Input
                  value={formData.url ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://exemplo.com ou /caminho-interno"
                />
              </TabsContent>
            </Tabs>
          </div>

          {mode === "edit" && availableParents.length > 0 && (
            <div className="space-y-2">
              <Label>Item pai</Label>
              <Select
                value={formData.parentId ?? NONE}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    parentId: v === NONE ? null : v,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum (item raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum (item raiz)</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={formData.order ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch
                id="visible"
                checked={formData.visible ?? true}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, visible: v })
                }
              />
              <Label htmlFor="visible" className="cursor-pointer">
                Visível
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {mode === "create" ? "Adicionar Item" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Coleta recursivamente os IDs dos descendentes de um item. */
function collectDescendantIds(item: IMenuItem): Set<string> {
  const ids = new Set<string>();
  const walk = (node: IMenuItem) => {
    node.children?.forEach((child) => {
      ids.add(child.id);
      walk(child);
    });
  };
  walk(item);
  return ids;
}
