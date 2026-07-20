import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-background h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Pagina não encontrada</h2>
      <p className="text-muted-foreground mb-4">
        Não foi possível encontrar a página solicitada.
      </p>
      <Link href="/">
        <Button>Voltar para a página inicial</Button>
      </Link>
    </div>
  );
}
