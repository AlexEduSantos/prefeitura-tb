"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Contrast, Search, SearchIcon, X, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { YoutubeIcon } from "../icons/youtube-icon";
import { InstagramIcon } from "../icons/instagram-icon";
import { FacebookIcon } from "../icons/facebook-icon";
import { useMenuOnly } from "@/app/viewmodel/menu.viewmodel";
import { NavigationMenu, NavigationMenuList } from "../ui/navigation-menu";
import { MenuNavItem } from "./menu-nav-item";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";
import Link from "next/link";
import { isExternalLink, resolveMenuItemHref } from "@/lib/menu-utils";
import { MobileHeader } from "./mobile-header";

function DesktopBarTop() {
  const menuId = "a80c8356-9cfc-4998-8b5c-c81f395f6dcd";
  const { menu, isLoadingMenu, isErrorMenu } = useMenuOnly(menuId);

  if (isLoadingMenu) {
    return (
      <div className="w-full flex items-center justify-center h-8 bg-primary text-primary-foreground">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    );
  }

  if (isErrorMenu) {
    return (
      <div className="w-full flex items-center justify-center h-8 bg-primary text-primary-foreground">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <p className="text-white">Erro ao carregar o menu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center h-8 bg-primary text-primary-foreground">
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
        <div className="gap-2 items-center sm:flex flex-row hidden">
          {menu && menu.items.length > 0 && (
            <div className="gap-2 items-center sm:flex flex-row hidden group">
              {[...menu.items]
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const isExternal = isExternalLink(item);
                  const href = resolveMenuItemHref(item);
                  return isExternal ? (
                    <a
                      key={item.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-1 items-center group/item space-x-1"
                    >
                      <p className="hover:font-semibold hover:tracking-widest transition-all">
                        {item.label}
                      </p>
                      <span className="w-px h-4 bg-gray-300 group-last/item:hidden" />
                    </a>
                  ) : (
                    <Link
                      key={item.id}
                      href={href}
                      className="flex gap-1 items-center group/item space-x-1"
                    >
                      <p className="hover:font-semibold hover:tracking-widest transition-all">
                        {item.label}
                      </p>
                      <span className="w-px h-4 bg-gray-300 group-last/item:hidden" />
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
        <div className="gap-2 items-center sm:flex hidden">
          <YoutubeIcon
            onClick={() =>
              window.open(
                "https://www.youtube.com/@PrefeituradeTel%C3%AAmacoBorba",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer"
          />
          <FacebookIcon
            onClick={() =>
              window.open(
                "https://www.facebook.com/PrefeituraTelemacoBorba",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer"
          />
          <InstagramIcon
            onClick={() =>
              window.open(
                "https://www.instagram.com/prefeitura_tb/",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer"
          />
          <span className="w-px h-4 bg-gray-300" />
          <ZoomIn size={16} />
          <ZoomOut size={16} />
          <Contrast size={16} />
          <p>Acessibilidade</p>
        </div>
      </div>
    </div>
  );
}

function DesktopHeader() {
  const [openSearch, setOpenSearch] = useState(false);
  const router = useRouter();
  const menuId = "dec03c06-aa22-4ceb-9dc0-38d445671d68";
  const { menu, isLoadingMenu, isErrorMenu } = useMenuOnly(menuId);

  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    document.body.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setQuery("");
        setOpenSearch(false);
      }
      if (e.key === "Enter") {
        router.push(`/pesquisa?q=${encodeURIComponent(query.trim())}`);
        setOpenSearch(false);
      }
    });

    // Redireciona para a página de pesquisa
    router.push(`/pesquisa?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setOpenSearch(false);
  };

  return (
    <div className="w-full">
      {/* Barra superior */}
      <DesktopBarTop />

      {/* Header principal */}
      <div className="w-full flex items-center justify-center h-36 bg-white shadow">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div
            className="lg:w-1/2 w-1/3 cursor-pointer transition-all duration-500"
            onClick={() => router.push("/")}
          >
            <img src="/logo.png" alt="Prefeitura de Telêmaco Borba" />
          </div>

          <div className="w-1/2 sm:flex hidden gap-4 items-center justify-end text-primary font-semibold relative">
            {isLoadingMenu && (
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            )}

            {isErrorMenu && (
              <p className="text-sm text-destructive">
                Erro ao carregar o menu
              </p>
            )}

            {menu && menu.items.length > 0 && (
              <NavigationMenu>
                <NavigationMenuList>
                  {[...menu.items]
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <MenuNavItem key={item.id} item={item} />
                    ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-transparent"
              aria-label="Buscar"
              onClick={() => setOpenSearch(!openSearch)}
            >
              {openSearch ? (
                <X className="size-5" />
              ) : (
                <Search className="size-5" />
              )}
            </Button>
            <div
              className={`absolute right-0 top-full mt-2 z-15 min-w-80 w-fit max-w-100 bg-card rounded-xl shadow ring-1 ring-border/10 transition-all duration-300 ${
                openSearch
                  ? "opacity-100 visible scale-100"
                  : "opacity-0 invisible scale-95"
              }`}
            >
              <div className="p-2 flex flex-col gap-2">
                <Label
                  htmlFor="search"
                  className="pl-1 text-md font-semibold text-primary"
                >
                  O que você procura?
                </Label>
                <div className="relative w-full h-full">
                  <Input
                    id="search"
                    type="search"
                    placeholder="O que você procura?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="rounded-lg text-sm w-full focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-0 placeholder:font-normal"
                  />
                  <Button
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-5 text-primary"
                    onClick={handleSearch}
                  >
                    <SearchIcon />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function header() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileHeader />;
  }
  return <DesktopHeader />;
}
