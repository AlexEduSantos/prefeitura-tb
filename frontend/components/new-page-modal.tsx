"use client";

import { config } from "@/puck.config";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useEntityViewModel } from "@/app/viewmodel/entity.viewmodel";
import { useState, useEffect, useMemo } from "react";
import type { Overrides } from "@puckeditor/core";
import { CustomHeader } from "./puck/custom-header";
import { CustomDrawerItem } from "./puck/custom-drawer-item";

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  onSubmit: (content: any, entityId: string) => void;
  onChangeTitle: (title: string) => void;
  onChangeSlug: (slug: string) => void;
  title: string;
  slug: string;
  /** Dados iniciais da página (usado no modo de edição) */
  initialData?: {
    content?: any;
    entityId?: string;
    title?: string;
    slug?: string;
  };
}

export function NewPageModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  onChangeTitle,
  onChangeSlug,
  title,
  slug,
  initialData,
}: NewPageModalProps) {
  const { entities, isLoadingEntities } = useEntityViewModel();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [puckData, setPuckData] = useState<any>({});

  // Inicializa/reseta os estados internos quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setPuckData({});
        setSelectedEntityId("");
      } else {
        setPuckData(initialData?.content ?? {});
        setSelectedEntityId(initialData?.entityId ?? "");
      }
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!title) {
      alert("Por favor, preencha o Nome da página.");
      return;
    }
    if (!slug) {
      alert("Por favor, preencha o Caminho (slug) da página.");
      return;
    }
    if (!selectedEntityId) {
      alert("Por favor, selecione uma Secretaria.");
      return;
    }
    onSubmit(puckData, selectedEntityId);
  };

  const overrides: Partial<Overrides> = useMemo(
    () => ({
      puck: ({ children }) => (
        <div className="rounded-xl overflow-hidden border border-border scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/60 scrollbar-thumb-rounded-full">
          {children}
        </div>
      ),
      fields: ({ children }) => (
        <div className="max-h-[50%] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/60 scrollbar-thumb-rounded-full pr-2">
          {children}
        </div>
      ),
      fieldTypes: {
        number: ({
          onChange,
          name,
        }: {
          onChange: (v: any) => void;
          name: string;
        }) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={name} className="capitalize">
              {name}
            </Label>
            <Input
              id={name}
              type="number"
              value={mode === "edit" ? initialData?.content?.[name] : ""}
              onChange={(e) => onChange(e.currentTarget.value)}
            />
          </div>
        ),
        text: ({
          onChange,
          name,
        }: {
          onChange: (v: any) => void;
          name: string;
        }) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={name} className="capitalize">
              {name}
            </Label>
            <Input
              id={name}
              type="text"
              onChange={(e) => onChange(e.currentTarget.value)}
            />
          </div>
        ),
        select: ({
          field,
          name,
          value,
          onChange,
          readOnly,
        }: {
          field: any;
          name: string;
          value: any;
          onChange: (v: any) => void;
          readOnly?: boolean;
        }) => (
          <Select
            value={value || ""}
            onValueChange={onChange}
            disabled={readOnly}
          >
            <SelectTrigger id={name}>
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      outline: ({ children }) => (
        <div className="outline-none border-none p-0 m-0">{children}</div>
      ),
      drawer: ({ children }) => (
        <div className="overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/60 scrollbar-thumb-rounded-full pr-2">
          {children}
        </div>
      ),
      drawerItem: ({ name }) => <CustomDrawerItem name={name} />,
      header: CustomHeader,
    }),
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90%] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Página" : "Criar Nova Página"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-hidden flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="title">Nome</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Ex: Inscrições Cursos Técnicos"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Caminho (Slug)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => onChangeSlug(e.target.value)}
                placeholder="Ex: inscricoes-cursos"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="entity">Secretaria</Label>
              <Select
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
              >
                <SelectTrigger id="entity" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingEntities
                        ? "Carregando..."
                        : "Selecione uma secretaria"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {entities?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Puck
            config={config}
            data={puckData}
            plugins={[]}
            overrides={overrides}
            onChange={(newData) => setPuckData(newData)}
          />
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCreate}>
            {mode === "edit" ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
