"use client";

import { PageManager } from "@/components/pages-manager";
import { PainelHeader } from "@/components/painel-header";

export default function EditorPage() {
  return (
    <>
      <PainelHeader title="Páginas e Menus" />
      <div className="p-2">
        <PageManager />
      </div>
    </>
  );
}
