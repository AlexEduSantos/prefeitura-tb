"use client";

import {
  LayoutDashboard,
  FileText,
  Settings,
  PaperclipIcon,
  SquareArrowOutUpLeft,
  TestTube2,
  ImageIcon,
  FileChartColumn,
  NavigationIcon,
  LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useUserViewModel } from "@/app/viewmodel/user.viewmodel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useMenuOnly } from "@/app/viewmodel/menu.viewmodel";

// Mapa de ícones: liga a string do banco ao componente real do lucide-react
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Settings,
  PaperclipIcon,
  TestTube2,
  ImageIcon,
  FileChartColumn,
  NavigationIcon,
};

export function PainelSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const { user, isLoadingUser } = useUserViewModel();

  const menuId = "3792187b-4426-4ff7-a726-a49e70673ed2";
  const { menu, isLoadingMenu, isErrorMenu } = useMenuOnly(menuId);

  if (isLoadingUser || isLoadingMenu) return <div>Loading...</div>;
  if (isErrorMenu || !menu) return <div>Erro ao carregar o menu.</div>;

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200">
      <SidebarHeader className={` ${state === "collapsed" ? "p-2" : "p-4"}`}>
        <Link
          href="/administrator"
          className="flex items-center justify-center relative h-12 w-full"
        >
          <Image
            src={state === "collapsed" ? "/favicon.ico" : "/logo.png"}
            alt="Logo - Prefeitura de Telêmaco Borba"
            fill
            loading="eager"
            priority
            sizes="(min-width: 1024px) 200px, 48px"
            className="object-contain transition-all duration-300"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-2">
          {menu.items.map((item) => {
            // Se você quiser validar rotas ativas pelo banco, pode usar item.url
            const isActive =
              item.url &&
              (pathname === item.url ||
                (item.url !== "/administrator" &&
                  pathname.startsWith(item.url)));

            // Pega o ícone do mapa (se não achar, usa um padrão)
            const Icon = item.icon ? ICON_MAP[item.icon] : null;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={!!isActive}
                  className={cn(
                    "h-12 rounded-md transition-all duration-200 group",
                    state === "expanded" ? "px-4" : "justify-center p-0",
                    isActive
                      ? "bg-card! border-primary border text-primary-foreground hover:bg-card/90 shadow-md"
                      : "text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  <Link
                    href={item.url || "#"}
                    className={cn(
                      "flex items-center justify-between w-full",
                      state === "expanded" ? "gap-3" : "justify-center gap-0",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <Icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-accent-foreground group-hover:text-zinc-900",
                          )}
                        />
                      )}
                      {state === "expanded" && (
                        <span
                          className={cn(
                            "font-medium truncate",
                            isActive
                              ? "text-primary font-semibold tracking-wider"
                              : "",
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </SidebarMenuButton>

                {/* Subitens */}
                {item.children &&
                  item.children.length > 0 &&
                  state === "expanded" && (
                    <SidebarMenuSub>
                      {item.children.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.id}>
                            <SidebarMenuSubButton
                              asChild
                              className={`${
                                isSubActive
                                  ? "bg-transparent! text-primary!"
                                  : "hover:bg-muted rounded-sm"
                              }`}
                              isActive={isSubActive}
                            >
                              <Link href={subItem.url || "#"}>
                                <span
                                  className={`bg-primary rounded-full transition-all duration-200 ${
                                    isSubActive ? "h-1.5 w-1.5" : "h-0 w-0"
                                  }`}
                                />
                                {subItem.label}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-4">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem key="visit-site">
            <SidebarMenuButton
              asChild
              tooltip="Visitar Site"
              className={cn(
                "h-12 transition-all duration-200 group",
                state === "expanded" ? "px-4" : "justify-center p-0",
              )}
            >
              <Link
                href="/"
                className={cn(
                  "flex items-center",
                  state === "expanded"
                    ? "w-full gap-3"
                    : "justify-center gap-0",
                )}
              >
                <SquareArrowOutUpLeft
                  className={cn(
                    "w-5 h-5 shrink-0",
                    "text-zinc-500 group-hover:text-zinc-900",
                  )}
                />
                {state === "expanded" && (
                  <span className="text-zinc-500 group-hover:text-zinc-900 font-medium">
                    Visitar Site
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem className="flex gap-2 items-center">
            <SidebarMenuButton
              className={cn(
                "h-12 transition-all duration-200 group",
                state === "expanded" ? "px-4" : "justify-center p-0",
              )}
            >
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              {state === "expanded" && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
