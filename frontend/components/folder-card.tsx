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
import { TableCell, TableRow } from "./ui/table";

interface FolderCardProps {
  name: string;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  viewMode?: "grid" | "list";
}

export const FolderCard = ({
  name,
  onClick,
  onRename,
  onDelete,
  viewMode = "grid",
}: FolderCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const actionsMenu = (onRename || onDelete) && (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="size-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground cursor-pointer"
            title="Opções da pasta"
          >
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
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 size={12} className="mr-2" /> Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pasta &quot;{name}&quot; e todos
              os seus arquivos?
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
    </>
  );

  if (viewMode === "list") {
    return (
      <TableRow
        className="cursor-pointer select-none hover:bg-muted/50"
        onClick={onClick}
      >
        <TableCell className="w-10" />
        <TableCell>
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Folder className="text-primary fill-primary" size={20} />
            </div>
            <span className="font-medium text-sm truncate capitalize">
              {name}
            </span>
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
          Pasta
        </TableCell>
        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
          —
        </TableCell>
        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
          —
        </TableCell>
        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
          —
        </TableCell>
        <TableCell
          className="w-12 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end">{actionsMenu}</div>
        </TableCell>
      </TableRow>
    );
  }

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
          onClick={(e) => e.stopPropagation()}
        >
          {actionsMenu}
        </div>
      )}
    </Card>
  );
};
