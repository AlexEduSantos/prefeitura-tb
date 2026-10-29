"use client";

import { IUser } from "@/app/type/user";
import { IOrganization } from "@/app/type/organization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { useState, useEffect } from "react";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IUser & { password?: string }) => void;
  modalMode: "create" | "update";
  initialData: IUser;
}

export function UsersModal({
  open,
  onClose,
  onSubmit,
  modalMode,
  initialData,
}: UserModalProps) {
  const { organizations } = useOrganizationViewModel();

  const [formData, setFormData] = useState<
    Partial<IUser> & { password?: string }
  >({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "journalist", // Role padrão
    organizationId: "",
    active: true,
    password: "",
  });

  // Sincroniza os dados quando o modal abre
  useEffect(() => {
    if (open) {
      setFormData({
        ...initialData,
        password: "", // Limpa a senha por segurança ao abrir
      });
    }
  }, [open, initialData]);

  // Gera o username a partir do e-mail (ex: joao.silva@email.com -> joao.silva)
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData((prev) => ({
      ...prev,
      email,
      // Só gera o username automaticamente se for criação e ele estiver vazio
      ...(modalMode === "create" && { username: email.split("@")[0] }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Payload base
    const payload: any = {
      id: initialData.id || "",
      name: formData.name,
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      organizationId:
        formData.organizationId === "none" ? null : formData.organizationId,
      active: formData.active,
    };

    // Só envia a senha se ela foi preenchida (obrigatório no create)
    if (formData.password) {
      payload.password = formData.password;
    }

    onSubmit(payload);
  };

  const isPasswordRequired = modalMode === "create" && !formData.password;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create"
              ? "Adicionar Novo Usuário"
              : "Editar Usuário"}
          </DialogTitle>
          <DialogDescription>
            {modalMode === "create"
              ? "Preencha os dados abaixo para criar um novo acesso."
              : "Atualize as informações do usuário ou redefina a senha."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome e E-mail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: João da Silva"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={handleEmailChange}
                placeholder="exemplo@telemacoborba.pr.gov.br"
                required
              />
            </div>
          </div>

          {/* Username e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                value={formData.username || ""}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="joao.silva"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone / Celular</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(42) 99999-9999"
              />
            </div>
          </div>

          {/* Organização e Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              {/* ✅ min-w-0 é essencial aqui */}
              <Label htmlFor="role">Nível de Acesso</Label>
              <Select
                value={formData.role || "journalist"}
                onValueChange={(val) =>
                  setFormData({ ...formData, role: val as any })
                }
              >
                <SelectTrigger id="role" className="w-full truncate">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                {/* ✅ position="popper" impede que o menu force o modal a crescer */}
                <SelectContent position="popper" className="w-full max-h-60">
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MANAGER">Gestor</SelectItem>
                  <SelectItem value="PUBLISHER">Editor</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="organizationId">Secretaria / Órgão</Label>
              <Select
                value={formData.organizationId || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, organizationId: val })
                }
              >
                <SelectTrigger id="organizationId" className="w-full">
                  <SelectValue placeholder="Selecione a secretaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Acesso Global / Administração
                  </SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.title} {org.acronym ? `(${org.acronym})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (Ativo/Inativo) */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label
                htmlFor="active"
                className="text-base font-semibold cursor-pointer"
              >
                Conta Ativa
              </Label>
              <p className="text-xs text-muted-foreground">
                Desative para bloquear o acesso deste usuário ao painel.
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active ?? true}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPasswordRequired}>
              {modalMode === "create" ? "Criar Usuário" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
