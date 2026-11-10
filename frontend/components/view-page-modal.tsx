"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Render } from "@puckeditor/core";
import { config } from "@/puck.config";
import { Skeleton } from "./ui/skeleton";
import { IPage } from "@/app/type/pages";

interface ViewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  page?: IPage;
  isLoading?: boolean;
}

export function ViewPageModal({
  isOpen,
  onClose,
  page,
  isLoading,
}: ViewPageModalProps) {
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-[90%] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <Skeleton className="h-5 w-50" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border border-border rounded-xl bg-white mt-4 relative">
            <div className="flex items-center justify-center h-full min-h-[50vh] text-muted-foreground">
              <Skeleton className="h-5 w-50" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90%] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização: {page?.title ?? "..."}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto border border-border rounded-xl bg-white mt-4 relative">
          {page?.content ? (
            <div className="w-full h-full min-h-[50vh]">
              <Render config={config} data={page.content} />
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
