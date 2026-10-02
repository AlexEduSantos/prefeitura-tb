"use client";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useServices } from "@/app/viewmodel/services.viewmodel";
import { IServices } from "@/app/type/services";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function ServicesBlock() {
  const { services, isLoadingServices } = useServices();
  const router = useRouter();

  if (isLoadingServices) return <>Carregando...</>;

  // 6 serviços em destaque ordenados por mais recente
  const featuredServices = services
    .filter((service: IServices) => service.featured)
    .sort((a: IServices, b: IServices) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 xl:px-0">
      <div className="w-full flex items-center gap-2">
        <span className="h-5 w-1 bg-primary rounded-full" />
        <h3 className="uppercase text-nowrap tracking-widest text-sm">
          Serviços em Destaque
        </h3>
        <span className="w-full h-px bg-muted-foreground/20 rounded-full" />
        <Button
          variant="ghost"
          className="text-xs text-primary text-nowrap hover:font-semibold hover:scale-105 hover:text-primary group transition-all duration-300 px-0 cursor-pointer"
          onClick={() => router.push("/servicos")}
        >
          Todos os serviços
          <ChevronRight />
        </Button>
      </div>
      <div className="w-full grid md:grid-cols-3 grid-cols-2 md:grid-rows-2 grid-rows-3 gap-2 sm:gap-4">
        {!featuredServices.length && (
          <div>Não foi possível obter os serviços.</div>
        )}

        {featuredServices.map((service: IServices) => (
          <div
            key={service.id}
            className="w-full h-full sm:min-h-50 min-h-30 rounded-lg bg-card shadow relative hover:scale-104 hover:shadow-md cursor-pointer transition-all duration-300"
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
              className="rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
