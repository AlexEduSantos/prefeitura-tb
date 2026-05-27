import MediaManager from "@/components/media-manager";
import { PainelHeader } from "@/components/painel-header";

export default function MediaPage() {
  return (
    <div>
      <PainelHeader title="Gerenciador de Mídia" />
      <div className="p-2">
        <MediaManager />
      </div>
    </div>
  );
}
