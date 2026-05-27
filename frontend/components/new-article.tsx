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
import { X, Tag, Image as ImageIcon, Images, Key } from "lucide-react";
import { useNewArticleViewModel } from "../app/viewmodel/new-article.viewmodel";
import { MediaPickerModal } from "./media-picker-modal";
import { useState } from "react";
import { IMedia } from "../app/type/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dados de Exemplo para Tipo
const CATEGORIES = [
  { id: "article", label: "Matéria" },
  { id: "event", label: "Evento" },
  { id: "note", label: "Nota" },
  { id: "announcement", label: "Comunicado" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function MateriaForm() {
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
    entities,
    isLoadingEntities,
  } = useNewArticleViewModel();

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

  const getMediaUrl = (media: string) => `${API_URL}/media/file/${media}`;

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
                  <Label htmlFor="categoria" className="font-medium">
                    Categoria (Secretaria){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.entityId}
                    onValueChange={(v) => setField("entityId", v)}
                    required
                  >
                    <SelectTrigger id="categoria" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingEntities
                            ? "Carregando..."
                            : "Selecione uma secretaria"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
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
                  onChange={(content) => (editorContentRef.current = content)}
                />
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-5 border border-border rounded-xl p-6">
              <legend className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Mídias (Capa e Galeria)
              </legend>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Capa */}
                <div className="flex-1 space-y-3">
                  <Label className="font-medium">Imagem de Capa</Label>
                  {form.cover ? (
                    <div className="relative aspect-video rounded-md overflow-hidden border">
                      <img
                        src={getMediaUrl(form.cover.key as string)}
                        alt="Capa"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={() => setField("cover", null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed flex flex-col gap-2"
                      onClick={() => setIsCoverModalOpen(true)}
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Selecionar Capa
                      </span>
                    </Button>
                  )}
                </div>

                {/* Galeria */}
                <div className="flex-1 space-y-3">
                  <Label className="font-medium">Galeria de Imagens</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {form.galleryImages.map((media, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-md overflow-hidden border"
                      >
                        <img
                          src={getMediaUrl(media.key)}
                          alt="Galeria"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 rounded-full h-5 w-5 p-0"
                          onClick={() =>
                            setField(
                              "galleryImages",
                              form.galleryImages.filter(
                                (m) => m.id !== media.id,
                              ),
                            )
                          }
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="aspect-square w-full h-32 border-dashed flex flex-col gap-2"
                      onClick={() => setIsGalleryModalOpen(true)}
                    >
                      <Images className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Adicionar
                      </span>
                    </Button>
                  </div>
                  {form.galleryImages.length > 0 && (
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="autoplay"
                          checked={form.galleryAutoplay}
                          onCheckedChange={(v) =>
                            setField("galleryAutoplay", v)
                          }
                        />
                        <Label htmlFor="autoplay" className="text-sm">
                          Autoplay
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="thumbs"
                          checked={form.galleryShowThumbnails}
                          onCheckedChange={(v) =>
                            setField("galleryShowThumbnails", v)
                          }
                        />
                        <Label htmlFor="thumbs" className="text-sm">
                          Miniaturas
                        </Label>
                      </div>
                    </div>
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
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Salvar Rascunho
          </Button>
          <Button type="submit">Salvar e Publicar</Button>
        </div>
      </form>

      {/* Modais de Mídia */}
      <MediaPickerModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={(media) => setField("cover", media as IMedia)}
        multiple={false}
      />

      <MediaPickerModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={(medias) =>
          setField("galleryImages", [
            ...form.galleryImages,
            ...(medias as IMedia[]),
          ])
        }
        multiple={true}
      />
    </>
  );
}
