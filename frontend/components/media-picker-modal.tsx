"use client";

import { useState } from "react";
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

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: IMedia | IMedia[]) => void;
  multiple?: boolean;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
}: MediaPickerModalProps) {
  const [selectedItems, setSelectedItems] = useState<IMedia[]>([]);

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
        className="max-w-6xl h-[80vh] flex flex-col justify-between"
      >
        <DialogHeader>
          <DialogTitle>Selecionar Mídia</DialogTitle>
        </DialogHeader>
        <main className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
          <MediaExplorer
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            multiple={multiple}
            gridClassName="grid grid-cols-2 gap-4"
            showSearch={false}
            containerClassName="flex flex-col gap-4 h-full"
          />
        </main>
        <DialogFooter className="flex gap-2 w-full">
          <>
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
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
