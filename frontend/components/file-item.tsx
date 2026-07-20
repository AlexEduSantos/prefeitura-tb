"use client";
import {
  BadgeQuestionMarkIcon,
  Ban,
  Download,
  Ellipsis,
  File,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { useMediaViewModel } from "@/app/viewmodel/media.viewmodel";
import { toast } from "sonner";
import { useState } from "react";

interface FileRowProps {
  file: any;
  isSelected: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const FileItem = ({
  file,
  onCheckedChange,
  isSelected,
}: FileRowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: file.title,
    description: file.description || "",
    altText: file.altText || "",
    tags: file.tags || [],
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditMode(false);
      setFormData({
        title: file.title,
        description: file.description || "",
        altText: file.altText || "",
        tags: file.tags || [],
      });
    }
  };

  const { deleteMedia, updateMedia } = useMediaViewModel();
  const src = `${process.env.NEXT_PUBLIC_API_URL}/media/file/${file.key}`;

  const handleDeleteMedia = (id: string) => {
    setIsDeleting(true);
    try {
      deleteMedia(id);
      toast.success("Arquivo excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEdit = () => {
    if (editMode) {
      handleUpdateMedia();
    } else {
      setFormData({
        title: file.title,
        description: file.description || "",
        altText: file.altText || "",
        tags: file.tags || [],
      });
    }
    setEditMode(!editMode);
  };

  const handleUpdateMedia = () => {
    updateMedia(
      {
        id: file.id,
        title: formData.title,
        description: formData.description,
        altText: formData.altText,
        tags: formData.tags,
      },
      {
        onSuccess: () => {
          toast.success("Informações atualizadas com sucesso");
        },
        onError: () => {
          toast.error("Erro ao atualizar arquivo");
        },
      },
    );
  };

  const handleDownload = async () => {
    try {
      toast.info("Iniciando download...");
      const response = await fetch(src);
      if (!response.ok) throw new Error("Erro ao baixar");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = file.key
        ? file.key.split("/").pop()
        : file.title || "arquivo";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback em caso de erro ou CORS
      const a = document.createElement("a");
      a.href = src;
      a.target = "_blank";
      a.download = file.title || "arquivo";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card
      className={`p-2 flex flex-col items-start gap-1 shadow-none aspect-square cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 hover:shadow-lg transition-all justify-center ${isSelected ? "bg-primary/10" : ""}`}
    >
      <div className="w-full h-full relative">
        <Checkbox
          className="absolute left-1 top-1 z-10 bg-card shadow-md size-5"
          onCheckedChange={onCheckedChange}
          checked={isSelected}
        />
        <span className="absolute right-1 top-1">
          <Dialog
            key={file.id}
            open={isOpen}
            onOpenChange={handleOpenChange}
            aria-description="Menu lateral com informações do arquivo"
          >
            <DialogTrigger>
              <span className="absolute top-0 right-0 z-10 rounded-lg bg-card shadow-md text-muted-foreground size-5 flex items-center justify-center">
                <Ellipsis size={14} />
              </span>
            </DialogTrigger>
            <DialogContent className="p-4 gap-2">
              <div className="relative">
                <Button
                  className="absolute right-2 bottom-2 size-9 p-1 rounded-lg text-muted-foreground border-none shadow-md"
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="w-full h-full text-primary" />
                </Button>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${file.key}`}
                  alt={file.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <DialogHeader className="">
                <DialogTitle className="text-2xl font-semibold leading-relaxed"></DialogTitle>
              </DialogHeader>
              <ScrollArea className="w-full xl:h-100 h-84 mb-2">
                <div className="flex flex-col gap-2">
                  {editMode && (
                    <Label
                      htmlFor="title"
                      className={`${editMode && "text-primary"}`}
                    >
                      Título
                    </Label>
                  )}
                  <Input
                    id="title"
                    value={formData.title}
                    disabled={!editMode}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={`${editMode ? "font-normal border-primary" : "text-2xl! bg-transparent border-none p-0"}`}
                  />

                  <Label
                    htmlFor="description"
                    className={`${editMode && "text-primary"}`}
                  >
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    disabled={!editMode}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className={`${editMode && "font-normal border-primary"}`}
                  />
                  <div className="flex gap-2">
                    <Label
                      htmlFor="alt-text"
                      className={`${editMode && "text-primary"}`}
                    >
                      Texto Alternativo
                    </Label>
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground">
                        <BadgeQuestionMarkIcon size={14} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Texto alternativo é usado para descrever a imagem para
                          pessoas com deficiência visual e para mecanismos de
                          busca
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="alt-text"
                    value={formData.altText}
                    disabled={!editMode}
                    onChange={(e) =>
                      setFormData({ ...formData, altText: e.target.value })
                    }
                    className={`${editMode && "font-normal border-primary"}`}
                  />
                  <Label>Data de criação</Label>
                  <Input
                    id="created_at"
                    value={format(new Date(file.createdAt), "dd/MM/yyyy")}
                    disabled
                  />
                  <Label>Tipo do arquivo</Label>
                  <Input
                    id="type"
                    value={file.mime_type}
                    disabled
                    className="capitalize"
                  />
                  <Label>Tamanho do arquivo</Label>
                  <Input
                    id="fileSize"
                    value={(file.fileSize / 1024).toFixed(0) + " KB"}
                    disabled
                  />
                  {file.type.startsWith("image/") && (
                    <>
                      <Label>Dimensões do arquivo</Label>
                      <Input
                        id="dimensions"
                        value={`${file.width} x ${file.height}`}
                        disabled
                      />
                    </>
                  )}
                  <Label>Dimensões do arquivo</Label>
                  <Input
                    id="dimensions"
                    value={`${file.width} x ${file.height}`}
                    disabled
                  />
                  {file.updatedAt !== file.createdAt && (
                    <>
                      <Label>Data de atualização</Label>
                      <Input
                        id="updated_at"
                        value={format(new Date(file.updatedAt), "dd/MM/yyyy")}
                        disabled
                      />
                    </>
                  )}
                  {(formData.tags.length > 0 || editMode) && (
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="tags"
                        className={`${editMode && "text-primary"}`}
                      >
                        Tags
                      </Label>

                      {/* Área de visualização das tags */}
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag: string) => (
                          <Badge key={tag} className="flex items-center gap-1">
                            {tag}
                            {editMode && (
                              <div
                                onClick={() => {
                                  const updatedTags = formData.tags.filter(
                                    (t: string) => t !== tag,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    tags: updatedTags,
                                  }));
                                }}
                              >
                                <X
                                  size={12}
                                  className="cursor-pointer hover:text-destructive"
                                />
                              </div>
                            )}
                          </Badge>
                        ))}
                      </div>

                      {/* Input para adicionar nova tag */}
                      {editMode && (
                        <Input
                          placeholder="Digite e aperte Enter..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const newTag = e.currentTarget.value.trim();
                              if (newTag && !formData.tags.includes(newTag)) {
                                setFormData({
                                  ...formData,
                                  tags: [...formData.tags, newTag],
                                });
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="w-full flex mx-auto transition-all duration-300">
                <Button
                  type="button"
                  className="hover:bg-primary hover:text-primary-foreground border! text-muted-foreground border-border! flex-1"
                  variant="secondary"
                  onClick={handleToggleEdit}
                >
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <Save size={16} /> Salvar
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Pencil size={16} /> Editar
                    </div>
                  )}
                </Button>
                {editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-muted-foreground flex-1"
                    onClick={() => {
                      setEditMode(!editMode);
                      setFormData({
                        title: file.title,
                        description: file.description || "",
                        altText: file.altText || "",
                        tags: file.tags || [],
                      });
                    }}
                  >
                    <Ban size={16} />
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:border-destructive hover:bg-destructive/20 hover:text-destructive flex-1"
                  onClick={() => handleDeleteMedia(file.id)}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </span>
        {file.type === "document" && (
          <File size={18} className="text-gray-500" />
        )}
        {file.type === "image" && (
          <>
            {file.status !== "ready" ? (
              <span className="w-full h-full flex items-center justify-center">
                <Loader2 size={18} className="text-primary animate-spin" />
              </span>
            ) : (
              <div className="relative w-full h-full bg-gray-400 rounded-md overflow-hidden">
                <img
                  src={src}
                  alt={file.altText || file.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </>
        )}
        {file.type === "video" && <Video size={18} className="text-red-500" />}
      </div>
      <div className="w-full flex flex-col gap-1">
        <h3 className="text-sm font-medium line-clamp-1 text-left">
          {file.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-accent-foreground/50">
            {format(new Date(file.createdAt), "dd/MM/yyyy")}
          </p>
          <p className="text-xs text-accent-foreground/50">
            {(file.fileSize / 1024).toFixed(0)} KB
          </p>
        </div>
      </div>
    </Card>
  );
};
