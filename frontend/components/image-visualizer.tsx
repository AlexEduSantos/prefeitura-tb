"use client";

import { IMedia } from "@/app/type/media";
import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

interface ImageVisualizerProps {
  name: string;
  image: IMedia;
  alt?: string;
  mode: "modal" | "full";
}

export function ImageVisualizer({
  name,
  image,
  alt,
  mode = "modal",
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
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <ImageIcon className="h-6 w-6 stroke-1" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="min-w-[60%] p-2 rounded-lg sm:rounded-2xl sm:p-6"
      >
        <DialogTitle className="capitalize hidden">{name}</DialogTitle>
        {image ? (
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${image.key}`}
              alt={alt || image.title}
              className="object-cover object-center"
            />
          </div>
        ) : (
          <p>No image</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
