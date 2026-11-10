"use client";

import { flexRender } from "@tanstack/react-table";
import { useOfficialGazetteViewModel } from "@/app/viewmodel/official-gazette.viewmodel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import {
  PlusIcon,
  Search,
  Loader2,
  FileTextIcon,
  CalendarIcon,
  UploadCloudIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperclipIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { MediaPickerModal } from "./media-picker-modal";
import { IMedia } from "@/app/type/media";
import { useState } from "react";

export default function OfficialGazetteManager() {
  const {
    gazettes,
    total,
    page,
    totalPages,
    limit,
    isLoading,
    isFetching,
    search,
    setSearch,
    selectedYear,
    setSelectedYear,
    setPage,
    setLimit,

    table,

    // Modal
    openModal,
    mode,
    formData,
    setFormData,
    openCreateModal,
    closeModal,
    handleSave,
    isSaving,

    // Delete
    deleteModalOpen,
    gazetteToDelete,
    cancelDelete,
    handleDelete,
    isDeleting,
  } = useOfficialGazetteViewModel();

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Lista de anos para o filtro (do ano atual até 2020)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => currentYear - i,
  );

  const handleMediaSelect = (media: IMedia | IMedia[]) => {
    const selected = Array.isArray(media) ? media[0] : media;
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        fileUrl: selected.key,
        fileSize: selected.file_size || undefined,
        title: prev.title?.trim() ? prev.title : selected.title,
      }));
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar de Controle e Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full flex-1">
          {/* Campo de Busca */}
          <div className="relative w-full">
            <Input
              placeholder="Pesquisar por título, ementa ou número de edição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 h-10"
            />
            <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Filtro por Ano */}
          <Select
            value={selectedYear ? String(selectedYear) : "all"}
            onValueChange={(val) =>
              setSelectedYear(val === "all" ? undefined : Number(val))
            }
          >
            <SelectTrigger className="h-10 cursor-pointer">
              <SelectValue placeholder="Todos os Anos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quantidade por Página */}
          <Select
            value={String(limit)}
            onValueChange={(val) => {
              setLimit(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 cursor-pointer">
              <SelectValue placeholder="Por pág." />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão Cadastrar */}
          <Button
            variant="default"
            className="cursor-pointer"
            onClick={openCreateModal}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Edição
          </Button>
        </div>
      </div>

      {/* Tabela de Boletins */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="p-3 text-xs font-semibold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Carregando boletins oficiais...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileTextIcon className="h-8 w-8 opacity-40" />
                    <span>Nenhuma edição do boletim oficial encontrada.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Rodapé com Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> (
              {total} {total === 1 ? "edição" : "edições"})
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || isLoading}
                className="h-8 px-2.5 gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="h-8 px-2.5 gap-1"
              >
                Próximo
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={openModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Cadastrar Boletim Oficial"
                : "Editar Boletim Oficial"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Preencha as informações da nova edição e informe o arquivo PDF correspondente."
                : "Altere as informações da edição selecionada."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
            {/* Título e Edição */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="gazette-title">
                  Título da Edição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gazette-title"
                  placeholder="Ex: Boletim Oficial nº 1542/2026"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gazette-edition">Número da Edição</Label>
                <Input
                  id="gazette-edition"
                  placeholder="Ex: 1542"
                  value={formData.edition || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, edition: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Data de Publicação */}
            <div className="space-y-1.5">
              <Label htmlFor="gazette-date">
                Data de Publicação Oficial{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="gazette-date"
                  type="date"
                  value={formData.publicationDate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publicationDate: e.target.value,
                    })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Ementa / Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="gazette-description">
                Resumo / Ementa dos Atos
              </Label>
              <Textarea
                id="gazette-description"
                placeholder="Ex: Decretos nº 120 a 125, Portarias da Secretaria de Educação e Edital de Pregão Presencial nº 12/2026."
                rows={3}
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isSaving}
              />
            </div>

            {/* Arquivo PDF */}
            <div className="space-y-1.5">
              <Label htmlFor="gazette-file">
                Arquivo do Documento (PDF){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="gazette-file"
                  placeholder="URL ou chave do PDF no MinIO (ex: gazettes/edicao-1542.pdf)"
                  value={formData.fileUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fileUrl: e.target.value })
                  }
                  disabled={isSaving}
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  disabled={isSaving}
                  className="shrink-0 gap-1.5"
                  title="Selecionar arquivo a partir do Gerenciador de Mídia"
                >
                  <PaperclipIcon className="h-4 w-4" />
                  Mídias
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Você pode colar a URL direta do PDF ou selecionar um arquivo já
                enviado no Gerenciador de Mídias.
              </p>
            </div>

            {/* Metadados adicionais (Páginas e Tamanho) */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t">
              <div className="space-y-1.5">
                <Label
                  htmlFor="gazette-pages"
                  className="text-xs text-muted-foreground"
                >
                  Número de Páginas (opcional)
                </Label>
                <Input
                  id="gazette-pages"
                  type="number"
                  placeholder="Ex: 48"
                  value={formData.pageCount ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pageCount: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  disabled={isSaving}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="gazette-size"
                  className="text-xs text-muted-foreground"
                >
                  Tamanho em Bytes (opcional)
                </Label>
                <Input
                  id="gazette-size"
                  type="number"
                  placeholder="Ex: 2450000"
                  value={formData.fileSize ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fileSize: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  disabled={isSaving}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t">
            <Button variant="outline" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Publicar Edição" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog
        open={deleteModalOpen}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Boletim Oficial?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir permanentemente a edição{" "}
              <strong>"{gazetteToDelete?.title}"</strong>. Esta operação não
              poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seletor de Arquivos no Gerenciador de Mídia */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={false}
      />
    </div>
  );
}
