import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
  className?: string;
};

/**
 * Calm, directive empty state. An empty screen is an invitation to act,
 * so every instance should tell the person what to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-sand">
        <Icon className="size-7 text-rose" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="max-w-xs space-y-1.5">
        <h2 className="display text-2xl text-ink">{title}</h2>
        <p className="text-[15px] leading-relaxed text-stone">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "mt-2 inline-flex h-11 items-center rounded-full bg-ink px-6",
            "text-[15px] font-medium text-paper shadow-soft",
            "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
