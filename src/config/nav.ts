import { Home, Map, BookOpen, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * The four flat tabs. The center "New Memory" action is rendered
 * separately by BottomNav because it is an action, not a destination tab.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/timeline", label: "Timeline", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export const CREATE_ROUTE = "/create";
