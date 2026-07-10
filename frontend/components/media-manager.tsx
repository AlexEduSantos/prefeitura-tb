"use client";
import {
  useMediaList,
  useMediaViewModel,
} from "@/app/viewmodel/media.viewmodel";
import { useState } from "react";
import { toast } from "sonner";
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
  DownloadIcon,
  FilterIcon,
  FolderPlusIcon,
  FolderSymlink,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Undo2Icon,
  Upload,
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
import { useNewArticleViewModel } from "@/app/viewmodel/new-article.viewmodel";
import { MediaUploadModal } from "./media-upload-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { useFolders } from "@/app/viewmodel/folders.viewmodel";

export const FileExplorer = () => {
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
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
  } = useFolders();

  return (
    <main className="flex flex-col gap-4">
      {/* Botões, filtros e search */}
      <section className="flex flex-col w-full h-fit gap-2">
        <div className="flex gap-2 w-full">
          <Button className="" onClick={() => setIsUploadModalOpen(true)}>
            <PlusIcon />
            Enviar Arquivo
          </Button>
          <Button
            variant="outline"
            className=""
            onClick={() => setIsFolderModalOpen(true)}
          >
            <FolderPlusIcon /> Nova Pasta
          </Button>
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
          {selected.length > 0 && (
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
          )}
        </div>
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
              setPagination({ ...pagination, sort: value as "asc" | "desc" })
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
      </section>
      {/* Barra de Navegação (Breadcrumbs) */}
      <Breadcrumb>
        <BreadcrumbList className="pl-2">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => setPathStack([])}>
              Mídias
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathStack.map((folder, index) => (
            <div key={folder} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="capitalize"
                  onClick={() => setPathStack(pathStack.slice(0, index + 1))}
                >
                  {folder}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid sm:grid-cols-4 xl:grid-cols-6 grid-cols-2 gap-4">
        {pathStack.length > 0 && (
          <Card
            className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center"
            onClick={() => {
              setPathStack(pathStack.slice(0, -1));
              setSelected([]);
            }}
          >
            <Undo2Icon className="text-primary" />
            <p className="text-sm font-medium">Voltar</p>
          </Card>
        )}
        {data?.folders.map((folder: any) => (
          <FolderCard
            key={folder.id}
            name={folder.name}
            onClick={() => setPathStack([...pathStack, folder.name])}
            onRename={() => handleRenameFolder(folder.id, folder.name)}
            onDelete={() => handleDeleteFolder(folder.id, folder.name)}
          />
        ))}
        {data?.files.map((file: any) => (
          <FileItem
            key={file.id}
            file={file}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelected([...selected, file.id]);
              } else {
                setSelected(selected.filter((id) => id !== file.id));
              }
            }}
            isSelected={selected.includes(file.id)}
          />
        ))}
      </section>
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={() => refetchMedia()}
        folderId={data?.currentFolderId}
      />
    </main>
  );
};
