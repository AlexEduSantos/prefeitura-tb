"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
  Edit,
  Trash2,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMenu, IMenuItem } from "@/app/type/menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface MenuTreeManagerProps {
  menu: IMenu;
  onEditItem: (item: IMenuItem) => void;
  onAddItemChild: (parentId: string | null) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (
    reorderedItems: { id: string; order: number; parentId: string | null }[],
  ) => void;

  // Ações do próprio menu
  onEditMenu?: (menu: IMenu) => void;
  onDeleteMenu?: (menuId: string) => void;
}

export function MenuTreeManager({
  menu,
  onEditItem,
  onAddItemChild,
  onDeleteItem,
  onReorder,
  onEditMenu,
  onDeleteMenu,
}: MenuTreeManagerProps) {
  const rootItems = (menu.items ?? []).filter((item) => item.parentId === null);

  return (
    <Collapsible className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <CollapsibleTrigger
        className="flex w-full items-center justify-between pb-4 border-b border-border"
        asChild
      >
        <div>
          <div>
            <h2 className="text-lg font-semibold capitalize">
              Menu: {menu.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Localização: {menu.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onEditMenu && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMenu(menu);
                }}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
            {onDeleteMenu && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que deseja excluir o menu{" "}
                      <span className="italic text-primary">
                        "{menu.title}"
                      </span>{" "}
                      ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá
                      permanentemente o menu.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteMenu(menu.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddItemChild(null);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4" /> Adicionar Item
            </Button>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Lista raiz dos itens do menu */}
      <CollapsibleContent className="flex flex-col gap-2">
        {rootItems.length > 0 ? (
          rootItems.map((item, index) => (
            <TreeNode
              key={item.id}
              item={item}
              index={index}
              level={0}
              onEdit={onEditItem}
              onAddChild={onAddItemChild}
              onDelete={onDeleteItem}
            />
          ))
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
            <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum item cadastrado neste menu.</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Subcomponente Recursivo para os Itens e Subitens
interface TreeNodeProps {
  item: IMenuItem;
  index: number;
  level: number;
  onEdit: (item: IMenuItem) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

function TreeNode({
  item,
  index,
  level,
  onEdit,
  onAddChild,
  onDelete,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  // Indentação dinâmica baseada no nível hierárquico
  const indentationStyle = {
    marginLeft: `${level * 24}px`,
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Linha do Item */}
      <div
        style={indentationStyle}
        className={`flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors ${
          !item.visible ? "opacity-60 bg-muted/20" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Alça de Arraste (Drag Handle) */}
          <button
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Botão de Expandir/Recolher subitens */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          <div>
            <span className="font-medium text-sm">{item.label}</span>
            {item.url && (
              <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.url}
              </span>
            )}
          </div>
        </div>

        {/* Ações do Item */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Adicionar Subitem"
            onClick={() => onAddChild(item.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Editar Item"
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Excluir"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Renderização recursiva dos filhos se expandido */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-1 mt-1">
          {item?.children?.map((child, childIndex) => (
            <TreeNode
              key={child.id}
              item={child}
              index={childIndex}
              level={level + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
