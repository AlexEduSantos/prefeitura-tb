import { ArticleItem } from "./article-item";

export function ArticlesList() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4 gap-2">
      <ArticleItem />
      <ArticleItem />
      <ArticleItem />
      <ArticleItem />
    </section>
  );
}
