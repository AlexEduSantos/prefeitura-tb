"use client";
import MateriaForm from "@/components/new-article";
import { PainelHeader } from "@/components/painel-header";

export default function NewArticlePage() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <PainelHeader title="Novo artigo" />
      <div className="w-full max-h-[90vh] overflow-y-auto p-2">
        <MateriaForm />
      </div>
    </div>
  );
}
