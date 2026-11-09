"use client";

import { useState, useMemo } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  Star,
  FileText,
  CheckCircle,
  Trash,
  Search,
  ClockAlertIcon,
  CalendarClock,
  ArchiveIcon,
  PlusIcon,
  X,
  SlidersHorizontal,
  Check,
  RotateCcw,
} from "lucide-react";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import { cn } from "@/lib/utils";

export function ArticlesList() {
  const {
    isLoadingArticle,
    isErrorArticle,
    errorArticle,
    searchInput,
    setSearchInput,
    handleSearchSubmit,
    handleSearchKeyDown,
    handleClearSearch,
    clearFilters,
    onNewArticle,
    columns,
    table,
  } = ArticleViewModel();

  const { categories, isLoadingCategories } = useOrganizationViewModel();

  // Estados locais para o painel de filtros
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Obter valores ativos dos filtros
  const featuredFilter = table.getColumn("featured")?.getFilterValue() as
    | boolean
    | undefined;
  const statusFilter = table.getColumn("status")?.getFilterValue() as
    | string
    | undefined;
  const typeFilter = table.getColumn("type")?.getFilterValue() as
    | string
    | undefined;
  const categoryFilter = table.getColumn("categories")?.getFilterValue() as
    | string
    | undefined;

  // Contagem de filtros ativos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (featuredFilter === true) count++;
    if (statusFilter) count++;
    if (typeFilter) count++;
    if (categoryFilter) count++;
    return count;
  }, [featuredFilter, statusFilter, typeFilter, categoryFilter]);

  // Filtragem rápida da lista de categorias dentro do drawer
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const term = categorySearch.toLowerCase().trim();
    return categories.filter((c) => c.title.toLowerCase().includes(term));
  }, [categories, categorySearch]);

  // Opções de Status com ícones e cores semânticas
  const statusOptions = [
    { value: "", label: "Todos os status", icon: null },
    {
      value: "publicado",
      label: "Publicado",
      icon: <CheckCircle className="size-4 text-green-500" />,
    },
    {
      value: "programado",
      label: "Programado",
      icon: <CalendarClock className="size-4 text-sky-500" />,
    },
    {
      value: "rascunho",
      label: "Rascunho",
      icon: <FileText className="size-4 text-gray-500" />,
    },
    {
      value: "excluido",
      label: "Excluído",
      icon: <Trash className="size-4 text-red-500" />,
    },
    {
      value: "arquivado",
      label: "Arquivado",
      icon: <ArchiveIcon className="size-4 text-indigo-500" />,
    },
    {
      value: "expirado",
      label: "Expirado",
      icon: <ClockAlertIcon className="size-4 text-amber-600" />,
    },
  ];

  const typeOptions = [
    { value: "", label: "Todos os tipos" },
    { value: "article", label: "Matéria" },
    { value: "event", label: "Evento" },
    { value: "note", label: "Nota" },
  ];

  const statusLabelMap: Record<string, string> = {
    publicado: "Publicado",
    programado: "Programado",
    rascunho: "Rascunho",
    excluido: "Excluído",
    arquivado: "Arquivado",
    expirado: "Expirado",
  };

  const typeLabelMap: Record<string, string> = {
    article: "Matéria",
    event: "Evento",
    note: "Nota",
  };

  if (isLoadingArticle || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Carregando artigos...
      </div>
    );
  }

  if (isErrorArticle) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Erro ao carregar artigos: {errorArticle?.message}
      </div>
    );
  }

  const selectedCategoryTitle = categories.find(
    (c) => c.id === categoryFilter,
  )?.title;

  return (
    <div className="w-full space-y-4">
      {/* Toolbar Principal */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full">
          {/* Campo de Busca */}
          <div className="relative w-full flex items-center">
            <Input
              placeholder="Pesquisar por título..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pr-8"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSearchSubmit}
            title="Pesquisar"
            variant="outline"
            className="cursor-pointer shrink-0 bg-card text-card-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Botão Novo Artigo */}
          <Button
            className="whitespace-nowrap cursor-pointer shrink-0"
            onClick={onNewArticle}
            type="button"
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            Novo Artigo
          </Button>

          {/* Botão Drawer de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all bg-card ml-auto shrink-0",
                  activeFilterCount > 0 &&
                    "border-primary text-primary font-medium bg-primary/5 shadow-xs",
                )}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-1.5 px-1.5 py-0 text-[10px] h-4.5 rounded-full font-bold"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            {/* Painel Lateral do Drawer */}
            <SheetContent
              side="right"
              className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background"
            >
              <SheetHeader className="px-6 py-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal className="size-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-semibold">
                      Filtros de Artigos
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      Refine os artigos por destaque, status, tipo e categoria.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Corpo de Filtros com Scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* 1. Destaques */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <Star className="size-4 text-amber-500 fill-amber-500" />
                      Apenas Destaques
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Exibir somente artigos marcados com estrela
                    </p>
                  </div>
                  <Switch
                    checked={featuredFilter === true}
                    onCheckedChange={(val) =>
                      table
                        .getColumn("featured")
                        ?.setFilterValue(val ? true : undefined)
                    }
                  />
                </div>

                {/* 2. Status */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status da Publicação
                    </label>
                    {statusFilter && (
                      <button
                        type="button"
                        onClick={() =>
                          table.getColumn("status")?.setFilterValue(undefined)
                        }
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((opt) => {
                      const isSelected =
                        statusFilter === opt.value ||
                        (!statusFilter && !opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            table
                              .getColumn("status")
                              ?.setFilterValue(opt.value || undefined)
                          }
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                              : "border-border hover:bg-muted/50 text-foreground",
                          )}
                        >
                          {opt.icon}
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Tipo */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tipo de Conteúdo
                    </label>
                    {typeFilter && (
                      <button
                        type="button"
                        onClick={() =>
                          table.getColumn("type")?.setFilterValue(undefined)
                        }
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((opt) => {
                      const isSelected =
                        typeFilter === opt.value || (!typeFilter && !opt.value);
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            table
                              .getColumn("type")
                              ?.setFilterValue(opt.value || undefined)
                          }
                          className="rounded-full text-xs cursor-pointer h-8"
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Categorias */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Categoria ({categories.length})
                    </label>
                    {categoryFilter && (
                      <button
                        type="button"
                        onClick={() =>
                          table
                            .getColumn("categories")
                            ?.setFilterValue(undefined)
                        }
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Campo de pesquisa interna de categoria */}
                  {categories.length > 5 && (
                    <div className="relative">
                      <Input
                        placeholder="Pesquisar categoria..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="h-8 text-xs pl-7 pr-7"
                      />
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch("")}
                          className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Lista de categorias com scroll */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 rounded-lg border border-border p-1 bg-muted/20">
                    <button
                      type="button"
                      onClick={() =>
                        table.getColumn("categories")?.setFilterValue(undefined)
                      }
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition cursor-pointer text-left",
                        !categoryFilter
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <span>Todas as categorias</span>
                      {!categoryFilter && (
                        <Check className="size-3.5 shrink-0" />
                      )}
                    </button>
                    {filteredCategories.map((cat) => {
                      const isSelected = categoryFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            table
                              .getColumn("categories")
                              ?.setFilterValue(cat.id)
                          }
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition cursor-pointer text-left",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "hover:bg-muted text-foreground",
                          )}
                        >
                          <span className="truncate pr-2">{cat.title}</span>
                          {isSelected && (
                            <Check className="size-3.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        Nenhuma categoria encontrada
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé Fixo do Drawer */}
              <SheetFooter className="px-6 py-4 border-t border-border mt-auto flex flex-row items-center justify-between gap-3 bg-muted/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={activeFilterCount === 0}
                  onClick={clearFilters}
                  className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Limpar todos
                </Button>

                <SheetClose asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer text-xs"
                  >
                    Ver {table.getRowModel().rows.length} resultados
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Seleção do tamanho de página */}
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-9 w-18">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Ativos (Active Filter Pills / Chips) */}
      {(activeFilterCount > 0 || searchInput.trim().length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-muted-foreground font-medium mr-1">
            Filtros ativos:
          </span>

          {searchInput.trim().length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-1 text-xs rounded-full font-normal border border-border"
            >
              <span>Busca: "{searchInput}"</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Remover busca"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {featuredFilter === true && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-1 text-xs rounded-full font-normal border border-border"
            >
              <Star className="size-3 text-amber-500 fill-amber-500" />
              <span>Destaques</span>
              <button
                type="button"
                onClick={() =>
                  table.getColumn("featured")?.setFilterValue(undefined)
                }
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Remover filtro de destaques"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {statusFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-1 text-xs rounded-full font-normal border border-border"
            >
              <span>
                Status: {statusLabelMap[statusFilter] || statusFilter}
              </span>
              <button
                type="button"
                onClick={() =>
                  table.getColumn("status")?.setFilterValue(undefined)
                }
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Remover filtro de status"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {typeFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-1 text-xs rounded-full font-normal border border-border"
            >
              <span>Tipo: {typeLabelMap[typeFilter] || typeFilter}</span>
              <button
                type="button"
                onClick={() =>
                  table.getColumn("type")?.setFilterValue(undefined)
                }
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Remover filtro de tipo"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {categoryFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1 py-1 text-xs rounded-full font-normal border border-border"
            >
              <span>Categoria: {selectedCategoryTitle || "Selecionada"}</span>
              <button
                type="button"
                onClick={() =>
                  table.getColumn("categories")?.setFilterValue(undefined)
                }
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Remover filtro de categoria"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs text-muted-foreground hover:text-destructive cursor-pointer px-2 ml-1"
          >
            Limpar todos
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
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
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="font-medium">Nenhum artigo encontrado.</p>
                    <p className="text-xs text-muted-foreground">
                      Tente ajustar ou limpar os filtros aplicados.
                    </p>
                    {(activeFilterCount > 0 || searchInput) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-1 text-xs cursor-pointer"
                      >
                        Limpar todos os filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>Total de {table.getFilteredRowModel().rows.length} artigo(s)</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
