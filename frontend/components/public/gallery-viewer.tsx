"use client";
import { IGallery, IGalleryImage } from "@/app/type/gallery";
import Image from "next/image";
import { PublicImageVisualizer } from "./image-visualizer";
import { useState } from "react";

type GalleryProps = {
  gallery: IGallery;
};

export function GaleryView({ gallery }: GalleryProps) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<IGalleryImage | null>(
    null,
  );

  const slides = gallery?.slides || [];
  const slideLength = slides.length;

  // ✅ Retorna -1 quando não encontrar (padrão do findIndex)
  const currentIndex = selectedImage
    ? slides.findIndex((s) => s.id === selectedImage.id)
    : -1;

  const handleNext = () => {
    if (currentIndex < 0) return;
    if (currentIndex < slideLength - 1) {
      setSelectedImage(slides[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex < 0) return;
    if (currentIndex > 0) {
      setSelectedImage(slides[currentIndex - 1]);
    }
  };

  return (
    <div className="w-full flex gap-2 flex-col">
      <div className="flex gap-2 uppercase items-center">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="tracking-widest">Galeria de Imagens</h2>
        <div className="flex-1 h-px bg-muted-foreground/20" />
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 overflow-hidden">
        {gallery?.slides?.map((image) => (
          <div
            key={image.id}
            className="relative aspect-video max-h-60 overflow-hidden rounded-lg group cursor-pointer"
            onClick={() => {
              setSelectedImage(image);
              setOpen(true);
            }}
          >
            <Image
              loader={() =>
                `${process.env.NEXT_PUBLIC_API_URL}/media/file/${image.media?.key}`
              }
              src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${image.media?.key}`}
              alt={image.caption || ""}
              fill
              className="transition-transform duration-300 group-hover:scale-105 object-cover"
            />
          </div>
        ))}
      </div>

      <PublicImageVisualizer
        open={open}
        onOpenChange={setOpen}
        name={selectedImage?.caption || gallery.title}
        image={selectedImage?.media || undefined!}
        mode="modal"
        alt={selectedImage?.caption || gallery.title}
        onNext={handleNext}
        onPrev={handlePrev}
        index={currentIndex >= 0 ? currentIndex : undefined}
        length={slideLength}
      />
    </div>
  );
}
