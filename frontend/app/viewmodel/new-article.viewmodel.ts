"use client";

import { useState, useRef } from "react";
import { IMedia } from "../type/media";
import { IArticle } from "../type/article";
import { ArticleViewModel } from "./article.viewmodel";
import { useRouter } from "next/navigation";
import { useEntityViewModel } from "./entity.viewmodel";
import { useUserViewModel } from "./user.viewmodel";

export interface NewArticleFormState {
  title: string;
  headline: string;
  slug: string;
  type: string;
  featured: boolean;
  author: string;
  editor: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  allowComments: boolean;
  tags: string[];
  galleryAutoplay: boolean;
  galleryInterval: number;
  galleryShowThumbnails: boolean;
  socialPreviewTitle: string;
  socialPreviewImage: string;
  socialPreviewDescription: string;
  entityId: string;
  // Dates
  publicationDate: string;
  expirationDate: string;
  // Relations
  cover: IMedia | null;
  galleryImages: IMedia[];
}

// Função utilitária para gerar slug
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

export function useNewArticleViewModel() {
  const router = useRouter();
  const { createArticle } = ArticleViewModel();
  const { user } = useUserViewModel();
  const { entities, isLoadingEntities } = useEntityViewModel();

  // Toggles de visibilidade (UI)
  const [hasHeadline, setHasHeadline] = useState(false);

  // Modais de Mídia
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Referência para o editor de texto rico (Rich Text)
  const editorContentRef = useRef<string>("");

  // Estado Principal do Formulário
  const [form, setForm] = useState<NewArticleFormState>({
    title: "",
    headline: "",
    slug: "",
    type: "news",
    featured: false,
    author: user?.name || "Usuário Atual",
    editor: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    allowComments: true,
    tags: [],
    galleryAutoplay: true,
    galleryInterval: 5000,
    galleryShowThumbnails: true,
    socialPreviewTitle: "",
    socialPreviewImage: "",
    socialPreviewDescription: "",
    entityId: "",
    publicationDate: "",
    expirationDate: "",
    cover: null,
    galleryImages: [],
  });

  const setField = <K extends keyof NewArticleFormState>(
    key: K,
    value: NewArticleFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || form.tags.includes(trimmed)) return;
    setField("tags", [...form.tags, trimmed]);
  };

  const removeTag = (tag: string) => {
    setField(
      "tags",
      form.tags.filter((t) => t !== tag),
    );
  };

  const addSeoKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed || form.seoKeywords.includes(trimmed)) return;
    setField("seoKeywords", [...form.seoKeywords, trimmed]);
  };

  const removeSeoKeyword = (keyword: string) => {
    setField(
      "seoKeywords",
      form.seoKeywords.filter((t) => t !== keyword),
    );
  };

  const saveArticle = (status: "draft" | "published") => {
    // Validação de datas
    const now = new Date();
    if (form.publicationDate && new Date(form.publicationDate) < now) {
      alert("A data de publicação não pode ser anterior ao horário atual.");
      return;
    }
    if (form.expirationDate && new Date(form.expirationDate) < now) {
      alert("A data de expiração não pode ser anterior ao horário atual.");
      return;
    }

    // Gerar slug automaticamente se vazio
    let finalSlug = form.slug;
    if (!finalSlug || finalSlug.trim() === "") {
      finalSlug = generateSlug(form.title);
    }

    const payload: Partial<IArticle> = {
      title: form.title,
      slug: finalSlug,
      body: editorContentRef.current,
      type: form.type,
      status: status === "draft" ? "rascunho" : "publicado",
      entityId: form.entityId,

      featured: form.featured,
      authorId: user?.id,
      editorId: user?.id,

      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      seoKeywords: form.seoKeywords.length > 0 ? form.seoKeywords.join(', ') : undefined,

      allowComments: form.allowComments,
      tags: form.tags.length > 0 ? form.tags : undefined,
      visibility: "public", // Removido da UI, forçado como publico

      galleryAutoplay: form.galleryAutoplay,
      galleryInterval: Number(form.galleryInterval),
      galleryShowThumbnails: form.galleryShowThumbnails,

      socialPreviewTitle: form.socialPreviewTitle || undefined,
      socialPreviewImage: form.socialPreviewImage || undefined,
      socialPreviewDescription: form.socialPreviewDescription || undefined,
    };

    if (hasHeadline && form.headline) payload.headline = form.headline;
    if (form.publicationDate)
      payload.publicationDate = new Date(
        form.publicationDate,
      ).toISOString() as any;
    if (form.expirationDate)
      payload.expirationDate = new Date(
        form.expirationDate,
      ).toISOString() as any;

    if (form.cover) payload.coverId = form.cover.id as any;
    if (form.galleryImages.length > 0) {
      payload.galleryImages = form.galleryImages.map((m) => m.id) as any[];
    }

    console.log(payload);

    createArticle(payload, {
      onSuccess: () => {
        alert(
          `Matéria salva como ${status === "draft" ? "rascunho" : "publicada"} com sucesso!`,
        );
        router.push("/administrator/articles");
      },
      onError: (err) => {
        alert("Erro ao salvar matéria: " + err.message);
      },
    });
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    saveArticle("draft");
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    saveArticle("published");
  };

  return {
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
  };
}
