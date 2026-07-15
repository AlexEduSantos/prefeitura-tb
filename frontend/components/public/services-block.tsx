import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export function ServicesBlock() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4">
      <div className="w-full flex items-center gap-2">
        <span className="h-5 w-1 bg-primary rounded-full" />
        <h3 className="uppercase text-nowrap tracking-widest text-sm">
          Serviços em Destaque
        </h3>
        <span className="w-full h-px bg-muted-foreground/20 rounded-full" />
        <Button variant="ghost" className="text-xs text-primary text-nowrap">
          Todos os serviços
          <ChevronRight />
        </Button>
      </div>
      <div className="w-full grid grid-cols-3 grid-rows-2 gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="w-full h-full min-h-50 rounded-lg bg-card shadow"
          ></div>
        ))}
      </div>
    </section>
  );
}
