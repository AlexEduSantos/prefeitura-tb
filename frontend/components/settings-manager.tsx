"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/viewmodel/settings.viewmodel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Loader2,
  ImageIcon,
  Paintbrush,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { MediaPickerModal } from "./media-picker-modal";
import { IMedia } from "@/app/type/media";
import { ISiteSettings } from "@/app/type/settings";
import { getMediaUrl } from "@/lib/utils";

export function SettingsManager() {
  const {
    settings,
    isLoadingSettings,
    updateSettings,
    isUpdating,
    openModal,
    setOpenModal,
    setField,
  } = useSettings();

  // Estado local para controlar o formulário
  const [formData, setFormData] = useState<Partial<ISiteSettings>>({});
  // Controle do modal de mídia: pode ser "logo", "favicon" ou null
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    "logo" | "favicon" | null
  >(null);

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

  const handleMediaSelect = (media: IMedia | IMedia[]) => {
    const selected = Array.isArray(media) ? media[0] : media;
    if (!selected) return;
    const mediaUrl = getMediaUrl(selected.key) || "";
    console.log(mediaUrl);
    if (mediaPickerTarget === "logo") {
      setFormData((prev) => ({ ...prev, logoUrl: mediaUrl }));
    } else if (mediaPickerTarget === "favicon") {
      setFormData((prev) => ({ ...prev, faviconUrl: mediaUrl }));
    }
    setMediaPickerTarget(null);
  };

  if (isLoadingSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Tabs defaultValue="geral" className="w-full gap-2">
          <TabsList className="m-0 h-fit! p-2 ring! ring-border/50!">
            <TabsTrigger value="geral" className="gap-2 ">
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
          <TabsContent value="geral" className="">
            <div className="rounded-xl bg-card p-4 shadow space-y-6 ring! ring-border/50!">
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
                <small className="text-[0.8rem] text-muted-foreground">
                  Usado nos resultados de busca do Google.
                </small>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção de Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo do Site</Label>
                  {formData.logoUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative min-h-40 min-w-40 aspect-video bg-muted rounded-md border overflow-hidden group">
                        <Image
                          src={formData.logoUrl}
                          alt="Preview do Logo"
                          fill
                          className="object-cover object-center"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, logoUrl: "" })
                          }
                          className="text-destructive group-hover:text-white group-hover:bg-destructive hover:bg-card hover:text-destructive absolute top-1 right-1 z-10 size-5 bg-white p-1 hover:scale-110 transition-all duration-200"
                        >
                          <X className="" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaPickerTarget("logo")}
                      className="gap-2 shrink-0 min-h-40 min-w-40 p-2 flex flex-col items-center border-dashed text-muted-foreground aspect-video"
                    >
                      <Upload className="size-4" /> Escolher Imagem
                    </Button>
                  )}
                </div>
                {/* Seleção de Favicon */}
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon</Label>
                  {formData.faviconUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative min-h-20 min-w-20 aspect-square bg-muted rounded-md border overflow-hidden group">
                        <Image
                          src={formData.faviconUrl}
                          alt="Preview do Favicon"
                          fill
                          className="object-cover object-center"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            setFormData({ ...formData, faviconUrl: "" })
                          }
                          className="text-destructive group-hover:text-white  hover:text-destructive group-hover:bg-destructive absolute top-1 right-1 z-10 size-4 bg-white p-1 hover:bg-card hover:scale-110 transition-all duration-200"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaPickerTarget("favicon")}
                      className="gap-2 shrink-0 min-h-20 min-w-20 p-2 flex flex-col items-center border-dashed text-muted-foreground aspect-square"
                    >
                      <Upload className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ================= ABA VISUAL ================= */}
          <TabsContent value="visual" className="">
            <div className="rounded-xl bg-card p-4 shadow space-y-6 ring! ring-border/50!">
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
                <div className="space-y-2">
                  <Label>Cor Primária - Contraste </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primaryForegroundColor || "#1e3a8a"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryForegroundColor: e.target.value,
                        })
                      }
                      className="w-14 p-1 cursor-pointer h-10"
                    />
                    <Input
                      value={formData.primaryForegroundColor || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryForegroundColor: e.target.value,
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
                  <Label>Cor Secundária - Contraste </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.secondaryForegroundColor || "#f59e0b"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryForegroundColor: e.target.value,
                        })
                      }
                      className="w-14 p-1 cursor-pointer h-10"
                    />
                    <Input
                      value={formData.secondaryForegroundColor || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryForegroundColor: e.target.value,
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
                    style={{
                      backgroundColor: formData.primaryColor,
                      color: formData.primaryForegroundColor,
                    }}
                  >
                    Botão Primário
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{
                      backgroundColor: formData.secondaryColor,
                      color: formData.secondaryForegroundColor,
                    }}
                  >
                    Botão Secundário
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ================= ABA CONTATO ================= */}
          <TabsContent value="contato" className="">
            <div className="rounded-xl bg-card p-4 shadow space-y-6 ring! ring-border/50!">
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
                    value={formData.addressCity || "Telêmaco Borba"}
                    onChange={(e) =>
                      setFormData({ ...formData, addressCity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressState">Estado</Label>
                  <Input
                    id="addressState"
                    value={formData.addressState || "PR"}
                    onChange={(e) =>
                      setFormData({ ...formData, addressState: e.target.value })
                    }
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Barra de Ações Fixa no Final */}
        <div className="flex items-center justify-end gap-2 ">
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
      {/* Modal de Seleção de Mídia */}
      <MediaPickerModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        multiple={false}
      />
    </div>
  );
}
