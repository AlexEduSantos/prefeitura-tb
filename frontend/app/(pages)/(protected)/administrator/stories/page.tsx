"use client";

import { useRouter } from "next/navigation";
import { PainelHeader } from "../../../../../components/painel-header";
import { StoriesManager } from "../../../../../components/stories-manager";

export function StoriesPage() {
  const router = useRouter();
  return (
    <>
      <PainelHeader title="Destaques" />
      <div className="p-2">
        <StoriesManager />
      </div>
    </>
  );
}

export default StoriesPage;
