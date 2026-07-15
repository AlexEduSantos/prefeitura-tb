import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function Search() {
  return (
    <section className="w-full sm:min-h-36 min-h-14 bg-card relative flex items-center justify-center">
      <div
        className="w-full sm:min-h-36 min-h-14 bg-cover bg-center opacity-80 absolute top-0 z-0"
        style={{ backgroundImage: `url(/bg-search.png)` }}
      />
      <div className="max-w-7xl mx-auto w-full z-10 flex items-center justify-center">
        <span className="relative w-1/2">
          <Input
            placeholder="Pesquisar"
            className="rounded-full border-primary"
          />
          <SearchIcon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
          />
        </span>
      </div>
    </section>
  );
}
