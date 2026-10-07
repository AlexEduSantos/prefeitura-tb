"use client";
import { IGallery, IGalleryImage } from "@/app/type/gallery";
import { IMedia } from "@/app/type/media";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { PlusIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import { Carousel } from "./carousel";
import { MediaPickerModal } from "./media-picker-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { IOrganization } from "@/app/type/organization";

interface GalleryModalProps {
  gallery?: IGallery | null;
  mode: "view" | "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave?: (item: any) => void;
  organizations?: IOrganization[];
  mediaList?: IMedia[];
}

export function GalleryModal({
  gallery,
  mode,
  isOpen,
  onClose,
  onSave,
  organizations = [],
  mediaList = [],
}: GalleryModalProps) {
  const [formData, setFormData] = useState<any>({
    title: "",
    active: false,
    organizationId: "",
    slides: [],
  });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode !== "create" && gallery) {
        setFormData({
          id: gallery.id,
          title: gallery.title,
          active: gallery.active,
          organizationId: gallery.organizationId || "",
          slides:
            gallery.slides?.map((s) => ({
              mediaId: s.mediaId,
              order: s.order,
              caption: s.caption || "",
              link: s.link || "",
              media: s.media,
            })) || [],
        });
      } else {
        setFormData({
          title: "",
          active: false,
          slides: [],
        });
      }
    }
  }, [gallery, mode, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSlideChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newSlides = [...(prev.slides || [])];
      newSlides[index] = { ...newSlides[index], [field]: value };
      return { ...prev, slides: newSlides };
    });
  };

  const handleMediaSelect = (selectedMedia: IMedia | IMedia[]) => {
    const mediaArray = Array.isArray(selectedMedia)
      ? selectedMedia
      : [selectedMedia];
    setFormData((prev: any) => ({
      ...prev,
      slides: [
        ...(prev.slides || []),
        ...mediaArray.map((media, idx) => ({
          mediaId: media.id,
          order: (prev.slides?.length || 0) + idx + 1,
          caption: "",
          link: "",
          media,
        })),
      ],
    }));
  };

  const removeSlide = (index: number) => {
    setFormData((prev: any) => {
      const newSlides = [...(prev.slides || [])];
      newSlides.splice(index, 1);
      // Reorder
      newSlides.forEach((s, i) => (s.order = i + 1));
      return { ...prev, slides: newSlides };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      console.log(formData);
      onSave(formData);
    }
  };

  if (mode === "view" && gallery) {
    const imageLoader = (src: string) => {
      return `${process.env.NEXT_PUBLIC_API_URL}/media/file/${src}`;
    };
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="min-w-fit">
            <DialogHeader>
              <DialogTitle>
                Visualização da Galeria {gallery?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="min-w-xl p-2">
              {gallery.slides.length > 1 ? (
                <Carousel slides={gallery.slides} />
              ) : (
                <div
                  className="w-full h-75 relative overflow-y-auto rounded-xl"
                  key={gallery.slides[0].id}
                >
                  <Image
                    loader={() => imageLoader(gallery.slides[0].media.key)}
                    src={gallery.slides[0].media.key}
                    alt={gallery.slides[0].caption ?? ""}
                    fill
                    className="object-cover object-center"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  } else {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Adicionar Galeria" : "Editar Galeria"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? "Preencha os dados abaixo para criar um nova galeria"
                  : "Preencha os dados abaixo para editar a galeria selecionada"}
              </DialogDescription>
            </DialogHeader>
            <form
              id="gallery-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Nome da Galeria</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ex: Galeria de Fotos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationId">Secretaria / Órgão</Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={(val) => handleChange("organizationId", val)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma secretaria/órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={"flex items-center space-x-2 pb-4 border-b"}>
                <Switch
                  id="active"
                  checked={formData.active || false}
                  onCheckedChange={(checked) => handleChange("active", checked)}
                />
                <Label htmlFor="active">
                  {formData.active ? "Ativa" : "Inativa"}
                </Label>
              </div>

              <ScrollArea className="sm:max-h-75 max-h-50 overflow-y-auto scrollbar-none  space-y-2">
                <Label className="text-lg font-semibold">
                  Imagens da Galeria
                </Label>

                {/* Imagens Selecionadas */}
                <div className="space-y-2">
                  {(formData.slides || []).map((slide: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 border rounded-lg bg-muted/20"
                    >
                      <div className="w-24 h-24 relative rounded overflow-hidden shrink-0">
                        {slide.media && (
                          <Image
                            loader={() =>
                              `${process.env.NEXT_PUBLIC_API_URL}/media/file/${slide.media.key}`
                            }
                            src={slide.media.key}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Legenda (Caption)"
                          value={slide.caption}
                          onChange={(e) =>
                            handleSlideChange(index, "caption", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Link de redirecionamento"
                          value={slide.link}
                          onChange={(e) =>
                            handleSlideChange(index, "link", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSlide(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.slides || formData.slides.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                      Nenhuma imagem selecionada.
                    </div>
                  )}
                </div>

                {/* Seleção de Novas Imagens */}
              </ScrollArea>
              <div className="pt-4 border-t space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="w-full border-dashed"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar Mídias da Biblioteca
                </Button>
              </div>
            </form>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" form="gallery-form">
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          multiple={true}
        />
      </>
    );
  }
}
