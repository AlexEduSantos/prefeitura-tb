"use client";
import { useState } from "react";
import {
  DownloadIcon,
  FolderSymlink,
  Trash2Icon,
} from "lucide-react";
import { Button } from "./ui/button";
import { MediaExplorer } from "./media-explorer";

export const FileExplorer = () => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

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
              >
                <Trash2Icon />
                Excluir
              </Button>
              <Button variant="outline">
                <DownloadIcon />
                Baixar
              </Button>
              <Button variant="outline">
                <FolderSymlink />
                Mover
              </Button>
            </>
          )
        }
      />
    </main>
  );
};
