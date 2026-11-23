"use client";

import { useState, useEffect, type MouseEvent } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterIcon,
  FolderPlusIcon,
  LayoutGrid,
  List,
  Loader2,
  PlusIcon,
  SearchIcon,
  Square,
  Trash2Icon,
  Undo2Icon,
  X,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
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
import { IMedia } from "@/app/type/media";

interface MediaFolderItem {
  id: string;
  name: string;
}

export interface MediaExplorerProps {
  selectedItems: IMedia[];
  onSelectionChange: (items: IMedia[]) => void;
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
  gridClassName = "grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 grid-cols-2 gap-4",
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
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    setPagination((prev) => ({ ...prev, page: 1 }));
    setLastSelectedId(null);
    onSelectionChange([]);
  };

  const navigateUp = () => {
    setPathStack(pathStack.slice(0, -1));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setLastSelectedId(null);
    onSelectionChange([]);
  };

  const navigateToRoot = () => {
    setPathStack([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setLastSelectedId(null);
    onSelectionChange([]);
  };

  const navigateToCrumb = (index: number) => {
    setPathStack(pathStack.slice(0, index + 1));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setLastSelectedId(null);
    onSelectionChange([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        selectedItems.length > 0 &&
        !isUploadModalOpen &&
        !isFolderModalOpen &&
        !isDeleteDialogOpen
      ) {
        onSelectionChange([]);
        setLastSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedItems.length,
    isUploadModalOpen,
    isFolderModalOpen,
    isDeleteDialogOpen,
    onSelectionChange,
  ]);

  const totalFiles = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 0;
  const currentPage =
    totalPages > 0 ? Math.min(pagination.page, totalPages) : pagination.page;

  const goToPage = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, Math.max(1, totalPages)));
    if (clamped === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: clamped }));
    setLastSelectedId(null);
  };

  const getVisiblePages = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push("ellipsis");
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const handleFileSelect = (
    file: IMedia,
    index: number,
    event: MouseEvent<HTMLElement>,
  ) => {
    const files: IMedia[] = data?.files ?? [];

    if (!multiple) {
      onSelectionChange([file]);
      setLastSelectedId(file.id);
      return;
    }

    if (event.shiftKey && lastSelectedId) {
      const anchorIndex = files.findIndex((f) => f.id === lastSelectedId);
      if (anchorIndex !== -1) {
        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);
        const rangeItems = files.slice(start, end + 1);

        if (event.ctrlKey || event.metaKey) {
          const existingIds = new Set(selectedItems.map((item) => item.id));
          const merged = [
            ...selectedItems,
            ...rangeItems.filter((item) => !existingIds.has(item.id)),
          ];
          onSelectionChange(merged);
        } else {
          onSelectionChange(rangeItems);
        }
        return;
      }
    }

    if (event.ctrlKey || event.metaKey) {
      const alreadySelected = selectedItems.some((item) => item.id === file.id);
      if (alreadySelected) {
        onSelectionChange(
          selectedItems.filter((item) => item.id !== file.id),
        );
      } else {
        onSelectionChange([...selectedItems, file]);
      }
      setLastSelectedId(file.id);
      return;
    }

    onSelectionChange([file]);
    setLastSelectedId(file.id);
  };

  const handleFileCheckboxChange = (file: IMedia, checked: boolean) => {
    if (checked) {
      if (multiple) {
        const alreadySelected = selectedItems.some(
          (item) => item.id === file.id,
        );
        onSelectionChange(
          alreadySelected ? selectedItems : [...selectedItems, file],
        );
      } else {
        onSelectionChange([file]);
      }
      setLastSelectedId(file.id);
    } else {
      onSelectionChange(selectedItems.filter((item) => item.id !== file.id));
    }
  };

  const handleToggleSelectAll = () => {
    if (!data?.files || data.files.length === 0) return;
    const allFiles: IMedia[] = data.files;
    const allCurrentSelected = allFiles.every((f) =>
      selectedItems.some((item) => item.id === f.id),
    );

    if (allCurrentSelected) {
      onSelectionChange(
        selectedItems.filter(
          (item) => !allFiles.some((f) => f.id === item.id),
        ),
      );
    } else {
      const remaining = allFiles.filter(
        (f) => !selectedItems.some((item) => item.id === f.id),
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
    (data.files as IMedia[]).every((f) =>
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

              {multiple &&
                enableBulkDelete &&
                (data?.files?.length ?? 0) > 0 && (
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
                onValueChange={(value) => {
                  setPagination((prev) => ({
                    ...prev,
                    page: 1,
                    sort: value as "asc" | "desc",
                  }));
                  setLastSelectedId(null);
                }}
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
                onValueChange={(value) => {
                  setPagination((prev) => ({
                    ...prev,
                    page: 1,
                    perPage: parseInt(value),
                  }));
                  setLastSelectedId(null);
                }}
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
              <div className="flex items-center rounded-md border bg-card p-0.5 shrink-0">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                  title="Visualização em grade"
                  className="cursor-pointer"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                  title="Visualização em lista detalhada"
                  className="cursor-pointer"
                >
                  <List className="size-4" />
                </Button>
              </div>
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
              {multiple &&
                enableBulkDelete &&
                (data?.files?.length ?? 0) > 0 && (
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
                onValueChange={(value) => {
                  setPagination((prev) => ({
                    ...prev,
                    page: 1,
                    sort: value as "asc" | "desc",
                  }));
                  setLastSelectedId(null);
                }}
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
                onValueChange={(value) => {
                  setPagination((prev) => ({
                    ...prev,
                    page: 1,
                    perPage: parseInt(value),
                  }));
                  setLastSelectedId(null);
                }}
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
              <div className="flex items-center rounded-md border bg-card p-0.5 shrink-0">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                  title="Visualização em grade"
                  className="cursor-pointer"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                  title="Visualização em lista detalhada"
                  className="cursor-pointer"
                >
                  <List className="size-4" />
                </Button>
              </div>
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

      {viewMode === "grid" ? (
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
          {(data?.folders as MediaFolderItem[] | undefined)?.map((folder) => (
            <FolderCard
              key={folder.id}
              name={folder.name}
              viewMode="grid"
              onClick={() => navigateToFolder(folder.name)}
              onRename={() => handleRenameFolder(folder.id, folder.name)}
              onDelete={() => handleDeleteFolder(folder.id)}
            />
          ))}
          {(data?.files as IMedia[] | undefined)?.map((file, index) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode="grid"
              onSelect={(event) => handleFileSelect(file, index, event)}
              onCheckedChange={(checked) =>
                handleFileCheckboxChange(file, checked)
              }
              isSelected={selectedItems.some((item) => item.id === file.id)}
            />
          ))}
          {!isLoading &&
            !(data?.folders?.length ?? 0) &&
            !(data?.files?.length ?? 0) && (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                Nenhum arquivo ou pasta encontrado.
              </div>
            )}
        </section>
      ) : (
        <section className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {multiple && (data?.files?.length ?? 0) > 0 && (
                    <Checkbox
                      className="size-4"
                      checked={isAllCurrentSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Selecionar todos os arquivos da página"
                    />
                  )}
                </TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">
                  Dimensões
                </TableHead>
                <TableHead className="hidden sm:table-cell">Tamanho</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Criado em
                </TableHead>
                <TableHead className="w-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pathStack.length > 0 && (
                <TableRow
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={navigateUp}
                >
                  <TableCell className="w-10" />
                  <TableCell colSpan={6}>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Undo2Icon className="text-primary size-4" />
                      </div>
                      <span className="text-sm font-medium">Voltar</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {(data?.folders as MediaFolderItem[] | undefined)?.map(
                (folder) => (
                  <FolderCard
                    key={folder.id}
                    name={folder.name}
                    viewMode="list"
                    onClick={() => navigateToFolder(folder.name)}
                    onRename={() => handleRenameFolder(folder.id, folder.name)}
                    onDelete={() => handleDeleteFolder(folder.id)}
                  />
                ),
              )}
              {(data?.files as IMedia[] | undefined)?.map((file, index) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode="list"
                  onSelect={(event) => handleFileSelect(file, index, event)}
                  onCheckedChange={(checked) =>
                    handleFileCheckboxChange(file, checked)
                  }
                  isSelected={selectedItems.some((item) => item.id === file.id)}
                />
              ))}
              {!isLoading &&
                !(data?.folders?.length ?? 0) &&
                !(data?.files?.length ?? 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Nenhum arquivo ou pasta encontrado.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Paginação */}
      {totalFiles > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pagination.perPage + 1}
            </span>
            –
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pagination.perPage, totalFiles)}
            </span>{" "}
            de <span className="font-medium text-foreground">{totalFiles}</span>{" "}
            {totalFiles === 1 ? "arquivo" : "arquivos"}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => goToPage(1)}
                title="Primeira página"
                className="cursor-pointer"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => goToPage(currentPage - 1)}
                title="Página anterior"
                className="cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </Button>

              {getVisiblePages().map((entry, idx) =>
                entry === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-xs text-muted-foreground select-none"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={entry}
                    type="button"
                    variant={entry === currentPage ? "default" : "outline"}
                    size="sm"
                    disabled={isLoading}
                    onClick={() => goToPage(entry)}
                    className="h-8 min-w-8 px-2 cursor-pointer"
                  >
                    {entry}
                  </Button>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => goToPage(currentPage + 1)}
                title="Próxima página"
                className="cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => goToPage(totalPages)}
                title="Última página"
                className="cursor-pointer"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

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
                <AlertDialogTitle>
                  Excluir arquivos selecionados?
                </AlertDialogTitle>
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
