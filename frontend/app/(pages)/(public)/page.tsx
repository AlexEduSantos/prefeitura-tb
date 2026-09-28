import { ArticlesBlock } from "@/components/public/articles-block";
import Search from "@/components/public/search";
import { ServicesBlock } from "@/components/public/services-block";
import StoriesBlock from "@/components/public/stories-block";

export default function Home() {
  return (
    <main className="flex flex-col gap-4">
      <Search />
      <StoriesBlock />
      <ArticlesBlock />
      <ServicesBlock />
    </main>
  );
}
