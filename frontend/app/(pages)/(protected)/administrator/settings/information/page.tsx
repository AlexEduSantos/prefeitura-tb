import { PainelHeader } from "@/components/painel-header";
import { SettingsManager } from "@/components/settings-manager";

export default function InformationPage() {
  return (
    <section>
      <PainelHeader title="Configurações" />
      <div className="p-2">
        <SettingsManager />
      </div>
    </section>
  );
}
