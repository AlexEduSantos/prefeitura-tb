"use client";
import { PainelHeader } from "@/components/painel-header";
import TestComponent from "@/components/test";

export default function TestPage() {
  return (
    <div>
      <PainelHeader title="Teste" />
      <div className="p-2">
        <TestComponent />
      </div>
    </div>
  );
}
