import { cn } from "@/lib/utils";

export const inputClass = cn(
  "w-full rounded-lg border border-border bg-card px-4 py-3 text-[15px] text-ink",
  "placeholder:text-stone/60 shadow-soft outline-none transition-colors focus:border-rose",
);

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone">{hint}</p>}
    </div>
  );
}
