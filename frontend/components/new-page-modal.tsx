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
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import { useState, useEffect, useMemo } from "react";
import type { Overrides } from "@puckeditor/core";
import { CustomHeader } from "./puck/custom-header";
import { CustomDrawerItem } from "./puck/custom-drawer-item";
import { generateSlug } from "@/lib/slug-utils";

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  onSubmit: (data: {
    title: string;
    slug: string;
    content: any;
    organizationId: string;
    spaceId?: string | null;
  }) => void;
  initialData?: {
    content?: any;
    organizationId?: string;
    spaceId?: string;
    title?: string;
    slug?: string;
  };
}

export function NewPageModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  initialData,
}: NewPageModalProps) {
  const { organizations, isLoadingOrganizations, spaces, isLoadingSpaces } =
    useOrganizationViewModel();

  // Estados centralizados no modal
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [puckData, setPuckData] = useState<any>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Preenche os dados apenas quando o modal for aberto
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setTitle("");
        setSlug("");
        setIsSlugManuallyEdited(false);
        setPuckData({});
        setSelectedOrgId("");
        setSelectedSpaceId("");
      } else {
        setTitle(initialData?.title ?? "");
        setSlug(initialData?.slug ?? "");
        setIsSlugManuallyEdited(true);
        setPuckData(initialData?.content ?? {});
        setSelectedOrgId(initialData?.organizationId ?? "");
        setSelectedSpaceId(initialData?.spaceId ?? "");
      }
    }
  }, [isOpen, mode, initialData]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (rawSlug: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(generateSlug(rawSlug));
  };

  const handleCreate = () => {
    if (!title) {
      alert("Por favor, preencha o Nome da página.");
      return;
    }
    const finalSlug = slug.trim() || generateSlug(title);
    if (!finalSlug) {
      alert("Por favor, defina um Caminho (slug) válido para a página.");
      return;
    }
    if (!selectedOrgId) {
      alert("Por favor, selecione uma Secretaria / Órgão.");
      return;
    }
    onSubmit({
      title,
      slug: finalSlug,
      content: puckData,
      organizationId: selectedOrgId,
      spaceId: selectedSpaceId || null,
    });
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
        number: ({ onChange, name, value }: any) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={name} className="capitalize">
              {name}
            </Label>
            <Input
              id={name}
              type="number"
              value={value ?? ""}
              onChange={(e) => onChange(Number(e.currentTarget.value))}
            />
          </div>
        ),
        text: ({ onChange, name, value }: any) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={name} className="capitalize">
              {name}
            </Label>
            <Input
              id={name}
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.currentTarget.value)}
            />
          </div>
        ),
        select: ({ field, name, value, onChange, readOnly }: any) => (
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

  if (!isMounted) return null;

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
            {/* Campo agora gerencia o próprio estado (não recarrega o Puck à toa) */}
            <div className="space-y-1">
              <Label htmlFor="title">Nome</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Inscrições Cursos Técnicos"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="slug">Caminho (slug)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="Ex: inscricoes-cursos-tecnicos"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="org">Secretaria / Órgão Responsável</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="org" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingOrganizations
                        ? "Carregando..."
                        : "Selecione uma secretaria/órgão"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="space">Espaço de URL (Prefixo de rota)</Label>
              <Select
                value={selectedSpaceId || "root"}
                onValueChange={(val) =>
                  setSelectedSpaceId(val === "root" ? "" : val)
                }
              >
                <SelectTrigger id="space" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingSpaces ? "Carregando..." : "Raiz (/) do portal"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Raiz (/) - Sem prefixo</SelectItem>
                  {spaces?.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      /{sp.slug}/ ({sp.title})
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
