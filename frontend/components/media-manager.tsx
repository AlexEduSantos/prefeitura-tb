"use client";
import { useState } from "react";
import { DownloadIcon, FolderSymlink, Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { MediaExplorer } from "./media-explorer";
import { useMediaViewModel } from "@/app/viewmodel/media.viewmodel";

export const FileExplorer = () => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const { massDeleteMedia } = useMediaViewModel();

  const handleDelete = () => {
    const ids = selectedItems.map((item) => item.id);
    massDeleteMedia(ids);
    setSelectedItems([]);
  };

  return (
    <main className="flex flex-col gap-4">
      <MediaExplorer
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        multiple={true}
        gridClassName="grid sm:grid-cols-4 xl:grid-cols-6 grid-cols-2 gap-4"
        showSearch={true}
        containerClassName="flex flex-col gap-4"
        extraHeaderActions={
          selectedItems.length > 0 && (
            <>
              <Button
                variant="destructive"
                className="border border-destructive/40"
                onClick={handleDelete}
              >
                <Trash2Icon />
                Excluir
              </Button>
              {/* TODO: Implementar Mover */}
              {/* {selectedItems.length === 1 && (
                <Button variant="outline">
                  <FolderSymlink />
                  Mover
                </Button>
              )} */}
            </>
          )
        }
      />
    </main>
  );
};
