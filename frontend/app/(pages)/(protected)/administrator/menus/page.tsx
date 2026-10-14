"use client";

import MenusList from "@/components/menus-manager";
import { PainelHeader } from "@/components/painel-header";

export default function MenuPage() {
  return (
    <>
      <PainelHeader title="Menus" />
      <div className="p-2">
        <MenusList />
      </div>
    </>
  );
}
