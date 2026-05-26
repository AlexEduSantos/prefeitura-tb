import { CategoriesList } from "@/components/categories-list";
import { PainelHeader } from "@/components/painel-header";

export default function CategoryPage() {
  return (
    <main className="flex flex-col">
      <PainelHeader title="Categorias" />
      <section className="p-2">
        <CategoriesList />
      </section>
    </main>
  );
}
