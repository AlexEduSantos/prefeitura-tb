"use client";
import MateriaForm from "@/components/new-article";
import { PainelHeader } from "@/components/painel-header";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <PainelHeader title="Novo artigo" />
      <MateriaForm />
    </div>
  );
}
