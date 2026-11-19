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
  const [warningState, setWarningState] = useState<{
    key: string;
    message: string | null;
  }>({ key: "", message: null });

  const itemToValidate =
    isOpen && targetPreset && selectedItems.length > 0
      ? selectedItems[selectedItems.length - 1]
      : null;
  const activeKey = itemToValidate?.key ?? "";

  // Validação de dimensões da imagem selecionada em relação ao preset do local de uso
  useEffect(() => {
    if (!targetPreset || !activeKey) {
      return;
    }

    let isMounted = true;
    const src = `${process.env.NEXT_PUBLIC_API_URL}/media/file/${activeKey}`;
    checkImageDimensions(src, targetPreset).then((res) => {
      if (!isMounted) return;
      if (res && !res.isValid && res.warningMessage) {
        setWarningState({ key: activeKey, message: res.warningMessage });
      } else {
        setWarningState({ key: activeKey, message: null });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeKey, targetPreset]);

  const dimensionWarning =
    activeKey && warningState.key === activeKey ? warningState.message : null;

  const handleClose = () => {
    setSelectedItems([]);
    setWarningState({ key: "", message: null });
    onClose();
  };

  const handleSelect = () => {
    if (selectedItems.length > 0) {
      onSelect(multiple ? selectedItems : selectedItems[0]);
      handleClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        aria-describedby="media-picker-modal"
        className="max-w-6xl! w-full h-[85vh] flex flex-col justify-between"
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
