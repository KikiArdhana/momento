"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("momento-theme", next ? "dark" : "light");
    } catch {
      // private mode — theme just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5",
        "text-[15px] font-medium text-ink shadow-soft transition-transform duration-200 active:scale-[0.98]",
      )}
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
