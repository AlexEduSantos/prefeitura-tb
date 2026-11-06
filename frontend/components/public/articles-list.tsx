"use client";
import { ArticleViewModel } from "@/app/viewmodel/article.viewmodel";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function ArticleCard({ article }: { article: any }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/noticias/${article.slug}`)}
      className="h-full max-h-50 rounded-lg relative overflow-hidden shadow group cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="w-full h-full relative overflow-hidden">
        <Image
          loader={() =>
            `${process.env.NEXT_PUBLIC_API_URL}/media/file/${article.cover.key}`
          }
          src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${article.cover.key}`}
          alt={article.title}
          fill
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-xs text-gray-200 mb-1 uppercase tracking-wider font-medium">
          {article.categories[0].title}
        </div>
        <h3 className="text-white text-lg font-bold leading-snug line-clamp-2 group-hover:tracking-wide transition-all">
          {article.title}
        </h3>
      </div>
    </div>
  );
}

interface ToolbarProps {
  limit: number;
  setLimit: (limit: number) => void;
  search: string;
  setSearch: (search: string) => void;
  openCreateStoryModal: () => void;
}

function Toolbar({
  limit,
  setLimit,
  search,
  setSearch,
  openCreateStoryModal,
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 w-full sm:w-auto relative">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(limit)}
          onValueChange={(val) => setLimit(Number(val))}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto bg-white">
            Filtros <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-50 max-h-96 overflow-y-auto"
        >
          <DropdownMenuLabel>Tipo</DropdownMenuLabel>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="article">
              Matéria
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="event">Evento</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="note">Nota</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />

          <DropdownMenuLabel>Categoria</DropdownMenuLabel>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="">Todas</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />

          <DropdownMenuItem>Limpar filtros</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function PublicArticlesList() {
  const {
    article,
    isLoadingArticle,
    isErrorArticle,
    search,
    setSearch,
    limit,
    setLimit,
  } = ArticleViewModel();

  if (isLoadingArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto">
        <div className="flex gap-4">
          <Skeleton className="w-3/4 h-96" />
          <div className="w-1/4 grid grid-rows-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </section>
    );
  }

  if (isErrorArticle) {
    return (
      <section className="w-full max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Erro ao carregar notícias. Tente novamente mais tarde.
        </div>
      </section>
    );
  }

  if (!article || article.length === 0) {
    return null;
  }

  return (
    <>
      <section className="h-screen p-4 space-y-4 w-full max-w-7xl mx-auto">
        {/* Toolbar */}
        <Toolbar
          limit={limit}
          setLimit={setLimit}
          search={search}
          setSearch={setSearch}
          openCreateStoryModal={() => {}}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {article.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </>
  );
}
