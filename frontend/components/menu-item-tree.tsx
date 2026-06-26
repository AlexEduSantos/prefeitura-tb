"use client";

import { IMenuItem } from "@/app/type/menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EyeIcon,
  Pencil,
  Trash,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface MenuItemTreeProps {
  items: IMenuItem[];
  onEdit: (item: IMenuItem) => void;
  onDelete: (item: IMenuItem) => void;
  onView?: (item: IMenuItem) => void;
}

function TreeNode({
  item,
  level = 0,
  onEdit,
  onDelete,
  onView,
}: {
  item: IMenuItem;
  level?: number;
  onEdit: (item: IMenuItem) => void;
  onDelete: (item: IMenuItem) => void;
  onView?: (item: IMenuItem) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  // Determina o caminho (página ou URL)
  const path = item.page?.slug
    ? `/${item.page.slug}`
    : item.url && item.url !== "#" && item.url !== "/"
      ? item.url
      : "-";

  // URL para visualização (se existir)
  const viewUrl = item.page?.slug
    ? `/${item.page.slug}`
    : item.url && item.url !== "#" && item.url !== "/"
      ? item.url
      : null;

  return (
    <div>
      <div
        className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 hover:bg-muted/50 rounded-md transition-colors group"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* Coluna 1: Expansão + Label */}
        <div className="col-span-4 flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 hover:bg-muted rounded shrink-0"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span className="font-medium text-sm truncate">{item.label}</span>
        </div>

        {/* Coluna 2: Caminho */}
        <div className="col-span-3 text-sm text-muted-foreground truncate">
          {path}
        </div>

        {/* Coluna 3: Menu */}
        <div className="col-span-2 text-sm truncate">
          {item.menu?.name || "—"}
        </div>

        {/* Coluna 4: Ordem */}
        <div className="col-span-1 text-sm text-muted-foreground text-center">
          {item.order ?? 0}
        </div>

        {/* Coluna 5: Ações */}
        <div className="col-span-2 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && viewUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href={viewUrl} target="_blank">
                <EyeIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filhos */}
      {hasChildren && expanded && (
        <div className="border-l-2 border-muted ml-5">
          {item.children!.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuItemTree({
  items,
  onEdit,
  onDelete,
  onView,
}: MenuItemTreeProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground">
        Nenhum item encontrado.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="grid grid-cols-12 gap-2 items-center px-2 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
        <div className="col-span-4">Label</div>
        <div className="col-span-3">Caminho</div>
        <div className="col-span-2">Menu</div>
        <div className="col-span-1 text-center">Ordem</div>
        <div className="col-span-2 text-right">Ações</div>
      </div>

      {/* Corpo da árvore */}
      <div className="divide-y divide-border">
        {items.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            level={0}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}
