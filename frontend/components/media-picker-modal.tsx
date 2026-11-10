"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IMedia } from "../app/type/media";
import { MediaExplorer } from "./media-explorer";
import {
  checkImageDimensions,
  ImageDimensionPreset,
} from "@/lib/image-dimensions";
import { AlertTriangleIcon } from "lucide-react";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: IMedia | IMedia[]) => void;
  multiple?: boolean;
  targetPreset?:
    | "story"
    | "article-cover"
    | "avatar"
    | "gallery"
    | ImageDimensionPreset;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  targetPreset,
}: MediaPickerModalProps) {
  const [selectedItems, setSelectedItems] = useState<IMedia[]>([]);
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null);

  // Limpa seleção e aviso ao abrir ou fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedItems([]);
      setDimensionWarning(null);
    }
  }, [isOpen]);

  // Validação de dimensões da imagem selecionada em relação ao preset do local de uso
  useEffect(() => {
    if (!targetPreset || selectedItems.length === 0) {
      setDimensionWarning(null);
      return;
    }

    let isMounted = true;
    const itemToValidate = selectedItems[selectedItems.length - 1];

    if (itemToValidate && itemToValidate.key) {
      const src = `${process.env.NEXT_PUBLIC_API_URL}/media/file/${itemToValidate.key}`;
      checkImageDimensions(src, targetPreset).then((res) => {
        if (!isMounted) return;
        if (res && !res.isValid && res.warningMessage) {
          setDimensionWarning(res.warningMessage);
        } else {
          setDimensionWarning(null);
        }
      });
    } else {
      setDimensionWarning(null);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedItems, targetPreset]);

  const handleSelect = () => {
    if (selectedItems.length > 0) {
      onSelect(multiple ? selectedItems : selectedItems[0]);
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby="media-picker-modal"
        className="max-w-6xl h-[85vh] flex flex-col justify-between"
      >
        <DialogHeader>
          <DialogTitle>Selecionar Mídia</DialogTitle>
        </DialogHeader>

        <main className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-2">
          <MediaExplorer
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            multiple={multiple}
            gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            showSearch={false}
            containerClassName="flex flex-col gap-4 h-full"
            enableBulkDelete={false}
          />
        </main>

        <div className="flex flex-col gap-3 pt-3 border-t">
          {dimensionWarning && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">
                  Aviso de Compatibilidade de Imagem:
                </span>
                <span>{dimensionWarning}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 w-full">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              disabled={selectedItems.length === 0}
              onClick={handleSelect}
            >
              Selecionar{" "}
              {multiple && selectedItems.length > 0
                ? `(${selectedItems.length})`
                : null}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
