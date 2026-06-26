"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Render } from "@puckeditor/core";
import { config } from "@/puck.config";
import { usePagesViewModel } from "@/app/viewmodel/pages.viewmodel";

interface ViewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ViewPageModal({ isOpen, onClose }: ViewPageModalProps) {
  const { page } = usePagesViewModel();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90%] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização: {page.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto border border-border rounded-xl bg-white mt-4 relative">
          {page?.[0].content ? (
            <div className="w-full h-full min-h-[50vh]">
              <Render config={config} data={page?.[0].content} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[50vh] text-muted-foreground">
              Nenhum conteúdo para exibir.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
