"use client";

import React, { useState, useMemo } from "react";
import { useEntityViewModel } from "@/app/viewmodel/entity.viewmodel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
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
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

// Helper function to generate slug from text
const generateSlug = (text: string) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

export function CategoriesList() {
  const {
    entities,
    isLoadingEntities,
    createEntity,
    isCreating,
    updateEntity,
    isUpdating,
    deleteEntity,
  } = useEntityViewModel();

  // Search & Sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  // Modal / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Handlers for search & sort
  const handleSort = () => {
    if (sortDirection === null) {
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortDirection(null);
    }
  };

  // Filter & Sort entities
  const filteredAndSortedEntities = useMemo(() => {
    let result = [...entities];

    // Local Search
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(lower));
    }

    // Local Sort
    if (sortDirection) {
      result.sort((a, b) => {
        const nameA = (a.name || "").toString();
        const nameB = (b.name || "").toString();
        if (sortDirection === "asc") {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }

    return result;
  }, [entities, searchTerm, sortDirection]);

  // Open modal for creating new
  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setIsSlugManual(false);
    setIsOpen(true);
  };

  // Open modal for editing existing
  const handleOpenEdit = (entity: any) => {
    setEditingId(entity.id);
    setName(entity.name);
    setSlug(entity.slug);
    setIsSlugManual(true); // Don't auto-generate when editing an existing slug unless cleared
    setIsOpen(true);
  };

  // Auto-generate slug on name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManual) {
      setSlug(generateSlug(val));
    }
  };

  // Handle manual slug edits
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlug(val);
    if (val === "" || val === generateSlug(name)) {
      setIsSlugManual(false);
    } else {
      setIsSlugManual(true);
    }
  };

  // Submit form (create or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    if (editingId) {
      updateEntity(
        { id: editingId, data: { name, slug } },
        {
          onSuccess: () => {
            setIsOpen(false);
          },
          onError: (err: any) => {
            alert(`Erro ao editar: ${err.message || "Erro desconhecido"}`);
          },
        },
      );
    } else {
      createEntity(
        { name, slug },
        {
          onSuccess: () => {
            setIsOpen(false);
          },
          onError: (err: any) => {
            alert(`Erro ao criar: ${err.message || "Erro desconhecido"}`);
          },
        },
      );
    }
  };

  // Delete handler
  const handleDelete = (id: string, entityName: string) => {
    if (
      confirm(`Tem certeza que deseja deletar a categoria "${entityName}"?`)
    ) {
      deleteEntity(id, {
        onError: (err: any) => {
          alert(`Erro ao deletar: ${err.message || "Erro desconhecido"}`);
        },
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className="gap-2">
        <CardHeader className="flex items-center justify-between">
          <div className="relative flex items-center gap-2 w-full">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Button onClick={handleOpenCreate} className="sm:w-auto">
            <Plus className="w-4 h-4 sm:mr-2" />
            <p className="sm:block hidden">Nova Categoria</p>
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 w-full">
          {/* Table Container */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">
                    <button
                      onClick={handleSort}
                      className="flex items-center hover:text-foreground transition-colors font-semibold"
                    >
                      Nome
                      {sortDirection === "asc" ? (
                        <ArrowUp className="w-4 h-4 ml-1 text-primary" />
                      ) : sortDirection === "desc" ? (
                        <ArrowDown className="w-4 h-4 ml-1 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[25%]">Apelido (Slug)</TableHead>
                  <TableHead className="w-[20%]">Data de Criação</TableHead>
                  <TableHead className="w-[10%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEntities ? (
                  // Skeleton state
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 bg-muted animate-pulse rounded w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedEntities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedEntities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">
                        {entity.name}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
                          {entity.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entity.createdAt
                          ? new Date(entity.createdAt).toLocaleDateString(
                              "pt-BR",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(entity)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(entity.id, entity.name.toString())
                          }
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Modifique os dados da categoria e salve as alterações."
                  : "Preencha os dados abaixo para cadastrar uma nova secretaria/categoria."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome da Categoria <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Secretaria de Educação"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Apelido (Slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="Ex: educacao"
                  value={slug}
                  onChange={handleSlugChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingId ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
