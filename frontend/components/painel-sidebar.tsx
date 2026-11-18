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
  GraphHubIcon,
  Code2,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  ClipboardCheck,
  ScrollText,
  Newspaper,
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
import { useProfileViewModel } from "@/app/viewmodel/user.viewmodel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useMenuOnly } from "@/app/viewmodel/menu.viewmodel";
import { useSettings } from "@/app/viewmodel/settings.viewmodel";

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
  GraphHubIcon,
  BookOpen,
  ClipboardCheck,
  ScrollText,
  Newspaper,
};

export function PainelSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const { profile, isLoadingProfile } = useProfileViewModel();

  const menuId = "3792187b-4426-4ff7-a726-a49e70673ed2";
  const { menu, isLoadingMenu, isErrorMenu } = useMenuOnly(menuId);

  const { settings, isLoadingSettings } = useSettings();

  const swaggerDocsUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/docs`;

  if (isLoadingProfile || isLoadingMenu || isLoadingSettings)
    return <div>Loading...</div>;
  if (isErrorMenu || !menu) return <div>Erro ao carregar o menu.</div>;

  const hasLogoUrl = settings?.logoUrl ? settings?.logoUrl : "/logo.png";
  const hasFavicon = settings?.faviconUrl
    ? settings?.faviconUrl
    : "/favicon.png";

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200">
      <SidebarHeader className={` ${state === "collapsed" ? "p-2" : "p-4"}`}>
        <Link
          href="/administrator"
          className="flex items-center justify-center relative h-12 w-full transition-all duration-300"
        >
          <Image
            src={state === "collapsed" ? hasFavicon : hasLogoUrl}
            alt={`Logo - ${settings?.siteName}`}
            fill
            loading="eager"
            unoptimized
            priority
            sizes="(min-width: 1024px) 200px, 48px"
            className="object-contain transition-all duration-300"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-2">
          {menu.items.map((item) => {
            const isActive =
              item.url &&
              (pathname === item.url ||
                (item.url !== "/administrator" &&
                  pathname.startsWith(item.url)));

            const Icon = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : FileText;

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
          {/* Fila de Aprovações */}
          <SidebarMenuItem key="aprovacoes">
            <SidebarMenuButton
              asChild
              tooltip="Fila de Aprovações"
              isActive={pathname === "/administrator/aprovacoes"}
              className={cn(
                "h-12 transition-all duration-200 group",
                state === "expanded" ? "px-4" : "justify-center p-0",
                pathname === "/administrator/aprovacoes"
                  ? "bg-card! border-primary border text-primary-foreground hover:bg-card/90 shadow-md"
                  : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              <Link
                href="/administrator/aprovacoes"
                className={cn(
                  "flex items-center",
                  state === "expanded"
                    ? "w-full gap-3"
                    : "justify-center gap-0",
                )}
              >
                <ClipboardCheck
                  className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === "/administrator/aprovacoes"
                      ? "text-primary"
                      : "text-zinc-500 group-hover:text-zinc-900",
                  )}
                />
                {state === "expanded" && (
                  <span
                    className={cn(
                      "font-medium",
                      pathname === "/administrator/aprovacoes"
                        ? "text-primary font-semibold"
                        : "text-zinc-500 group-hover:text-zinc-900",
                    )}
                  >
                    Fila de Aprovações
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logs de Auditoria */}
          <SidebarMenuItem key="audit-logs">
            <SidebarMenuButton
              asChild
              tooltip="Auditoria e Logs"
              isActive={pathname === "/administrator/logs"}
              className={cn(
                "h-12 transition-all duration-200 group",
                state === "expanded" ? "px-4" : "justify-center p-0",
                pathname === "/administrator/logs"
                  ? "bg-card! border-primary border text-primary-foreground hover:bg-card/90 shadow-md"
                  : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              <Link
                href="/administrator/logs"
                className={cn(
                  "flex items-center",
                  state === "expanded"
                    ? "w-full gap-3"
                    : "justify-center gap-0",
                )}
              >
                <ShieldCheck
                  className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === "/administrator/logs"
                      ? "text-primary"
                      : "text-zinc-500 group-hover:text-zinc-900",
                  )}
                />
                {state === "expanded" && (
                  <span
                    className={cn(
                      "font-medium",
                      pathname === "/administrator/logs"
                        ? "text-primary font-semibold"
                        : "text-zinc-500 group-hover:text-zinc-900",
                    )}
                  >
                    Auditoria e Logs
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Documentação da API (Abre direto em nova aba) */}
          <SidebarMenuItem key="api-docs">
            <SidebarMenuButton
              asChild
              tooltip="Documentação da API (abre em nova aba)"
              className={cn(
                "h-12 transition-all duration-200 group text-zinc-600 hover:bg-zinc-100",
                state === "expanded" ? "px-4" : "justify-center p-0",
              )}
            >
              <a
                href={swaggerDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-between",
                  state === "expanded" ? "w-full gap-3" : "justify-center gap-0",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Code2
                    className={cn(
                      "w-5 h-5 shrink-0",
                      "text-zinc-500 group-hover:text-zinc-900",
                    )}
                  />
                  {state === "expanded" && (
                    <span className="font-medium text-zinc-500 group-hover:text-zinc-900 truncate">
                      Docs da API
                    </span>
                  )}
                </div>
                {state === "expanded" && (
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Visitar Site */}
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
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback>
                  {profile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {state === "expanded" && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {profile?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {profile?.email}
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
