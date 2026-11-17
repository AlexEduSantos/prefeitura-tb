"use client";
import Link from "next/link";
import { FacebookIcon } from "../icons/facebook-icon";
import { InstagramIcon } from "../icons/instagram-icon";
import { YoutubeIcon } from "../icons/youtube-icon";
import { useRouter } from "next/navigation";
import { useMenuByLocation } from "@/app/viewmodel/menu.viewmodel";
import { isExternalLink, resolveMenuItemHref } from "@/lib/menu-utils";

export function Footer() {
  const router = useRouter();
  const { menu, isLoadingMenu, isErrorMenu } = useMenuByLocation(
    "footer",
    "Rodapé",
  );

  return (
    <footer
      id="main-footer"
      tabIndex={-1}
      className="w-full bg-linear-to-t from-primary to-secondary py-8 space-y-8 outline-none"
    >
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col gap-2 items-center text-center text-primary-foreground">
        <div className="grid grid-cols-1 md:grid-cols-5 items-start gap-8 font-light text-sm pb-8 border-b border-border/30">
          {menu?.items.map((item) => (
            <div
              key={item.id}
              className="text-left w-full col-span-1 space-y-2"
            >
              <h4 className="font-semibold border-b border-white/30 pb-1">
                {item.label}
              </h4>
              {item.children?.map((child) => {
                const isExternal = isExternalLink(child);
                const href = resolveMenuItemHref(child);
                return isExternal ? (
                  <a
                    key={child.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-1 items-center group/item space-x-1"
                  >
                    <p className="hover:font-semibold hover:tracking-widest transition-all">
                      {child.label}
                    </p>
                  </a>
                ) : (
                  <Link
                    key={child.id}
                    href={href}
                    className="flex gap-1 items-center group/item space-x-1"
                  >
                    <p className="hover:font-semibold hover:tracking-widest transition-all">
                      {child.label}
                    </p>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex xl:flex-row flex-col items-center justify-between w-full font-light text-sm gap-2">
          <div className="flex sm:gap-4 gap-2 sm:flex-row flex-col">
            <Link href={"/administrator"}>Painel de Controle</Link>
            <p>Mapa do Site</p>
            <p>Política de Privacidade</p>
          </div>
          <div className="flex items-center gap-4">
            <FacebookIcon className="w-8 h-8 transition-all duration-300 cursor-pointer hover:scale-110" />
            <InstagramIcon className="w-8 h-8 transition-all duration-300 cursor-pointer hover:scale-110" />
            <YoutubeIcon className="w-8 h-8 transition-all duration-300 cursor-pointer hover:scale-110" />
          </div>
        </div>
      </div>
      <div className="w-full flex md:flex-row flex-col items-center justify-center text-primary-foreground">
        <p className="text-xs font-light">
          © 2026 | Praça Horácio Klabin, 34 - Centro - Telêmaco Borba - PR - Cep
          84267-000
        </p>
      </div>
    </footer>
  );
}
