"use client";

import Link from "next/link";
import { IMenuItem } from "@/app/type/menu";
import { resolveMenuItemHref, isExternalLink } from "@/lib/menu-utils";
import { ChevronRight } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { useState, useRef, useCallback } from "react";

interface MenuNavItemProps {
  item: IMenuItem;
}

export function MenuNavItem({ item }: MenuNavItemProps) {
  const href = resolveMenuItemHref(item);
  const hasChildren = !!item.children && item.children.length > 0;

  // Item sem filhos: link direto
  if (!hasChildren) {
    const isExternal = isExternalLink(item);
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block select-none p-2! text-base! leading-none no-underline outline-none transition-colors hover:bg-card! hover:text-primary focus:bg-card! text-primary"
            >
              {item.label}
            </a>
          ) : (
            <Link
              href={href}
              className="block select-none p-2! text-base! leading-none no-underline outline-none transition-all hover:bg-card! hover:text-primary focus:bg-card! text-primary"
            >
              {item.label}
            </Link>
          )}
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  // Item com filhos: dropdown
  // Ordena os filhos por `order` (o backend já vem ordenado, mas garantimos aqui)
  const children = [...item.children!].sort((a, b) => a.order - b.order);
  const hasDestination = href !== "#" && href !== "/#"; // tem link real
  const isExternalRoot = isExternalLink(item);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="text-primary text-base font-semibold">
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-65 gap-0.5 p-2">
          {/* Link quando o item pai tem destino próprio */}
          {hasDestination && (
            <li>
              <NavigationMenuLink asChild>
                {isExternalRoot ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block select-none p-2! leading-none no-underline outline-none transition-colors hover:bg-card hover:text-primary focus:bg-card text-primary"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="block select-none p-2! leading-none no-underline outline-none transition-colors hover:bg-card hover:text-primary focus:bg-card text-primary"
                  >
                    {item.label}
                  </Link>
                )}
              </NavigationMenuLink>
            </li>
          )}
          {hasDestination && (
            <li>
              <hr className="border-border my-1" />
            </li>
          )}
          {children.map((child) => (
            <MenuNavChild key={child.id} item={child} />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

/** Helper: renderiza o link/anchor de um item de menu */
function MenuItemLink({
  item,
  href,
  isExternal,
  className,
}: {
  item: IMenuItem;
  href: string;
  isExternal: boolean;
  className: string;
}) {
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {item.label}
    </Link>
  );
}

function MenuNavChild({ item }: { item: IMenuItem }) {
  const href = resolveMenuItemHref(item);
  const isExternal = isExternalLink(item);
  const hasChildren = !!item.children && item.children.length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLLIElement>(null);
  const handleMouseEnter = useCallback(() => {
    // Cancela qualquer timeout de fechamento pendente
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Detecta se o flyout sairia do viewport e inverte a direção
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect && rect.right + 240 > window.innerWidth) {
      setAlignLeft(true);
    } else {
      setAlignLeft(false);
    }
    setIsOpen(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    // Delay de 300ms para o mouse poder atravessar o gap (ml-1) sem fechar
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 300);
  }, []);
  // Subitem com sub-subitens: flyout lateral
  if (hasChildren) {
    const sortedChildren = [...item.children!].sort(
      (a, b) => a.order - b.order,
    );
    const hasDestination = href !== "#";

    return (
      <li
        ref={triggerRef}
        className="relative"
        onMouseEnter={() => {
          setIsOpen(true);
          handleMouseEnter();
        }}
        onMouseLeave={() => {
          setIsOpen(false);
          handleMouseLeave();
        }}
      >
        {/* Trigger do submenu */}
        {hasDestination ? (
          <div
            className={`flex items-center select-none rounded-md font-medium text-xl leading-none no-underline outline-none transition-all hover:bg-transparent hover:text-primary hover:font-bold focus-within:bg-transparent p-0`}
          >
            <NavigationMenuLink asChild>
              <MenuItemLink
                item={item}
                href={href}
                isExternal={isExternal}
                className="flex-1 p-0 no-underline outline-none"
              />
            </NavigationMenuLink>
            <ChevronRight className="size-3.5 mr-2 text-muted-foreground shrink-0" />
          </div>
        ) : (
          <div
            className={`flex items-center select-none rounded-md font-medium text-xl leading-none no-underline outline-none transition-all hover:bg-transparent hover:text-primary hover:font-bold focus:bg-transparent cursor-default`}
          >
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="size-3.5 ml-2 text-muted-foreground shrink-0" />
          </div>
        )}

        {/* Painel flyout lateral — controlado por estado local com delay */}
        {isOpen && (
          <div
            className={`absolute top-0 z-50 ${alignLeft ? "right-full" : "left-full"}`}
          >
            <ul className="min-w-44 rounded-lg bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10 space-y-0.5">
              {sortedChildren.map((child) => (
                <MenuNavChild key={child.id} item={child} />
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  // Subitem sem filhos: link simples
  return (
    <li>
      <NavigationMenuLink asChild>
        <MenuItemLink
          item={item}
          href={href}
          isExternal={isExternal}
          className={`block select-none rounded-md p-2 leading-none font-medium text-lg no-underline outline-none transition-all  hover:bg-transparent hover:text-primary hover:font-bold focus:bg-transparent`}
        />
      </NavigationMenuLink>
    </li>
  );
}
