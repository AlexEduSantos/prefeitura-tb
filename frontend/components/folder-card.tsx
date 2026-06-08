"use client";
import { Card } from "@/components/ui/card";
import { Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useState } from "react";

interface FolderCardProps {
  name: string;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export const FolderCard = ({
  name,
  onClick,
  onRename,
  onDelete,
}: FolderCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <Card
      className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center relative group"
      onClick={onClick}
    >
      <Folder className="text-primary fill-primary" size={24} />
      <span className="font-medium text-sm truncate capitalize max-w-full px-1">
        {name}
      </span>

      {(onRename || onDelete) && (
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()} // Prevent triggering Card onClick
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRename && (
                <DropdownMenuItem onClick={onRename}>
                  <Edit2 size={12} className="mr-2" />
                  Renomear
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)} // Apenas abre o estado
                >
                  <Trash2 size={12} className="mr-2" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Diálogo de Confirmação de Exclusão (Fora do Dropdown) */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a pasta "{name}" e todos os
                  seus arquivos?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
};
