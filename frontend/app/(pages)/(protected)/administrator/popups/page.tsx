import { PainelHeader } from "@/components/painel-header";
import { PopupsManager } from "@/components/popups-manager";

export default function PopupsPage() {
  return (
    <div>
      <PainelHeader title="Popups" />
      <div className="p-2">
        <PopupsManager />
      </div>
    </div>
  );
}
