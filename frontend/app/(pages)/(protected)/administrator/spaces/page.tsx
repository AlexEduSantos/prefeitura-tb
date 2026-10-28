import { PainelHeader } from "@/components/painel-header";
import SpaceManager from "@/components/space-manager";

export default function SpacesPage() {
  return (
    <section>
      <PainelHeader title="Áreas de Atuação" />
      <div className="p-2">
        <SpaceManager />
      </div>
    </section>
  );
}
