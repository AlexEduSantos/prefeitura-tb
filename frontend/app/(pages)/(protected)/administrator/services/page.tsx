import { PainelHeader } from "@/components/painel-header";
import ServicesManager from "@/components/services-manager";

export default function ServiesPage() {
  return (
    <section>
      <PainelHeader title="Serviços" />
      <div className="p-2">
        <ServicesManager />
      </div>
    </section>
  );
}
