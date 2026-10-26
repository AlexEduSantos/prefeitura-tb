"use client";
import { Input } from "../ui/input";
import useSearch from "@/app/viewmodel/search.viewmodel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { IArticle } from "@/app/type/article";
import { IServices } from "@/app/type/services";
import { ServiceItem } from "./service-list";
import { IPage } from "@/app/type/page";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { extractTextFromLexical } from "@/lib/lexical-utils";
import { SearchBar } from "../search-bar";

function ArticleCard({ article }: { article: IArticle }) {
  const router = useRouter();
  const resumo = extractTextFromLexical(article.body);

  const handleNavigate = () => {
    // Ajuste a rota base '/noticias' conforme a estrutura do seu site
    router.push(`/noticias/${article.slug}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className="w-full rounded-lg shadow group cursor-pointer hover:shadow-lg transition-shadow p-3 bg-card flex flex-col md:flex-row gap-4 items-start"
    >
      {/* Container da Imagem com proporção fixa */}
      <div className=" sm:h-10 aspect-video relative overflow-hidden rounded-md bg-muted">
        {article.cover?.key && (
          <Image
            loader={() =>
              `${process.env.NEXT_PUBLIC_API_URL}/media/file/${article.cover?.key}`
            }
            src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${article.cover?.key}`}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Conteúdo de Texto */}
      <div className="flex-1 flex flex-col py-1">
        <h2 className="text-primary text-xl md:text-2xl font-bold line-clamp-2 md:line-clamp-3">
          {article.title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground line-clamp-3 md:line-clamp-4 mt-2">
          {article.headline ? article.headline : resumo}
        </p>
      </div>
    </div>
  );
}

interface PageItemProps {
  page: IPage;
}

export function PageItem({ page }: PageItemProps) {
  const router = useRouter();

  const handleNavigate = () => {
    // Se a página pertence a uma secretaria (space), monta a URL com o prefixo.
    // Caso contrário, vai direto para o slug.
    const spaceSlug = page.space?.slug;
    const url = spaceSlug ? `/${spaceSlug}/${page.slug}` : `/${page.slug}`;

    router.push(url);
  };

  return (
    <article
      onClick={handleNavigate}
      className="w-full p-4 rounded-lg shadow bg-card hover:shadow-lg hover:bg-muted/50 transition-all cursor-pointer flex flex-col gap-2"
    >
      <h2 className="text-lg font-bold text-primary line-clamp-2">
        {page.title}
      </h2>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {page.description}
      </p>
    </article>
  );
}

export function SearchResults({ term }: { term: string }) {
  const { search, setSearch, isLoading, services, pages, articles, refetch } =
    useSearch(term);
  const router = useRouter();

  if (isLoading) return <Skeleton className="w-full h-screen" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-primary">Resultados da busca</h1>
        <p className="text-muted-foreground">
          {term
            ? `Exibindo resultados para: "${search}"`
            : "Digite um termo para pesquisar no site."}
        </p>
      </div>
      <SearchBar
        initialValue={term}
        placeholder="O que você procura?"
        className="w-full"
        onClear={() => {
          router.push("/pesquisa");
          setSearch("");
        }}
        onSearch={(term) => {
          setSearch(term);
          router.push(`/pesquisa?q=${term}`);
          refetch();
        }}
        searchAsYouType={true}
      />

      <Tabs
        defaultValue="articles"
        className="w-full"
        aria-label="Navegação por abas"
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="articles"
            className="data-[state=active]:text-primary"
          >
            Artigos
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="data-[state=active]:text-primary"
          >
            Serviços
          </TabsTrigger>
          <TabsTrigger
            value="pages"
            className="data-[state=active]:text-primary"
          >
            Páginas
          </TabsTrigger>
        </TabsList>

        {/* Alterado de flex para grid para os artigos ficarem bem distribuídos e empilharem no mobile */}
        <TabsContent
          value="articles"
          className="grid grid-cols-1 gap-4 w-full mt-4"
        >
          {articles && articles.length > 0 ? (
            articles.map((article: IArticle) => (
              <ArticleCard key={article.id} article={article} />
            ))
          ) : (
            <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services && services.length > 0 ? (
              services.map((service: IServices) => (
                <ServiceItem key={service.id} service={service} />
              ))
            ) : (
              <p className="text-muted-foreground">
                Nenhum serviço encontrado.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pages && pages.length > 0 ? (
              pages.map((page: IPage) => <PageItem key={page.id} page={page} />)
            ) : (
              <p className="text-muted-foreground">
                Nenhuma página encontrada.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
