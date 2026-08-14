"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArticleService } from "@/app/service/article.service";
import MateriaForm from "@/components/new-article";
import { PainelHeader } from "@/components/painel-header";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", id],
    queryFn: () => ArticleService.getArticle(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-8">Carregando dados da matéria...</div>;
  }

  if (isError || !article) {
    return <div className="p-8">Erro ao carregar a matéria.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <PainelHeader title="Editar artigo" />
      <div className="w-full max-h-[90vh] overflow-y-auto p-2">
        <MateriaForm initialData={article} />
      </div>
    </div>
  );
}
