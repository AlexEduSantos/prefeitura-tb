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
import { useState, type MouseEvent } from "react";
import { TableCell, TableRow } from "./ui/table";
import { IMedia } from "@/app/type/media";

type FileItemMedia = IMedia & {
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileType(file: FileItemMedia): string {
  const mime = file.mimeType || file.mime_type;
  if (typeof mime === "string" && mime.includes("/")) {
    const sub = mime.split("/").pop()?.toUpperCase() || "";
    if (sub.includes("WORDPROCESSINGML")) return "DOCX";
    if (sub.includes("SPREADSHEETML")) return "XLSX";
    if (sub === "MSWORD") return "DOC";
    if (sub === "VND.MS-EXCEL") return "XLS";
    if (sub === "JPEG") return "JPG";
    return sub;
  }
  return (file.type || "Arquivo").toUpperCase();
}

interface FileRowProps {
  file: FileItemMedia;
  isSelected: boolean;
  onSelect: (event: MouseEvent<HTMLElement>) => void;
  onCheckedChange: (checked: boolean) => void;
  viewMode?: "grid" | "list";
}

export const FileItem = ({
  file,
  onSelect,
  onCheckedChange,
  isSelected,
  viewMode = "grid",
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
      const filename =
        (file.key ? file.key.split("/").pop() : undefined) ||
        file.title ||
        "arquivo";
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

  const fileSizeValue = file.fileSize ?? file.file_size;
  const mimeTypeValue = file.mimeType || file.mime_type || "—";
  const createdAtValue = file.createdAt ?? file.created_at;
  const updatedAtValue = file.updatedAt ?? file.updated_at;
  const hasDimensions = Boolean(file.width && file.height);

  const renderDetailsDialog = (triggerClassName: string) => (
    <Dialog
      key={file.id}
      open={isOpen}
      onOpenChange={handleOpenChange}
      aria-description="Menu lateral com informações do arquivo"
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
          title="Detalhes do arquivo"
        >
          <Ellipsis size={14} />
        </button>
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
            className="w-full max-h-72 object-contain bg-muted rounded-xl"
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
                    pessoas com deficiência visual e para mecanismos de busca
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
              value={
                createdAtValue
                  ? format(new Date(createdAtValue), "dd/MM/yyyy HH:mm")
                  : "—"
              }
              disabled
            />
            <Label>Tipo do arquivo</Label>
            <Input
              id="type"
              value={mimeTypeValue}
              disabled
              className="capitalize"
            />
            <Label>Tamanho do arquivo</Label>
            <Input
              id="fileSize"
              value={formatFileSize(fileSizeValue)}
              disabled
            />
            {hasDimensions && (
              <>
                <Label>Dimensões do arquivo</Label>
                <Input
                  id="dimensions"
                  value={`${file.width} x ${file.height}`}
                  disabled
                />
              </>
            )}
            {updatedAtValue && updatedAtValue !== createdAtValue && (
              <>
                <Label>Data de atualização</Label>
                <Input
                  id="updated_at"
                  value={format(new Date(updatedAtValue), "dd/MM/yyyy HH:mm")}
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
  );

  if (viewMode === "list") {
    return (
      <TableRow
        onClick={onSelect}
        className={`cursor-pointer select-none transition-colors ${
          isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
        }`}
      >
        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            className="size-4"
            onCheckedChange={(checked) => onCheckedChange(checked === true)}
            checked={isSelected}
          />
        </TableCell>
        <TableCell className="max-w-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50">
              {file.type === "document" && (
                <File size={18} className="text-gray-500" />
              )}
              {file.type === "video" && (
                <Video size={18} className="text-red-500" />
              )}
              {file.type === "image" &&
                (file.status !== "ready" ? (
                  <Loader2 size={16} className="text-primary animate-spin" />
                ) : (
                  <img
                    src={src}
                    alt={file.altText || file.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.title}</p>
              {file.altText && file.altText !== file.title && (
                <p className="text-xs text-muted-foreground truncate">
                  {file.altText}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Badge variant="secondary" className="text-[11px] font-medium">
            {formatFileType(file)}
          </Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell text-xs text-muted-foreground tabular-nums">
          {hasDimensions ? `${file.width} × ${file.height}` : "—"}
        </TableCell>
        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground tabular-nums">
          {formatFileSize(fileSizeValue)}
        </TableCell>
        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground tabular-nums">
          {createdAtValue
            ? format(new Date(createdAtValue), "dd/MM/yyyy HH:mm")
            : "—"}
        </TableCell>
        <TableCell
          className="w-12 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end">
            {renderDetailsDialog(
              "size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer",
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Card
      onClick={onSelect}
      className={`p-2 flex flex-col items-start gap-1.5 shadow-none aspect-square overflow-hidden select-none cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 hover:shadow-lg transition-all ${
        isSelected ? "bg-primary/10 ring-2 ring-primary ring-offset-1" : ""
      }`}
    >
      <div className="w-full flex-1 min-h-0 relative overflow-hidden rounded-md">
        <div
          className="absolute left-1 top-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            className="bg-card shadow-md size-5"
            onCheckedChange={(checked) => onCheckedChange(checked === true)}
            checked={isSelected}
          />
        </div>
        <span
          className="absolute right-1 top-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {renderDetailsDialog(
            "rounded-lg bg-card shadow-md text-muted-foreground size-5 flex items-center justify-center hover:text-foreground cursor-pointer",
          )}
        </span>
        {file.type === "document" && (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-md">
            <File size={28} className="text-gray-500" />
          </div>
        )}
        {file.type === "image" && (
          <>
            {file.status !== "ready" ? (
              <span className="w-full h-full flex items-center justify-center bg-muted/50 rounded-md">
                <Loader2 size={18} className="text-primary animate-spin" />
              </span>
            ) : (
              <div className="relative w-full h-full bg-muted rounded-md overflow-hidden">
                <img
                  src={src}
                  alt={file.altText || file.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}
          </>
        )}
        {file.type === "video" && (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-md">
            <Video size={28} className="text-red-500" />
          </div>
        )}
      </div>
      <div className="w-full flex flex-col gap-0.5 shrink-0">
        <h3 className="text-sm font-medium line-clamp-1 text-left">
          {file.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-accent-foreground/50">
            {createdAtValue
              ? format(new Date(createdAtValue), "dd/MM/yyyy")
              : "—"}
          </p>
          <p className="text-xs text-accent-foreground/50">
            {formatFileSize(fileSizeValue)}
          </p>
        </div>
      </div>
    </Card>
  );
};
