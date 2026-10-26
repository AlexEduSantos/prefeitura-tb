import { SearchResults } from "@/components/public/search-results";
import { Input } from "@/components/ui/input";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PesquisaPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const searchTerm = q || "";

  return (
    <main className="w-full max-w-7xl mx-auto h-full py-4">
      {/* Passamos o termo para um Client Component gerenciar o fetch com React Query */}
      <SearchResults term={searchTerm} />
    </main>
  );
}
