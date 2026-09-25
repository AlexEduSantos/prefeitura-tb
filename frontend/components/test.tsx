"use client";

import useTest from "@/app/viewmodel/test.viewmodel";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";

export default function TestComponent() {
  const {
    article,
    isLoadingArticle,
    searchInput,
    setSearchInput,
    setActiveSearch,
  } = ArticleViewModel();

  const handleSearchSubmit = () => {
    setActiveSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  if (isLoadingArticle) {
    return <>Carregando...</>;
  }

  if (article) {
    return (
      <>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Digite para buscar..."
          />
          <Button onClick={handleSearchSubmit}>Buscar</Button>
        </div>
        {article.map((item) => (
          <h1 key={item.id}>{item.title}</h1>
        ))}
      </>
    );
  }

  return <>Teste</>;
}
