import { OrganizationManager } from "@/components/organization-manager";
import { PainelHeader } from "@/components/painel-header";

export default function OrganizationPage() {
  return (
    <section className="flex flex-col h-screen w-full overflow-hidden">
      <PainelHeader title="Organização Setorial" />
      <div className="flex-1 min-h-0">
        <OrganizationManager />
      </div>
    </section>
  );
}
