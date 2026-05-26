import { ArticlesList } from "@/components/articles-list";
import { PainelHeader } from "@/components/painel-header";

export default function ArtigosPage() {
  return (
    <main className="w-full flex flex-col">
      <PainelHeader title="Artigos" />
      <section className="p-2">
        <ArticlesList />
      </section>
    </main>
  );
}
