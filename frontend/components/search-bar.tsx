"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Termo inicial (útil para páginas de resultado) */
  initialValue?: string;
  /** Texto de placeholder */
  placeholder?: string;
  /** Classes extras para customizar o container principal (Tailwind) */
  className?: string;
  /** Classes extras para o input */
  inputClassName?: string;
  /** Rota base para onde o usuário será redirecionado. Padrão: "/pesquisa" */
  basePath?: string;
  /**
   * Se true, dispara a navegação enquanto o usuário digita (onChange).
   * Se false, só dispara no Enter ou no clique da lupa.
   */
  searchAsYouType?: boolean;
  /** Callback customizado para interceptar a busca sem navegar (opcional) */
  onSearch?: (term: string) => void;
  /** Callback disparado ao limpar o campo (útil para fechar modais) */
  onClear?: () => void;
}

export function SearchBar({
  initialValue = "",
  placeholder = "O que você procura?",
  className,
  inputClassName,
  basePath = "/pesquisa",
  searchAsYouType = false,
  onSearch,
  onClear,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o estado caso a prop initialValue mude (ex: navegação externa)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Função central que lida com a execução da busca
  const executeSearch = (term: string) => {
    const cleanTerm = term.trim();

    if (onSearch) {
      onSearch(cleanTerm);
      return;
    }

    if (!cleanTerm) {
      router.push(basePath);
    } else {
      router.push(`${basePath}?q=${encodeURIComponent(cleanTerm)}`);
    }
  };

  // Atalhos de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(query);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
    }
  };

  // Ação de limpar o campo
  const handleClear = () => {
    setQuery("");
    if (onClear) onClear();
    if (onSearch) onSearch(""); // Limpa os resultados se estiver em modo controlado
    inputRef.current?.focus(); // Devolve o foco pro input
  };

  // Ação ao digitar
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    if (searchAsYouType) {
      executeSearch(newValue);
    }
  };

  return (
    <div className={cn("relative w-full flex items-center", className)}>
      <Input
        ref={inputRef}
        id="search"
        type="text"
        inputMode="search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "rounded-lg text-sm w-full focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-0 placeholder:font-normal pr-20",
          // ✅ A forma correta e infalível de esconder o X nativo:
          "appearance-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          inputClassName,
        )}
      />

      <div className="absolute right-2 flex items-center gap-1">
        {/* Botão de Limpar (X) - Só aparece se tiver texto */}
        {query.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
            title="Limpar busca"
          >
            <X size={16} />
          </Button>
        )}

        {/* Botão de Buscar (Lupa) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => executeSearch(query)}
          className="h-8 w-8 text-primary hover:bg-primary/10"
          title="Pesquisar"
        >
          <SearchIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
