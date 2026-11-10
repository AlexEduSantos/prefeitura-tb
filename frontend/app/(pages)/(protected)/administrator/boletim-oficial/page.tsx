import { PainelHeader } from "@/components/painel-header";
import OfficialGazetteManager from "@/components/official-gazette-manager";

export default function OfficialGazettePage() {
  return (
    <section>
      <PainelHeader title="Boletim Oficial" />
      <div className="p-4">
        <OfficialGazetteManager />
      </div>
    </section>
  );
}

