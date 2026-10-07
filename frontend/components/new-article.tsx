"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from "../app/modules/text-editor/components/Editor";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  X,
  Tag,
  Image as ImageIcon,
  Images,
  Key,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { useNewArticleViewModel } from "../app/viewmodel/new-article.viewmodel";
import { MediaPickerModal } from "./media-picker-modal";
import { useState } from "react";
import { IMedia } from "../app/type/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IArticle } from "../app/type/article";
import { GalleryPickerModal } from "./gallery-picker-modal";
import { IGallery } from "@/app/type/gallery";
import { Carousel } from "./carousel";
import Image from "next/image";

// Dados de Exemplo para Tipo
const CATEGORIES = [
  { id: "article", label: "Matéria" },
  { id: "event", label: "Evento" },
  { id: "note", label: "Nota" },
  { id: "announcement", label: "Comunicado" },
];

export default function MateriaForm({
  initialData,
  onSuccess,
}: {
  initialData?: IArticle;
  onSuccess?: () => void;
}) {
  const {
    form,
    setField,
    addTag,
    removeTag,
    addSeoKeyword,
    removeSeoKeyword,
    handleSaveDraft,
    handlePublish,
    editorContentRef,
    hasHeadline,
    setHasHeadline,
    isCoverModalOpen,
    setIsCoverModalOpen,
    isGalleryModalOpen,
    setIsGalleryModalOpen,
    organizations,
    isLoadingOrganizations,
    categories,
    isLoadingCategories,
  } = useNewArticleViewModel(initialData, onSuccess);

  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const handleSeoKeywordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSeoKeyword(seoKeywordInput);
      setSeoKeywordInput("");
    }
  };

  const onAddTagClick = () => {
    addTag(tagInput);
    setTagInput("");
  };

  const onAddSeoKeywordClick = () => {
    addSeoKeyword(seoKeywordInput);
    setSeoKeywordInput("");
  };

  const handleRemoveGallery = () => {
    setField("galleryId", []);
    setField("gallery", null);
  };

  const getMediaUrl = (media: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/media/file/${media}`;

  const getCover = form.cover?.key;

  const getGallery = form.gallery;

  return (
    <>
      <form
        onSubmit={handlePublish}
        className="flex flex-col gap-2 max-w-[90%] mx-auto"
      >
        <Tabs defaultValue="conteudo" className="">
          <TabsList className="flex gap-2 w-full border bg-card">
            <TabsTrigger
              value="conteudo"
              className="relative group data-[state=active]:bg-transparent!"
            >
              Conteúdo e Mídia
              <span className="absolute bottom-0 translate-x-1/2 left-0 h-0.5 w-0 bg-primary transition-all duration-200 group-data-[state=active]:w-[50%]" />
            </TabsTrigger>
            <TabsTrigger
              value="publicacao"
              className="relative group data-[state=active]:bg-transparent!"
            >
              Publicação
              <span className="absolute bottom-0 translate-x-1/2 left-0 h-0.5 w-0 bg-primary transition-all duration-200 group-data-[state=active]:w-[50%]" />
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="relative group data-[state=active]:bg-transparent!"
            >
              SEO
              <span className="absolute bottom-0 translate-x-1/2 left-0 h-0.5 w-0 bg-primary transition-all duration-200 group-data-[state=active]:w-[50%]" />
            </TabsTrigger>
          </TabsList>

          {/* ----------------- ABA 1: CONTEÚDO ----------------- */}
          <TabsContent value="conteudo" className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Dados Principais
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="titulo" className="font-medium">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    placeholder="Informe o título da matéria"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slug" className="font-medium">
                    Apelido{" "}
                    <span className="text-muted-foreground font-normal">
                      (URL amigável - opcional)
                    </span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="Deixe em branco para gerar do título"
                    value={form.slug}
                    onChange={(e) => setField("slug", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="organization" className="font-medium">
                    Secretaria / Órgão Responsável{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.organizationId}
                    onValueChange={(v) => setField("organizationId", v)}
                    required
                  >
                    <SelectTrigger id="organization" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingOrganizations
                            ? "Carregando..."
                            : "Selecione uma secretaria/órgão"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="category" className="font-medium">
                    Categoria Principal
                  </Label>
                  <Select
                    value={form.categoryIds[0] || ""}
                    onValueChange={(v) => setField("categoryIds", [v])}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Carregando..."
                            : "Selecione uma categoria"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Label htmlFor="toggle-linha-fina" className="cursor-pointer">
                    Linha Fina (Subtítulo){" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Switch
                    id="toggle-linha-fina"
                    checked={hasHeadline}
                    onCheckedChange={setHasHeadline}
                  />
                </div>
                {hasHeadline && (
                  <Textarea
                    id="linha-fina"
                    placeholder="Subtítulo ou linha de apoio da matéria"
                    value={form.headline}
                    onChange={(e) => setField("headline", e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-medium">
                  Conteúdo (Corpo) <span className="text-destructive">*</span>
                </Label>
                <Editor
                  initialValue={initialData?.body}
                  onChange={(content) => (editorContentRef.current = content)}
                />
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6 pt-2">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Mídias (Capa e Galeria)
              </legend>

              {/* 1. items-stretch faz ambas as colunas terem exatamente a mesma altura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* COLUNA 1: Imagem de Capa */}
                <div className="flex flex-col gap-2 h-full group">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium min-h-10">
                      Imagem de Capa
                    </Label>
                    {getCover && (
                      <div className="hidden group-hover:block items-center space-x-3 transition-all duration-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-destructive hover:text-destructive/80 hover:bg-transparent p-0 h-fit!"
                          onClick={() => setField("cover", null)}
                        >
                          <X className="mr-1 h-4 w-4" /> Remover
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-muted-foreground/50 hover:text-primary hover:bg-transparent p-0 h-fit!"
                          onClick={() => setIsCoverModalOpen(true)}
                        >
                          <RefreshCcw className="mr-1 h-4 w-4" /> Substituir
                        </Button>
                      </div>
                    )}
                  </div>

                  {getCover ? (
                    <div className="relative w-full flex-1 min-h-70 group border border-border overflow-hidden rounded-lg">
                      <img
                        src={getMediaUrl(getCover!)}
                        alt="Capa"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex-1 min-h-50 border-dashed flex flex-col gap-2 justify-center items-center rounded-lg hover:border-primary/60 transition-colors"
                      onClick={() => setIsCoverModalOpen(true)}
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground font-normal">
                        Selecionar Capa
                      </span>
                    </Button>
                  )}
                </div>

                {/* COLUNA 2: Galeria de Imagens (Determina a altura do conjunto) */}
                <div className="flex flex-col gap-2 h-full group">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium min-h-10">
                      Galeria de Imagens
                    </Label>
                    {getGallery && (
                      <div className="hidden group-hover:flex items-center gap-3 transition-all duration-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-destructive hover:text-destructive/80 hover:bg-transparent p-0 h-fit!"
                          onClick={handleRemoveGallery}
                        >
                          <X className="mr-1 h-4 w-4" /> Remover
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-muted-foreground/50 hover:text-primary hover:bg-transparent p-0 h-fit!"
                          onClick={() => setIsGalleryModalOpen(true)}
                        >
                          <RefreshCcw className="mr-1 h-4 w-4" /> Substituir
                        </Button>
                      </div>
                    )}
                  </div>

                  {getGallery ? (
                    <div className="w-full flex-1 min-h-50 flex flex-col gap-2 justify-center items-center rounded-lg relative">
                      {getGallery.slides.length > 1 ? (
                        <div className="grid grid-cols-3 gap-2 w-full h-full overflow-y-auto">
                          {getGallery.slides.map((slide) => (
                            <div
                              className="relative w-full h-32 border border-border overflow-hidden rounded-lg"
                              key={slide.id}
                            >
                              <img
                                src={getMediaUrl(slide.media.key!)}
                                alt={slide.caption ?? "Slide"}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="relative w-full flex-1 min-h-50 border border-border overflow-hidden rounded-lg">
                          <img
                            src={getMediaUrl(getGallery.slides[0].media.key!)}
                            alt={getGallery.slides[0].caption ?? "Slide"}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex-1 min-h-50 border-dashed flex flex-col gap-2 justify-center items-center rounded-lg hover:border-primary/60 transition-colors"
                      onClick={() => setIsGalleryModalOpen(true)}
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground font-normal">
                        Selecionar Galeria
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tags de Classificação
              </legend>
              <div className="flex flex-col gap-2">
                <Label className="font-medium">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tag-input"
                    placeholder="Digite uma tag e aperte Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onAddTagClick}
                  >
                    <Tag size={14} className="mr-1.5" /> Adicionar
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded-full hover:bg-muted p-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          </TabsContent>

          {/* ----------------- ABA 2: PUBLICAÇÃO ----------------- */}
          <TabsContent value="publicacao" className="flex flex-col gap-8 mt-6">
            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Configurações de Publicação
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="type" className="font-medium">
                    Tipo
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setField("type", v)}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="destaque"
                      checked={form.featured}
                      onCheckedChange={(v) => setField("featured", v)}
                    />
                    <Label htmlFor="destaque" className="cursor-pointer">
                      Destaque
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="comments"
                      checked={form.allowComments}
                      onCheckedChange={(v) => setField("allowComments", v)}
                    />
                    <Label htmlFor="comments" className="cursor-pointer">
                      Permitir Comentários
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="author" className="font-medium">
                    Autor
                  </Label>
                  <Input
                    id="author"
                    value={form.author}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editor" className="font-medium">
                    Último Editor
                  </Label>
                  <Input
                    id="editor"
                    value={form.editor}
                    readOnly
                    className="bg-muted text-muted-foreground placeholder:text-muted-foreground"
                    placeholder="Nenhum (Matéria Nova)"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Agendamento
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label className="font-medium">
                    Data de Publicação{" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.publicationDate}
                    onChange={(e) =>
                      setField("publicationDate", e.target.value)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    Deixe em branco para publicar imediatamente.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="font-medium">
                    Data de Expiração{" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.expirationDate}
                    onChange={(e) => setField("expirationDate", e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">
                    Deixe em branco para não expirar.
                  </span>
                </div>
              </div>
            </fieldset>
          </TabsContent>

          {/* ----------------- ABA 3: SEO ----------------- */}
          <TabsContent value="seo" className="flex flex-col gap-8 mt-6">
            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Search Engine Optimization (SEO)
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seoTitle" className="font-medium">
                  SEO Title
                </Label>
                <Input
                  id="seoTitle"
                  value={form.seoTitle}
                  onChange={(e) => setField("seoTitle", e.target.value)}
                  placeholder="Título otimizado para buscadores"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seoDesc" className="font-medium">
                  SEO Description
                </Label>
                <Textarea
                  id="seoDesc"
                  value={form.seoDescription}
                  onChange={(e) => setField("seoDescription", e.target.value)}
                  rows={3}
                  placeholder="Breve resumo sobre a matéria para exibir nos resultados do Google"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Label className="font-medium">SEO Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    id="seo-keyword-input"
                    placeholder="Digite uma palavra-chave e aperte Enter"
                    value={seoKeywordInput}
                    onChange={(e) => setSeoKeywordInput(e.target.value)}
                    onKeyDown={handleSeoKeywordKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onAddSeoKeywordClick}
                  >
                    <Key size={14} className="mr-1.5" /> Adicionar
                  </Button>
                </div>
                {form.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.seoKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeSeoKeyword(keyword)}
                          className="rounded-full hover:bg-muted p-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pb-12 mt-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Salvar Rascunho
          </Button>
          <Button type="submit">
            {initialData ? "Atualizar Matéria" : "Salvar e Publicar"}
          </Button>
        </div>
      </form>

      {/* Modais de Mídia */}
      <MediaPickerModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={(media) => setField("cover", media as IMedia)}
        multiple={false}
      />

      <GalleryPickerModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectGallery={(gallery) => setField("gallery", gallery as IGallery)}
        selectedGallery={form.gallery}
      />
    </>
  );
}
