"use client";

import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { FolderCard } from "./folder-card";
import { FileItem } from "./file-item";
import { Card } from "./ui/card";
import {
  FilterIcon,
  FolderPlusIcon,
  PlusIcon,
  SearchIcon,
  Undo2Icon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MediaUploadModal } from "./media-upload-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { useFolders } from "@/app/viewmodel/folders.viewmodel";
import {
  useMediaList,
  useMediaViewModel,
} from "@/app/viewmodel/media.viewmodel";

export interface MediaExplorerProps {
  selectedItems: any[];
  onSelectionChange: (items: any[]) => void;
  multiple?: boolean;
  gridClassName?: string;
  showSearch?: boolean;
  extraHeaderActions?: React.ReactNode;
  containerClassName?: string;
}

export function MediaExplorer({
  selectedItems,
  onSelectionChange,
  multiple = true,
  gridClassName = "grid sm:grid-cols-4 xl:grid-cols-6 grid-cols-2 gap-4",
  showSearch = false,
  extraHeaderActions,
  containerClassName = "flex flex-col gap-4",
}: MediaExplorerProps) {
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    sort: "asc" as "asc" | "desc",
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const currentPath = pathStack.join("/");

  const { data, isLoading } = useMediaList(
    currentPath || "root",
    pagination.page,
    pagination.sort,
    pagination.perPage,
  );

  const { refetchMedia } = useMediaViewModel();

  const {
    isFolderModalOpen,
    setIsFolderModalOpen,
    newFolderName,
    setNewFolderName,
    submitCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    modalType,
    setModalType,
  } = useFolders();

  const navigateToFolder = (folderName: string) => {
    setPathStack([...pathStack, folderName]);
    onSelectionChange([]);
  };

  const navigateUp = () => {
    setPathStack(pathStack.slice(0, -1));
    onSelectionChange([]);
  };

  const navigateToRoot = () => {
    setPathStack([]);
    onSelectionChange([]);
  };

  const navigateToCrumb = (index: number) => {
    setPathStack(pathStack.slice(0, index + 1));
    onSelectionChange([]);
  };

  return (
    <div className={containerClassName}>
      <section className="flex flex-col w-full h-fit gap-2">
        {showSearch ? (
          <>
            {/* Toolbar */}
            <div className="flex gap-2 w-full flex-wrap">
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <PlusIcon />
                Enviar Arquivo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNewFolderName("");
                  setModalType("create");
                  setIsFolderModalOpen(true);
                }}
              >
                <FolderPlusIcon /> Nova Pasta
              </Button>
              {extraHeaderActions}
            </div>

            {/* Search and Filters */}
            <div className="flex gap-2 w-full">
              <span className="relative w-full">
                <Input placeholder="Pesquisar" className="pr-8" />
                <SearchIcon
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </span>
              <Button variant="outline" className="bg-card font-normal">
                <FilterIcon />
                Filtros
              </Button>
              <Select
                value={pagination.sort}
                onValueChange={(value) =>
                  setPagination({
                    ...pagination,
                    sort: value as "asc" | "desc",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={pagination.perPage.toString()}
                onValueChange={(value) =>
                  setPagination({
                    ...pagination,
                    perPage: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className=" flex flex-wrap gap-2 w-full">
            <div className="flex gap-2 w-full">
              <Button
                className="min-w-[50%] flex-1"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <PlusIcon />
                Enviar Arquivo
              </Button>
              <Button
                variant="outline"
                className="min-w-[50%] flex-1"
                onClick={() => setIsFolderModalOpen(true)}
              >
                <FolderPlusIcon /> Nova Pasta
              </Button>
            </div>
            <div className="w-full flex gap-2">
              <Button variant="outline" className="bg-card font-normal flex-1">
                <FilterIcon />
                Filtros
              </Button>
              <Select
                value={pagination.sort}
                onValueChange={(value) =>
                  setPagination({
                    ...pagination,
                    sort: value as "asc" | "desc",
                  })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={pagination.perPage.toString()}
                onValueChange={(value) =>
                  setPagination({
                    ...pagination,
                    perPage: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalType === "create" ? "Nova Pasta" : "Renomear Pasta"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">
                  {modalType === "create"
                    ? "Nome da pasta"
                    : "Novo nome da pasta "}
                </Label>
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
                onClick={() => submitCreateFolder(data?.currentFolderId)}
                disabled={!newFolderName.trim()}
              >
                {modalType === "create" ? "Criar" : "Atualizar"} Pasta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      <Breadcrumb>
        <BreadcrumbList className="pl-2">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={navigateToRoot} className="cursor-pointer">
              Mídias
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathStack.map((folder, index) => (
            <div key={folder} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="capitalize cursor-pointer"
                  onClick={() => navigateToCrumb(index)}
                >
                  {folder}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <section className={gridClassName}>
        {pathStack.length > 0 && (
          <Card
            className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center"
            onClick={navigateUp}
          >
            <Undo2Icon className="text-primary" />
            <p className="text-sm font-medium">Voltar</p>
          </Card>
        )}
        {data?.folders?.map((folder: any) => (
          <FolderCard
            key={folder.id}
            name={folder.name}
            onClick={() => navigateToFolder(folder.name)}
            onRename={() => handleRenameFolder(folder.id, folder.name)}
            onDelete={() => handleDeleteFolder(folder.id, folder.name)}
          />
        ))}
        {data?.files?.map((file: any) => (
          <FileItem
            key={file.id}
            file={file}
            onCheckedChange={(checked) => {
              if (checked) {
                if (multiple) {
                  onSelectionChange([...selectedItems, file]);
                } else {
                  onSelectionChange([file]);
                }
              } else {
                onSelectionChange(
                  selectedItems.filter((item) => item.id !== file.id),
                );
              }
            }}
            isSelected={selectedItems.some((item) => item.id === file.id)}
          />
        ))}
      </section>

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={() => refetchMedia()}
        folderId={data?.currentFolderId}
      />
    </div>
  );
}
