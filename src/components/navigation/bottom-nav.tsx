"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { NAV_ITEMS, CREATE_ROUTE, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom navigation.
 * Layout: [Home] [Map] [ + ] [Timeline] [Profile]
 * - Active tab gets a soft blush pill that glides between tabs (layoutId).
 * - Center action is visually raised, matching the "+ New Memory" CTA.
 * - Safe-area aware for notched devices.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-paper/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-[72px] max-w-lg grid-cols-5 items-center px-2">
        {left.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="flex justify-center">
          <Link
            href={CREATE_ROUTE}
            aria-label="New memory"
            className={cn(
              "-mt-7 flex size-14 items-center justify-center rounded-full",
              "bg-ink text-paper shadow-lifted",
              "transition-transform duration-200 ease-out",
              "hover:scale-105 active:scale-95",
            )}
          >
            <Plus className="size-6" strokeWidth={2.25} aria-hidden />
          </Link>
        </div>

        {right.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="group relative flex h-full flex-col items-center justify-center gap-1"
    >
      <span className="relative flex h-8 w-14 items-center justify-center">
        {active && (
          <motion.span
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-full bg-blush"
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            aria-hidden
          />
        )}
        <Icon
          className={cn(
            "relative size-[22px] transition-colors duration-200",
            active
              ? "text-rose-deep"
              : "text-stone group-hover:text-ink",
          )}
          strokeWidth={active ? 2.25 : 2}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "text-[11px] font-medium leading-none transition-colors duration-200",
          active ? "text-ink" : "text-stone",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
