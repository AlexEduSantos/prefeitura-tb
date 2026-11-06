"use client";
import { usePublicServices } from "@/app/viewmodel/services.viewmodel";
import { IServices } from "@/app/type/services";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BlockHeader } from "./block-header";

export function ServicesBlock() {
  const { services, isLoadingServices } = usePublicServices();
  const router = useRouter();

  if (isLoadingServices) return <>Carregando...</>;

  const { services: dataServices, meta: metaServices } = services || {};

  // 6 serviços em destaque ordenados por mais recente
  const featuredServices = dataServices
    .filter((service: IServices) => service.featured)
    .sort((a: IServices, b: IServices) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 xl:px-0">
      {/* Cabeçalho */}
      <BlockHeader
        title="Serviços em Destaque"
        route="/servicos"
        button="Todas os serviços"
      />

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
