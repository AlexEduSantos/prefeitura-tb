"use client";
import {
  LayoutDashboard,
  FileText,
  Settings,
  PaperclipIcon,
  SquareArrowOutUpLeft,
  TestTube2,
  ImageIcon,
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
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useUserViewModel } from "@/app/viewmodel/user.viewmodel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { title } from "process";

export function PainelSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const { user, isLoadingUser } = useUserViewModel();

  if (isLoadingUser) return <div>Loading...</div>;

  const painelMenu = [
    { title: "Início", icon: LayoutDashboard, href: "/administrator" },
    {
      title: "Artigos",
      icon: FileText,
      href: "/administrator/articles",
      subItems: [
        {
          title: "Novo Artigo",
          href: "/administrator/articles/new",
        },
        {
          title: "Categorias",
          href: "/administrator/articles/categories",
        },
      ],
    },
    {
      title: "Multimídia",
      icon: PaperclipIcon,
      href: "#",
      subItems: [
        {
          title: "Arquivos",
          href: "/administrator/media",
        },
        {
          title: "Galerias",
          href: "/administrator/galleries",
        },
        {
          title: "Pop-ups",
          href: "/administrator/popups",
        },
        {
          title: "Destaques",
          href: "/administrator/stories",
        },
        {
          title: "Serviços",
          href: "/administrator/services",
        },
      ],
    },
    {
      title: "Páginas",
      icon: FileText,
      href: "/administrator/pages",
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "#",
      subItems: [
        {
          title: "Dados da Prefeitura",
          href: "/administrator/settings/information",
        },
        {
          title: "Tema e Cores",
          href: "/administrator/settings/theme",
        },
        {
          title: "Usuários",
          href: "/administrator/settings/users",
        },
      ],
    },
    {
      title: "Relatórios",
      icon: FileText,
      href: "/administrator/reports",
    },
    {
      title: "Página de Teste",
      icon: TestTube2,
      href: "/administrator/test",
    },
  ];

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
          {painelMenu.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/administrator" &&
                pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "h-12 rounded-md transition-all duration-200 group",
                    state === "expanded" ? "px-4" : "justify-center p-0",
                    isActive
                      ? "bg-card! border-primary border text-primary-foreground hover:bg-card/90 shadow-md"
                      : "text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between w-full",
                      state === "expanded" ? "gap-3" : "justify-center gap-0",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          "w-5 h-5 shrink-0",
                          isActive
                            ? "text-primary"
                            : "text-accent-foreground group-hover:text-zinc-900",
                        )}
                      />
                      {state === "expanded" && (
                        <span
                          className={cn(
                            "font-medium truncate",
                            isActive
                              ? "text-primary font-semibold tracking-wider"
                              : "",
                          )}
                        >
                          {item.title}
                        </span>
                      )}
                    </div>
                  </Link>
                </SidebarMenuButton>

                {item.subItems && state === "expanded" && (
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={`${
                              isSubActive
                                ? "bg-transparent! text-primary!"
                                : "hover:bg-muted rounded-sm"
                            }`}
                            isActive={isSubActive}
                          >
                            <Link href={subItem.href}>
                              <span
                                className={`bg-primary rounded-full transition-all duration-200 ${
                                  isSubActive ? "h-1.5 w-1.5" : "h-0 w-0"
                                }`}
                              />
                              {subItem.title}
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
          <SidebarMenuItem key="settings">
            <SidebarMenuButton
              asChild
              tooltip="Settings"
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
                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">
                  {user?.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
