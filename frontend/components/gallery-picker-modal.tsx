"use client";

import { useGalleryViewModel } from "@/app/viewmodel/gallery.viewmodal";
import { IGallery } from "../app/type/gallery";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { CheckCircle2Icon, ImageIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryModal } from "./gallery-modal";
import { toast } from "sonner";

interface GalleryPickerModelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: (gallery: IGallery) => void;
  selectedGallery?: IGallery | null;
}

export function GalleryPickerModal({
  isOpen,
  onClose,
  onSelectGallery,
  selectedGallery,
}: GalleryPickerModelProps) {
  const {
    galleryList,
    isLoadingGallery,
    refetchGallery,
    createBanner,
    mediaList,
  } = useGalleryViewModel();

  const [picked, setPicked] = useState<IGallery | null>(selectedGallery ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sincroniza o estado local sempre que o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setPicked(selectedGallery ?? null);
    }
  }, [isOpen, selectedGallery]);

  const getMediaUrl = (key: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/media/file/${key}`;

  const handleConfirm = () => {
    if (picked) {
      onSelectGallery(picked);
      onClose();
    }
  };

  const handleSaveNewGallery = (data: any) => {
    createBanner(data, {
      onSuccess: (newGallery: any) => {
        toast.success("Galeria criada com sucesso!");
        setIsCreateOpen(false);
        refetchGallery();
        if (newGallery) {
          setPicked(newGallery);
        }
      },
      onError: () => {
        toast.error("Erro ao criar galeria");
      },
    });
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          aria-describedby="gallery-picker-description"
          className="w-[90vw]! max-w-[90vw]! max-h-[85vh] flex flex-col"
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b pb-3">
            <div className="space-y-1">
              <DialogTitle>Selecionar Galeria de Imagens</DialogTitle>
              <DialogDescription id="gallery-picker-description">
                Clique em uma galeria para selecioná-la e depois confirme.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Nova Galeria
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingGallery ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Carregando galerias...
              </div>
            ) : galleryList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
                <span className="text-sm">Nenhuma galeria cadastrada.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Criar Primeira Galeria
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
                {galleryList.map((gallery) => {
                  const isSelected = picked?.id === gallery.id;
                  const firstSlide = gallery.slides?.[0];
                  const galleryTitle =
                    gallery.title ?? (gallery as any).name ?? "Sem título";

                  return (
                    <button
                      key={gallery.id}
                      type="button"
                      onClick={() => setPicked(gallery)}
                      className={cn(
                        "relative group flex flex-col text-left rounded-xl border-2 overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "border-primary shadow-md shadow-primary/20"
                          : "border-border hover:border-primary/50 hover:shadow-sm",
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-video bg-muted overflow-hidden">
                        {firstSlide ? (
                          <img
                            src={getMediaUrl(firstSlide.media.key)}
                            alt={firstSlide.caption ?? galleryTitle}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}

                        {/* Overlay de seleção */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <CheckCircle2Icon className="h-10 w-10 text-primary drop-shadow-md" />
                          </div>
                        )}

                        {/* Contador de slides */}
                        {gallery.slides?.length > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded-md">
                            {gallery.slides.length} fotos
                          </span>
                        )}
                      </div>

                      {/* Nome / Título da galeria */}
                      <div
                        className={cn(
                          "px-3 py-2 text-sm font-medium truncate transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-card text-card-foreground",
                        )}
                      >
                        {galleryTitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-2 border-t">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!picked}
              onClick={handleConfirm}
            >
              {picked
                ? `Selecionar "${picked.title ?? (picked as any).name ?? "Galeria"}"`
                : "Selecione uma galeria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GalleryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        onSave={handleSaveNewGallery}
        mediaList={mediaList}
      />
    </>
  );
}
