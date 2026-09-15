"use client";

import { IMedia } from "@/app/type/media";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageVisualizerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNext?: () => void;
  onPrev?: () => void;
  name: string;
  image: IMedia;
  alt?: string;
  mode: "modal" | "full";
  length?: number;
  index?: number;
}

export function PublicImageVisualizer({
  open = false,
  onOpenChange = () => {},
  onNext,
  onPrev,
  image,
  alt,
  mode = "modal",
  length,
  index,
}: ImageVisualizerProps) {
  if (mode === "full") {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${image.key}`}
          alt={alt || image.title}
          className="object-cover object-center"
        />
      </div>
    );
  }

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="min-w-[60%] p-2 rounded-lg sm:rounded-2xl sm:p-6"
      >
        <DialogTitle className="capitalize hidden">{image.title}</DialogTitle>
        {image ? (
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            <div
              onClick={() => onOpenChange(false)}
              className="absolute top-2 right-2 z-50 bg-white/90 rounded-full p-1 cursor-pointer"
            >
              <X size={14} />
            </div>
            <div
              onClick={onPrev}
              className={`absolute transition-all duration-300 bg-white/90 rounded-full p-1 top-1/2 left-2 z-50 cursor-pointer ${index !== undefined && length !== undefined && index <= 0 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <ChevronLeft size={16} />
            </div>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${image.key}`}
              alt={alt || image.title}
              className="object-cover object-center"
            />
            <div
              onClick={onNext}
              className={`absolute transition-all duration-300 bg-white/90 rounded-full p-1  top-1/2 right-2 z-50 cursor-pointer ${index !== undefined && length !== undefined && index >= length - 1 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <ChevronRight size={16} />
            </div>
            {index !== undefined && length !== undefined && (
              <div
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white p-1 rounded-full transition-all duration-300 flex gap-2`}
              >
                {Array.from({ length: length }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all ${index === i ? "bg-primary" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>No image</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
