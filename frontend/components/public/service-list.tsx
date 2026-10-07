"use client";
import { IServices } from "@/app/type/services";
import { useServices } from "@/app/viewmodel/services.viewmodel";
import Image from "next/image";
import { Input } from "../ui/input";
import { ChevronDown, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { Button } from "../ui/button";

interface ServiceItemProps {
  service: IServices;
}
function ServiceItem({ service }: ServiceItemProps) {
  return (
    <article
      key={service.id}
      className="w-full h-full min-h-50 rounded-lg bg-card shadow relative hover:scale-104 hover:shadow-md cursor-pointer transition-all duration-300"
      onClick={() => {
        service.link ? window.open(service.link, "_blank") : null;
      }}
    >
      <Image
        loader={() =>
          `${process.env.NEXT_PUBLIC_API_URL}/media/file/${service.image?.key}`
        }
        src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${service.image?.key}`}
        alt={service.image?.title}
        fill
        className="rounded-lg object-contain"
      />
    </article>
  );
}

interface ToolbarProps {
  limit: number;
  setLimit: (limit: number) => void;
  search: string;
  setSearch: (search: string) => void;
}

function Toolbar({ limit, setLimit, search, setSearch }: ToolbarProps) {
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
          <DropdownMenuLabel>Destaque</DropdownMenuLabel>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="false">
              Não destacados
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="true">
              Destacados
            </DropdownMenuRadioItem>
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

export function ServicesList() {
  const { services, isLoadingServices, limit, setLimit, search, setSearch } =
    useServices();

  if (isLoadingServices) return <>Carregando...</>;

  return (
    <section className="flex flex-col gap-4">
      {/* Toolbar */}
      <Toolbar
        limit={limit}
        setLimit={setLimit}
        search={search}
        setSearch={setSearch}
      />
      <div className="grid grid-cols-4 gap-4">
        {services.map((service: IServices) => (
          <ServiceItem key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
