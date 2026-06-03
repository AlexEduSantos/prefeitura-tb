import { Card } from "@/components/ui/card";
import { Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

interface FolderCardProps {
  name: string;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export const FolderCard = ({ name, onClick, onRename, onDelete }: FolderCardProps) => {
  return (
    <Card
      className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center relative group"
      onClick={onClick}
    >
      <Folder className="text-primary fill-primary" size={24} />
      <span className="font-medium text-sm truncate capitalize max-w-full px-1">{name}</span>

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
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 size={12} className="mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  );
};
