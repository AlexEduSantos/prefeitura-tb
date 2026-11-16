"use client";
import { PainelHeader } from "@/components/painel-header";
import { usePublicServices } from "@/app/viewmodel/services.viewmodel";
import { Input } from "@/components/ui/input";
import { IMetaService, IServices } from "@/app/type/services";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestPage() {
  const {
    services,
    isLoadingServices,
    isErrorServices,
    errorServices,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
  } = usePublicServices();

  if (isLoadingServices) return <Skeleton className="w-full rounded-lg h-10" />;

  if (isErrorServices) return <p>{errorServices?.message}</p>;

  const { services: dataServices, meta: metaServices } = services || {};

  return (
    <div>
      <PainelHeader title="Teste" />
      <div className="p-2 space-y-2">
        <Input
          placeholder="Digite o nome do serviço"
          className="max-w-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {dataServices && dataServices.length > 0 ? (
          dataServices.map((service: IServices) => (
            <div key={service.id}>{service.title}</div>
          ))
        ) : (
          <div className="w-full min-h-30 border flex items-center justify-center text-muted-foreground border-border rounded-lg text-center py-4">
            Nenhum serviço encontrado
          </div>
        )}
        {metaServices && (
          <div className="flex items-end justify-end gap-2 text-sm text-muted-foreground">
            <p>Página: {metaServices.page}</p>
            <p>Total de Itens: {metaServices.total}</p>
            <p>Total de Páginas: {metaServices.totalPages}</p>
          </div>
        )}
      </div>
    </div>
  );
}
