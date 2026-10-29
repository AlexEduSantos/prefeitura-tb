"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/viewmodel/settings.viewmodel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, ImageIcon, Paintbrush, MapPin } from "lucide-react";
import Image from "next/image";
import { ISiteSettings } from "@/app/type/settings";

export function SettingsManager() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();

  // Estado local para controlar o formulário
  const [formData, setFormData] = useState<Partial<ISiteSettings>>({});

  // Sincroniza os dados do banco com o formulário assim que carregar
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="">
            <TabsTrigger value="geral" className="gap-2">
              <ImageIcon className="size-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="visual" className="gap-2">
              <Paintbrush className="size-4" /> Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="contato" className="gap-2">
              <MapPin className="size-4" /> Contato e Endereço
            </TabsTrigger>
          </TabsList>

          {/* ================= ABA GERAL ================= */}
          <TabsContent value="geral" className="mt-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nome do Site *</Label>
                <Input
                  id="siteName"
                  value={formData.siteName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, siteName: e.target.value })
                  }
                  placeholder="Ex: Prefeitura de Telêmaco Borba"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrição (SEO)</Label>
                <Input
                  id="siteDescription"
                  value={formData.siteDescription || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      siteDescription: e.target.value,
                    })
                  }
                  placeholder="Portal oficial da prefeitura..."
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Usado nos resultados de busca do Google.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL do Logo</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://... ou /media/..."
                  />
                  {formData.logoUrl && (
                    <div className="mt-2 relative h-16 w-48 bg-muted rounded-md border p-2">
                      <Image
                        src={formData.logoUrl}
                        alt="Preview do Logo"
                        fill
                        className="object-contain p-2"
                        unoptimized // Para preview de URLs externas ou locais
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">URL do Favicon</Label>
                  <Input
                    id="faviconUrl"
                    value={formData.faviconUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, faviconUrl: e.target.value })
                    }
                    placeholder="/favicon.ico"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ================= ABA VISUAL ================= */}
          <TabsContent value="visual" className="mt-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cor Primária */}
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primaryColor || "#1e3a8a"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-14 p-1 cursor-pointer h-10"
                    />
                    <Input
                      value={formData.primaryColor || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada em botões, links e cabeçalhos.
                  </p>
                </div>

                {/* Cor Secundária */}
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.secondaryColor || "#f59e0b"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-14 p-1 cursor-pointer h-10"
                    />
                    <Input
                      value={formData.secondaryColor || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="flex-1 font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada em botões de destaque e alertas.
                  </p>
                </div>
              </div>

              {/* Preview das Cores */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                <p className="text-sm font-medium mb-3">Pré-visualização</p>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Botão Primário
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{
                      backgroundColor: formData.secondaryColor,
                      color: "#000",
                    }}
                  >
                    Botão Secundário
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ================= ABA CONTATO ================= */}
          <TabsContent value="contato" className="mt-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Institucional</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contato@telemacoborba.pr.gov.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone Principal</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(42) 3271-1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="addressStreet">Endereço (Rua/Av.)</Label>
                  <Input
                    id="addressStreet"
                    value={formData.addressStreet || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addressStreet: e.target.value,
                      })
                    }
                    placeholder="Praça do Centenário, 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressZip">CEP</Label>
                  <Input
                    id="addressZip"
                    value={formData.addressZip || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, addressZip: e.target.value })
                    }
                    placeholder="84261-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="addressCity">Cidade</Label>
                  <Input
                    id="addressCity"
                    value={formData.addressCity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, addressCity: e.target.value })
                    }
                    defaultValue="Telêmaco Borba"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressState">Estado</Label>
                  <Input
                    id="addressState"
                    value={formData.addressState || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, addressState: e.target.value })
                    }
                    defaultValue="PR"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Barra de Ações Fixa no Final */}
        <div className="flex items-center justify-end gap-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(settings || {})}
            disabled={isUpdating}
          >
            Descartar Alterações
          </Button>
          <Button
            type="submit"
            disabled={isUpdating}
            className="gap-2 min-w-32"
          >
            {isUpdating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="size-4" /> Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
