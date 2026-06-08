"use client";
import { useFolders } from "@/app/viewmodel/folders.viewmodel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestPage() {
  const {
    isFolderModalOpen,
    setIsFolderModalOpen,
    newFolderName,
    setNewFolderName,
    submitCreateFolder,
  } = useFolders();

  return (
    <div className="w-full h-screen flex items-center justify-center gap-2">
      <Button onClick={() => setIsFolderModalOpen(true)}>Criar Pasta</Button>
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da pasta</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Documentos 2026"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFolderModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Criar Pasta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
