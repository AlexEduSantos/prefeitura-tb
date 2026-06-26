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
import { useState, useEffect } from "react";
import { CustomHeader } from "./puck/custom-header";
import { CustomDrawerItem } from "./puck/custom-drawer-item";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: any, entityId: string) => void;
  onChangeTitle: (title: string) => void;
  onChangeSlug: (slug: string) => void;
  title: string;
  slug: string;
}

export function NewPageModal({
  isOpen,
  onClose,
  onSubmit,
  onChangeTitle,
  onChangeSlug,
  title,
  slug,
}: NewPageModalProps) {
  const { entities, isLoadingEntities } = useEntityViewModel();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [puckData, setPuckData] = useState<any>({});

  // Reset internal states when modal opens
  useEffect(() => {
    if (isOpen) {
      setPuckData({});
      setSelectedEntityId("");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90%] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Criar Nova Página</DialogTitle>
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
            overrides={{
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
                number: ({ onChange, name }) => (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={name} className="capitalize">
                      {name}
                    </Label>
                    <Input
                      id={name}
                      type="number"
                      onChange={(e) => onChange(e.currentTarget.value)}
                    />
                  </div>
                ),
                text: ({ onChange, name }) => (
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
                select: ({ field, name, value, onChange, readOnly }) => (
                  <Select
                    value={value || ""}
                    onValueChange={onChange}
                    disabled={readOnly}
                  >
                    <SelectTrigger id={name}>
                      <SelectValue placeholder={field.label}></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              },
              outline: ({ children }) => (
                <div className="outline-none border-none p-0 m-0">
                  {children}
                </div>
              ),
              drawer: ({ children }) => (
                <div className="overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/60 scrollbar-thumb-rounded-full pr-2">
                  {children}
                </div>
              ),
              drawerItem: ({ name }) => <CustomDrawerItem name={name} />,
              header: CustomHeader,
            }}
            onChange={(newData) => setPuckData(newData)}
          />
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCreate}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
