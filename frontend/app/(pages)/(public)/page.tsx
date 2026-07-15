import { ArticlesBlock } from "@/components/public/articles-block";
import { Footer } from "@/components/public/footer";
import Search from "@/components/public/search";
import { ServicesBlock } from "@/components/public/services-block";

export default function Home() {
  return (
    <main className="flex flex-col gap-4">
      <Search />
      <ArticlesBlock />
      <ServicesBlock />
      <Footer />
    </main>
  );
}
