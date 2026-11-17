"use client";

import { useEffect } from "react";
import { captureFrontendException } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureFrontendException(error, { boundary: "global-error" });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado ao renderizar esta página. Nossa equipe
            foi notificada automaticamente.
          </p>
          <Button onClick={() => reset()} className="cursor-pointer">
            Tentar novamente
          </Button>
        </div>
      </body>
    </html>
  );
}
