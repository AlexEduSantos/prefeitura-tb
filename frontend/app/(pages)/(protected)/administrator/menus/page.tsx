"use client";

import { MenusManager } from "@/components/menu-manager";
import { PainelHeader } from "@/components/painel-header";

export default function MenuPage() {
  return (
    <>
      <PainelHeader title="Menus" />
      <div className="p-2">
        <MenusManager />
      </div>
    </>
  );
}
