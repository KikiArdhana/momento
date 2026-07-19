import { BottomNav } from "@/components/navigation/bottom-nav";

/**
 * Shell for the five main destinations. Pages render inside a
 * mobile-first column; content clears the fixed bottom nav via .pb-nav.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <main className="pb-nav mx-auto w-full max-w-lg px-[var(--gutter)] md:max-w-3xl lg:max-w-5xl">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
