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
  CheckSquare2,
  FilterIcon,
  FolderPlusIcon,
  Loader2,
  PlusIcon,
  SearchIcon,
  Square,
  Trash2Icon,
  Undo2Icon,
  X,
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
import { Badge } from "./ui/badge";
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
import { useFolders } from "@/app/viewmodel/folders.viewmodel";
import {
  useMediaList,
  useMediaViewModel,
} from "@/app/viewmodel/media.viewmodel";
import { toast } from "sonner";

export interface MediaExplorerProps {
  selectedItems: any[];
  onSelectionChange: (items: any[]) => void;
  multiple?: boolean;
  gridClassName?: string;
  showSearch?: boolean;
  extraHeaderActions?: React.ReactNode;
  containerClassName?: string;
  enableBulkDelete?: boolean;
}

export function MediaExplorer({
  selectedItems,
  onSelectionChange,
  multiple = true,
  gridClassName = "grid sm:grid-cols-4 xl:grid-cols-6 grid-cols-2 gap-4",
  showSearch = false,
  extraHeaderActions,
  containerClassName = "flex flex-col gap-4",
  enableBulkDelete = false,
}: MediaExplorerProps) {
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    sort: "asc" as "asc" | "desc",
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const currentPath = pathStack.join("/");

  const { data, isLoading } = useMediaList(
    currentPath || "root",
    pagination.page,
    pagination.sort,
    pagination.perPage,
  );

  const { refetchMedia, massDeleteMedia, isMassDeleting } = useMediaViewModel();

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

  const handleToggleSelectAll = () => {
    if (!data?.files || data.files.length === 0) return;
    const allFiles = data.files;
    const allCurrentSelected = allFiles.every((f: any) =>
      selectedItems.some((item) => item.id === f.id),
    );

    if (allCurrentSelected) {
      onSelectionChange(
        selectedItems.filter(
          (item) => !allFiles.some((f: any) => f.id === item.id),
        ),
      );
    } else {
      const remaining = allFiles.filter(
        (f: any) => !selectedItems.some((item) => item.id === f.id),
      );
      onSelectionChange([...selectedItems, ...remaining]);
    }
  };

  const handleConfirmMassDelete = () => {
    const ids = selectedItems.map((item) => item.id);
    massDeleteMedia(ids, {
      onSuccess: () => {
        toast.success(
          `${ids.length} ${ids.length === 1 ? "arquivo excluído" : "arquivos excluídos"} com sucesso!`,
        );
        onSelectionChange([]);
        refetchMedia();
        setIsDeleteDialogOpen(false);
      },
      onError: () => {
        toast.error("Erro ao excluir arquivos selecionados");
      },
    });
  };

  const isAllCurrentSelected =
    Boolean(data?.files?.length) &&
    data.files.every((f: any) =>
      selectedItems.some((item) => item.id === f.id),
    );

  return (
    <div className={containerClassName}>
      <section className="flex flex-col w-full h-fit gap-2">
        {showSearch ? (
          <>
            {/* Toolbar */}
            <div className="flex gap-2 w-full flex-wrap items-center">
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

              {multiple && enableBulkDelete && (data?.files?.length ?? 0) > 0 && (
                <Button
                  variant="outline"
                  onClick={handleToggleSelectAll}
                  className="gap-1.5"
                >
                  {isAllCurrentSelected ? (
                    <>
                      <Square className="h-4 w-4" />
                      Desmarcar Todos
                    </>
                  ) : (
                    <>
                      <CheckSquare2 className="h-4 w-4" />
                      Selecionar Todos
                    </>
                  )}
                </Button>
              )}

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
          <div className="flex flex-wrap gap-2 w-full">
            <div className="flex gap-2 w-full flex-wrap">
              <Button
                className="min-w-[45%] flex-1"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <PlusIcon />
                Enviar Arquivo
              </Button>
              <Button
                variant="outline"
                className="min-w-[45%] flex-1"
                onClick={() => setIsFolderModalOpen(true)}
              >
                <FolderPlusIcon /> Nova Pasta
              </Button>
              {multiple && enableBulkDelete && (data?.files?.length ?? 0) > 0 && (
                <Button
                  variant="outline"
                  onClick={handleToggleSelectAll}
                  className="gap-1.5"
                >
                  {isAllCurrentSelected ? (
                    <>
                      <Square className="h-4 w-4" />
                      Desmarcar Todos
                    </>
                  ) : (
                    <>
                      <CheckSquare2 className="h-4 w-4" />
                      Selecionar Todos
                    </>
                  )}
                </Button>
              )}
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

      {/* Barra Flutuante de Ações em Massa */}
      {enableBulkDelete && selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-md border shadow-2xl px-5 py-3 rounded-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="px-2.5 py-0.5 text-xs font-semibold"
            >
              {selectedItems.length}
            </Badge>
            <span className="text-sm font-medium">
              {selectedItems.length === 1
                ? "arquivo selecionado"
                : "arquivos selecionados"}
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => onSelectionChange([])}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Desmarcar
          </Button>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1.5 shadow-sm"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                Excluir Selecionados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir arquivos selecionados?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a excluir permanentemente{" "}
                  <strong>
                    {selectedItems.length}{" "}
                    {selectedItems.length === 1 ? "arquivo" : "arquivos"}
                  </strong>
                  . Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isMassDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirmMassDelete();
                  }}
                  disabled={isMassDeleting}
                >
                  {isMassDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Confirmar Exclusão"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={() => refetchMedia()}
        folderId={data?.currentFolderId}
      />
    </div>
  );
}
