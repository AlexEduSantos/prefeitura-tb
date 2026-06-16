"use client";
import { IMenuItem } from "@/app/type/menu";
import { useMenusViewModel } from "@/app/viewmodel/menus.viewmodel";
import { MenuItemsTable } from "@/components/menu-items-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

type TreeNode = Omit<IMenuItem, "children"> & { children: TreeNode[] };

function buildTree(items: IMenuItem[]): TreeNode[] {
  // 1. Ordenar todos os itens por 'order'
  const sorted = [...items].sort((a, b) => a.order - b.order);

  // 2. Criar um mapa para acesso rápido
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  sorted.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // 3. Montar a árvore
  sorted.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function RenderMenuItem({ item }: { item: TreeNode }) {
  // Se tiver filhos, renderiza como submenu
  if (item.children.length > 0) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.children.map((child) => (
            <RenderMenuItem key={child.id} item={child} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Caso contrário, é um item comum
  return (
    <DropdownMenuItem>
      {item.url ? (
        <a href={item.url}>{item.label}</a>
      ) : (
        <span>{item.label}</span>
      )}
    </DropdownMenuItem>
  );
}

export default function TestPage() {
  const { menus, syncMenuItems } = useMenusViewModel();

  if (!menus) {
    return (
      <div className="w-full h-screen flex items-center justify-center gap-2">
        Carregando...
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-2">
      {menus.map((menu) => {
        // Constrói a árvore ordenada para este menu
        const treeItems = buildTree(menu.items as IMenuItem[]);

        return (
          <Button
            key={menu.id}
            className="p-2 border border-border rounded-full flex"
          >
            {menu.name}
          </Button>
        );
      })}
    </div>
  );
}
