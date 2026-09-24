import { FileExplorer } from "@/components/media-manager";
import { PainelHeader } from "@/components/painel-header";

export default function MediaPage() {
  return (
    <div>
      <PainelHeader title="Gerenciador de Mídia" />
      <div className="p-4">
        <FileExplorer />
      </div>
    </div>
  );
}
