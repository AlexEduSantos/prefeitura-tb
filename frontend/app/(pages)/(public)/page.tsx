import { ArticlesBlock } from "@/components/public/articles-block";
import { MainCarousel } from "@/components/public/main-carousel";
import Search from "@/components/public/search";
import { ServicesBlock } from "@/components/public/services-block";
import StoriesBlock from "@/components/public/stories-block";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 py-2">
      {/* <Search /> */}
      <MainCarousel />
      <StoriesBlock />
      <ArticlesBlock />
      <ServicesBlock />
    </main>
  );
}
