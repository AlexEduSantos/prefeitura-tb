"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Contrast,
  MenuIcon,
  Search,
  SearchIcon,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { YoutubeIcon } from "../icons/youtube-icon";
import DynamicIcon from "../icons/dynamic-icon";
import { InstagramIcon } from "../icons/instagram-icon";
import { FacebookIcon } from "../icons/facebook-icon";

function MobileHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full sticky top-0 z-50">
      <div className="w-full flex items-center justify-center h-2 bg-primary" />
      <div className="w-full flex items-center justify-between p-4 gap-8 h-fit bg-white/80 shadow backdrop-blur-sm">
        {/* Logo */}
        <div
          className="max-w-2/3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img src="/logo.png" alt="" />
        </div>
        <div className="flex items-center gap-4">
          {/* Botão de busca */}
          <Button
            className={`bg-transparent p-0 m-0 w-fit`}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            {searchOpen ? (
              <X className="size-6 text-primary" />
            ) : (
              <SearchIcon className="size-6 text-primary" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-0 m-0 ">
              <MenuIcon className="size-6 text-primary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  Inicio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/prefeitura")}>
                  Prefeitura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/servicos")}>
                  Serviços
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/servidores")}>
                  Servidores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/noticias")}>
                  Notícias
                </DropdownMenuItem>
                <DropdownMenuItem>Boletim Oficial</DropdownMenuItem>
                <DropdownMenuItem> Transparência</DropdownMenuItem>
                <DropdownMenuItem> Legislação</DropdownMenuItem>
                <DropdownMenuItem> Ouvidoria</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className={`relative mt-2 px-2 ${searchOpen ? "block" : "hidden"}`}>
        <Input
          type="text"
          placeholder="O que você procura?"
          className="rounded-full text-sm"
        />
        <Button
          variant={"ghost"}
          className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-primary"
        >
          <SearchIcon />
        </Button>
      </div>
    </div>
  );
}

function DesktopHeader() {
  const router = useRouter();
  return (
    <div className="w-screen">
      <div className="w-full flex items-center justify-center h-8 bg-primary text-primary-foreground">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <div className="gap-2 items-center sm:flex hidden">
            <p>Boletim Oficial</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Transparência</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Legislação</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Ouvidoria</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> FUNPREV</p>
          </div>
          <div className="gap-2 items-center sm:flex hidden">
            <YoutubeIcon
              onClick={() => {
                window.open(
                  "https://www.youtube.com/@PrefeituradeTel%C3%AAmacoBorba",
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer "
            />
            <FacebookIcon
              onClick={() => {
                window.open(
                  "https://www.facebook.com/PrefeituraTelemacoBorba",
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer "
            />
            <InstagramIcon
              onClick={() => {
                window.open(
                  "https://www.instagram.com/prefeitura_tb/",
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="size-5 text-white hover:scale-110 transition-all duration-300 cursor-pointer "
            />
            <span className="w-px h-4 bg-gray-300" />
            <ZoomIn size={16} />
            <ZoomOut size={16} />
            <Contrast size={16} />
            <p>Acessibilidade</p>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center justify-center h-36 bg-white shadow">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div
            className="w-1/2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <img src="/logo.png" alt="" />
          </div>
          <div className="w-1/2 sm:flex hidden gap-4 items-center justify-end-safe text-primary text-lg font-semibold cursor-pointer">
            <p>Prefeitura</p>
            <p>Serviços</p>
            <p>Servidores</p>
            <p>Notícias</p>
            <Search className="size-5" />
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
