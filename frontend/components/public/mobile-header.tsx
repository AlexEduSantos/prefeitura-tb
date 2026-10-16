"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MenuIcon,
  SearchIcon,
  X,
  ChevronDown,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Contrast,
} from "lucide-react";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useMenuOnly } from "@/app/viewmodel/menu.viewmodel";
import { IMenuItem } from "@/app/type/menu";
import { isExternalLink, resolveMenuItemHref } from "@/lib/menu-utils";
import { cn } from "@/lib/utils";

interface MobileMenuItemProps {
  item: IMenuItem;
  depth?: number;
  onNavigate: () => void;
}

function MobileMenuItem({ item, depth = 0, onNavigate }: MobileMenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = !!item.children && item.children.length > 0;
  const href = resolveMenuItemHref(item);
  const isExternal = isExternalLink(item);
  const hasValidDestination = href !== "#" && href !== "/#";

  // Ordena os filhos por order
  const sortedChildren = hasChildren
    ? [...(item.children || [])]
        .filter((child) => child.visible !== false)
        .sort((a, b) => a.order - b.order)
    : [];

  // Se o item não tem filhos (folha)
  if (!hasChildren) {
    const itemClassName = cn(
      "flex items-center justify-between w-full text-left transition-colors break-words whitespace-normal rounded-lg",
      depth === 0
        ? "py-2.5 px-3 text-base font-semibold text-primary hover:bg-primary/5"
        : depth === 1
          ? "py-2 px-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50"
          : "py-1.5 px-2 text-[13px] font-normal text-muted-foreground hover:text-primary hover:bg-muted/40",
    );

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={itemClassName}
        >
          <span className="leading-snug">{item.label}</span>
          <ExternalLink className="size-3.5 text-muted-foreground shrink-0 ml-2 opacity-60" />
        </a>
      );
    }

    return (
      <Link href={href} onClick={onNavigate} className={itemClassName}>
        <span className="leading-snug">{item.label}</span>
      </Link>
    );
  }

  // Item com filhos (dropdown / colapsável)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg transition-colors",
          depth === 0 ? "hover:bg-primary/5" : "hover:bg-muted/50",
          isOpen && (depth === 0 ? "bg-primary/5" : "bg-muted/40"),
        )}
      >
        {/* Label principal do nó pai */}
        {hasValidDestination ? (
          isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              className={cn(
                "flex-1 flex items-center gap-1.5 text-left transition-colors wrap-break-word whitespace-normal",
                depth === 0
                  ? "py-2.5 px-3 text-base font-semibold text-primary hover:text-primary"
                  : depth === 1
                    ? "py-2 px-2.5 text-sm font-medium text-foreground/90 hover:text-primary"
                    : "py-1.5 px-2 text-[13px] font-normal text-muted-foreground hover:text-primary",
              )}
            >
              <span className="leading-snug">{item.label}</span>
              <ExternalLink className="size-3 text-muted-foreground shrink-0 opacity-60 ml-1" />
            </a>
          ) : (
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex-1 text-left transition-colors wrap-break-word whitespace-normal",
                depth === 0
                  ? "py-2.5 px-3 text-base font-semibold text-primary hover:text-primary"
                  : depth === 1
                    ? "py-2 px-2.5 text-sm font-medium text-foreground/90 hover:text-primary"
                    : "py-1.5 px-2 text-[13px] font-normal text-muted-foreground hover:text-primary",
              )}
            >
              <span className="leading-snug">{item.label}</span>
            </Link>
          )
        ) : (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex-1 text-left transition-colors select-none wrap-break-words whitespace-normal cursor-pointer",
                depth === 0
                  ? "py-2.5 px-3 text-base font-semibold text-primary"
                  : depth === 1
                    ? "py-2 px-2.5 text-sm font-medium text-foreground/90"
                    : "py-1.5 px-2 text-[13px] font-normal text-muted-foreground",
              )}
            >
              <span className="leading-snug">{item.label}</span>
            </button>
          </CollapsibleTrigger>
        )}

        {/* Botão de expansão/recolhimento */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="p-2.5 text-muted-foreground hover:text-primary focus:outline-none transition-transform shrink-0 cursor-pointer"
            aria-label={isOpen ? "Recolher submenu" : "Expandir submenu"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isOpen && "rotate-180 text-primary",
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="ml-3 pl-3 border-l border-primary/20 flex flex-col gap-0.5 my-1">
          {sortedChildren.map((child) => (
            <MobileMenuItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MobileHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const menuId = "dec03c06-aa22-4ceb-9dc0-38d445671d68";
  const { menu, isLoadingMenu, isErrorMenu } = useMenuOnly(menuId);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/noticias?busca=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const visibleMenuItems = (menu?.items || [])
    .filter((item) => item.visible !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Faixa decorativa superior */}
      <div className="w-full h-1.5 bg-primary" />

      {/* Barra de cabeçalho principal */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
        {/* Logotipo */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="focus:outline-none max-w-60 text-left cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="Prefeitura de Telêmaco Borba"
            className="h-full w-auto object-contain"
          />
        </button>

        {/* Ações: Busca e Botão do Menu */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
            className="text-primary hover:bg-primary/10 rounded-full"
          >
            {searchOpen ? (
              <X className="size-5" />
            ) : (
              <SearchIcon className="size-5" />
            )}
          </Button>

          {/* Drawer / Sheet Lateral Direita */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="text-primary hover:bg-primary/10 rounded-full"
              >
                <MenuIcon className="size-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm p-0 flex flex-col bg-background h-dvh max-h-screen border-l border-border"
            >
              {/* Cabeçalho do menu lateral */}
              <SheetHeader className="px-6 py-5 border-b border-border bg-muted/20 shrink-0">
                <SheetTitle className="text-xl font-bold text-primary tracking-tight">
                  Navegação
                </SheetTitle>
              </SheetHeader>
              <div className="w-full bg-primary h-fit py-2 flex items-center justify-between px-6 gap-2 text-primary-foreground">
                <ZoomIn size={18} />
                <ZoomOut size={18} />
                <Contrast size={18} />
                <p>Acessibilidade</p>
              </div>

              {/* Área de rolagem para os itens com overflow nativo vertical e horizontal seguro */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3">
                {isLoadingMenu && (
                  <div className="flex flex-col gap-3 p-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                )}

                {isErrorMenu && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-destructive">
                      Não foi possível carregar as opções do menu.
                    </p>
                  </div>
                )}

                {!isLoadingMenu && !isErrorMenu && (
                  <nav className="flex flex-col gap-1 pb-16">
                    {visibleMenuItems.map((item) => (
                      <MobileMenuItem
                        key={item.id}
                        item={item}
                        depth={0}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </nav>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Caixa de Pesquisa Expansível */}
      {searchOpen && (
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-border shadow-md animate-in slide-in-from-top-2 duration-200"
        >
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="O que você procura?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="pr-10 rounded-full text-sm bg-muted/40 border-border focus-visible:ring-primary h-10"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:bg-transparent"
              aria-label="Pesquisar"
            >
              <SearchIcon className="size-4" />
            </Button>
          </div>
        </form>
      )}
    </header>
  );
}
