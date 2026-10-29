"use client";

import { useState, useRef } from "react";
import { IMedia } from "../type/media";
import { IArticle } from "../type/article";
import { ArticleViewModel } from "./article.viewmodel";
import { useRouter } from "next/navigation";
import { useOrganizationViewModel } from "./organization.viewmodel";
import { IGallery } from "../type/gallery";
import { useProfileViewModel } from "./user.viewmodel";

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
  galleryId: string[];
  socialPreviewTitle: string;
  socialPreviewImage: string;
  socialPreviewDescription: string;
  organizationId: string;
  categoryIds: string[];
  // Dates
  publicationDate: string;
  expirationDate: string;
  // Relations
  cover: IMedia | null;
  gallery: IGallery | null;
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

export function useNewArticleViewModel(
  initialData?: IArticle,
  onSuccessCallback?: () => void,
) {
  const router = useRouter();
  const { createArticle, updateArticle } = ArticleViewModel();
  const { profile } = useProfileViewModel();
  const {
    organizations,
    isLoadingOrganizations,
    categories,
    isLoadingCategories,
  } = useOrganizationViewModel();

  // Toggles de visibilidade (UI)
  const [hasHeadline, setHasHeadline] = useState(false);

  // Modais de Mídia
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Referência para o editor de texto rico (Rich Text)
  const editorContentRef = useRef<string>(initialData?.body || "");

  // Estado Principal do Formulário
  const [form, setForm] = useState<NewArticleFormState>({
    title: initialData?.title || "",
    headline: initialData?.headline || "",
    slug: initialData?.slug || "",
    type: initialData?.type || "article",
    featured: initialData?.featured || false,
    author: initialData?.author?.name || profile?.name || "Usuário Atual",
    editor: initialData?.editor?.name || "",
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
    seoKeywords: initialData?.seoKeywords
      ? initialData.seoKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    allowComments: initialData?.allowComments ?? true,
    tags: initialData?.tags || [],
    socialPreviewTitle: initialData?.socialPreviewTitle || "",
    socialPreviewImage: initialData?.socialPreviewImage || "",
    socialPreviewDescription:
      (initialData as any)?.socialPreviewDescription || "",
    organizationId: initialData?.organizationId || "",
    categoryIds: (initialData as any)?.categories?.map((c: any) => c.id) || [],
    publicationDate: initialData?.publicationDate
      ? new Date(initialData.publicationDate).toISOString().slice(0, 16)
      : "",
    expirationDate: initialData?.expirationDate
      ? new Date(initialData.expirationDate).toISOString().slice(0, 16)
      : "",
    cover: initialData?.cover || null,
    gallery: initialData?.gallery || null,
    galleryId: initialData?.galleryId || [],
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
      organizationId: form.organizationId,
      categoryIds: form.categoryIds,
      // Envia null explicitamente para que a API limpe o campo quando removido
      coverId: (form.cover?.id ?? null) as any,
      galleryId: (form.gallery?.id ?? null) as any,

      featured: form.featured,
      authorId: profile?.id,
      editorId: profile?.id,

      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      seoKeywords:
        form.seoKeywords.length > 0 ? form.seoKeywords.join(", ") : undefined,

      allowComments: form.allowComments,
      tags: form.tags.length > 0 ? form.tags : undefined,
      visibility: "public", // Removido da UI, forçado como publico

      socialPreviewTitle: form.socialPreviewTitle || undefined,
      socialPreviewImage: form.socialPreviewImage || undefined,
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

    if (initialData?.id) {
      updateArticle(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            alert(`Matéria atualizada com sucesso!`);
            if (onSuccessCallback) onSuccessCallback();
            else router.push("/administrator/articles");
          },
          onError: (err) => {
            alert("Erro ao atualizar matéria: " + err.message);
          },
        },
      );
    } else {
      createArticle(payload, {
        onSuccess: () => {
          alert(
            `Matéria salva como ${status === "draft" ? "rascunho" : "publicada"} com sucesso!`,
          );
          if (onSuccessCallback) onSuccessCallback();
          else router.push("/administrator/articles");
        },
        onError: (err) => {
          alert("Erro ao salvar matéria: " + err.message);
        },
      });
    }
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
    organizations,
    isLoadingOrganizations,
    categories,
    isLoadingCategories,
  };
}
