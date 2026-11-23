"use client";

import { useState, useRef, useEffect, type DragEvent } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { IMedia } from "@/app/type/media";
import { useMediaViewModel } from "@/app/viewmodel/media.viewmodel";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

const MAX_BATCH_FILES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const CONCURRENCY_LIMIT = 3;

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string | null;
  title: string;
  altText: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (media: IMedia) => void;
  folderId?: string;
}

function formatFilenameToTitle(filename: string): string {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  const formatted = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return formatted || "arquivo";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMaxFileSize(file: File): { max: number; label: string } {
  if (file.type.startsWith("image/")) {
    return { max: MAX_IMAGE_SIZE, label: "5 MB" };
  }
  if (file.type.startsWith("video/")) {
    return { max: MAX_VIDEO_SIZE, label: "50 MB" };
  }
  return { max: MAX_DOCUMENT_SIZE, label: "10 MB" };
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUpload,
  folderId,
}: MediaUploadModalProps) {
  const { uploadMediaAsync, refetchMedia } = useMediaViewModel();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  // Limpa URLs de preview ao desmontar
  const queuedFilesRef = useRef<QueuedFile[]>([]);

  useEffect(() => {
    queuedFilesRef.current = queuedFiles;
  }, [queuedFiles]);

  useEffect(() => {
    return () => {
      queuedFilesRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const resetState = () => {
    queuedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueuedFiles([]);
    setTitle("");
    setAltText("");
    setDescription("");
    setIsDragging(false);
    setCompletedCount(0);
    setTotalToUpload(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const addFiles = (incoming: FileList | File[]) => {
    const fileArray = Array.from(incoming);
    if (fileArray.length === 0) return;

    const remainingSlots = MAX_BATCH_FILES - queuedFiles.length;
    if (remainingSlots <= 0) {
      toast.warning(
        `Limite máximo de ${MAX_BATCH_FILES} arquivos por envio atingido.`,
      );
      return;
    }

    let filesToProcess = fileArray;
    if (fileArray.length > remainingSlots) {
      toast.warning(
        `É possível enviar no máximo ${MAX_BATCH_FILES} arquivos por vez. Apenas os primeiros ${remainingSlots} foram adicionados.`,
      );
      filesToProcess = fileArray.slice(0, remainingSlots);
    }

    const validItems: QueuedFile[] = [];
    for (const file of filesToProcess) {
      const { max, label } = getMaxFileSize(file);
      if (file.size > max) {
        toast.error(
          `"${file.name}" excede o limite de ${label} e foi ignorado.`,
        );
        continue;
      }

      const autoTitle = formatFilenameToTitle(file.name);
      validItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        title: autoTitle,
        altText: autoTitle,
        status: "pending",
      });
    }

    if (validItems.length === 0) return;

    const updated = [...queuedFiles, ...validItems];
    setQueuedFiles(updated);

    if (updated.length === 1) {
      setTitle(updated[0].title);
      setAltText(updated[0].altText);
    } else {
      setTitle("");
      setAltText("");
      setDescription("");
    }
  };

  const handleRemoveFile = (id: string) => {
    if (isUploading) return;
    const target = queuedFiles.find((item) => item.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const updated = queuedFiles.filter((item) => item.id !== id);
    setQueuedFiles(updated);

    if (updated.length === 1) {
      setTitle(updated[0].title);
      setAltText(updated[0].altText);
    } else if (updated.length === 0) {
      setTitle("");
      setAltText("");
      setDescription("");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    const itemsToUpload = queuedFiles.filter(
      (item) => item.status === "pending" || item.status === "error",
    );
    if (itemsToUpload.length === 0) {
      toast.error("Selecione pelo menos um arquivo para enviar.");
      return;
    }

    const isSingle = queuedFiles.length === 1;
    setIsUploading(true);
    setCompletedCount(0);
    setTotalToUpload(itemsToUpload.length);

    let successCount = 0;
    let errorCount = 0;
    let lastUploaded: IMedia | null = null;
    let cursor = 0;

    const worker = async () => {
      while (cursor < itemsToUpload.length) {
        const currentIndex = cursor++;
        const item = itemsToUpload[currentIndex];

        setQueuedFiles((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "uploading", error: undefined } : q,
          ),
        );

        const resolvedTitle = isSingle
          ? title.trim() || item.title
          : item.title;
        const resolvedAltText = isSingle
          ? altText.trim() || resolvedTitle
          : item.altText || resolvedTitle;
        const resolvedDescription = isSingle
          ? description.trim() || undefined
          : undefined;

        try {
          const uploaded = await uploadMediaAsync({
            file: item.file,
            metadata: {
              title: resolvedTitle,
              altText: resolvedAltText,
              description: resolvedDescription,
              folderId,
            },
          });
          successCount++;
          lastUploaded = uploaded;
          setQueuedFiles((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "success" } : q,
            ),
          );
        } catch (err) {
          errorCount++;
          const message =
            err instanceof Error ? err.message : "Erro ao enviar arquivo";
          setQueuedFiles((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "error", error: message } : q,
            ),
          );
        } finally {
          setCompletedCount((prev) => prev + 1);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, itemsToUpload.length) },
      () => worker(),
    );
    await Promise.all(workers);

    setIsUploading(false);
    refetchMedia();

    if (lastUploaded && onUpload) {
      onUpload(lastUploaded);
    }

    if (errorCount === 0) {
      toast.success(
        successCount === 1
          ? "Upload realizado com sucesso!"
          : `${successCount} arquivos enviados com sucesso!`,
      );
      resetState();
      onClose();
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} enviado(s) com sucesso e ${errorCount} com erro. Você pode tentar novamente os arquivos com falha.`,
      );
    } else {
      toast.error("Erro ao realizar upload dos arquivos selecionados.");
    }
  };

  const pendingOrErrorCount = queuedFiles.filter(
    (item) => item.status === "pending" || item.status === "error",
  ).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload de Mídia</DialogTitle>
          <DialogDescription>
            Envie até {MAX_BATCH_FILES} arquivos por vez. Título e texto
            alternativo são preenchidos automaticamente pelo nome do arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 overflow-y-auto pr-1">
          {/* Área de Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
              isUploading
                ? "opacity-50 cursor-not-allowed border-border"
                : isDragging
                  ? "border-primary bg-primary/5 cursor-pointer"
                  : "border-border hover:border-primary/60 hover:bg-muted/40 cursor-pointer"
            }`}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <div className="text-sm font-medium">
              Clique para selecionar ou arraste os arquivos aqui
            </div>
            <p className="text-xs text-muted-foreground">
              Até {MAX_BATCH_FILES} arquivos por lote (imagens até 5 MB)
            </p>
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              multiple
              disabled={isUploading}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  addFiles(e.target.files);
                }
                e.target.value = "";
              }}
            />
          </div>

          {/* Lista de arquivos selecionados */}
          {queuedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {queuedFiles.length} de {MAX_BATCH_FILES}{" "}
                  {queuedFiles.length === 1
                    ? "arquivo selecionado"
                    : "arquivos selecionados"}
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={resetState}
                    className="hover:text-foreground underline cursor-pointer"
                  >
                    Limpar todos
                  </button>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {queuedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                  >
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="size-10 rounded object-cover shrink-0 bg-muted"
                      />
                    ) : item.file.type.startsWith("video/") ? (
                      <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Video className="size-5 text-red-500" />
                      </div>
                    ) : (
                      <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {queuedFiles.length === 1
                          ? title.trim() || item.title
                          : item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.file.name} · {formatFileSize(item.file.size)}
                      </p>
                      {item.error && (
                        <p className="text-xs text-destructive truncate">
                          {item.error}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {item.status === "uploading" && (
                        <Loader2 className="size-4 text-primary animate-spin" />
                      )}
                      {item.status === "success" && (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      )}
                      {item.status === "error" && (
                        <AlertCircle className="size-4 text-destructive" />
                      )}
                      {(item.status === "pending" ||
                        item.status === "error") &&
                        !isUploading && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Remover arquivo"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos opcionais quando há apenas 1 arquivo selecionado */}
          {queuedFiles.length === 1 && (
            <div className="grid gap-3 pt-1 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  value={title}
                  disabled={isUploading}
                  placeholder="Preenchido automaticamente pelo nome do arquivo"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alt-text">Texto Alternativo (opcional)</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  disabled={isUploading}
                  placeholder="Preenchido automaticamente pelo nome do arquivo"
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  disabled={isUploading}
                  placeholder="Digite uma descrição para o arquivo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || pendingOrErrorCount === 0}
          >
            {isUploading
              ? `Enviando ${completedCount} de ${totalToUpload}...`
              : pendingOrErrorCount > 1
                ? `Enviar ${pendingOrErrorCount} arquivos`
                : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
