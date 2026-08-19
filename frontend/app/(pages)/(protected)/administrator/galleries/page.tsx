import { GalleriesManager } from "@/components/gallery-manager";
import { PainelHeader } from "@/components/painel-header";

export default function GalleryPage() {
  return (
    <div>
      <PainelHeader title="Galerias de Imagens" />
      <div className="p-2">
        <GalleriesManager />
      </div>
    </div>
  );
}
