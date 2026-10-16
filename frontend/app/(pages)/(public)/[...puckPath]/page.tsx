import { notFound } from "next/navigation";
import { ClientPage } from "./client";

interface PageProps {
  params: Promise<{ puckPath?: string[] }>;
}

// Resolve o catch-all para { spaceSlug, slug }
function resolvePath(puckPath?: string[]) {
  if (!puckPath || puckPath.length === 0) {
    return { spaceSlug: null, slug: "home" };
  }
  if (puckPath.length === 1) {
    return { spaceSlug: null, slug: puckPath[0] };
  }
  // Mais de um segmento: primeiro é space, resto é slug
  // Ex: /educacao/nossa-historia → spaceSlug="educacao", slug="nossa-historia"
  return {
    spaceSlug: puckPath[0],
    slug: puckPath.slice(1).join("/"),
  };
}

export default async function Page({ params }: PageProps) {
  const { puckPath } = await params;
  const { spaceSlug, slug } = resolvePath(puckPath);

  // Aqui você tem duas opções:
  // A) Buscar no servidor e renderizar
  // B) Delegar para um client component que usa o hook
  // Vou pela A, porque SSR traz benefícios de SEO

  const res = await fetch(
    spaceSlug
      ? `${process.env.NEXT_PUBLIC_API_URL}/pages/public/${spaceSlug}/${slug}`
      : `${process.env.NEXT_PUBLIC_API_URL}/pages/public/root/${slug}`,
    { next: { revalidate: 60 } }, // ISR: revalida a cada 60s
  );

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Erro ao buscar página");

  const page = await res.json();

  return <ClientPage content={page.content} />;
}
