import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="pt-8 md:pt-12">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-6 h-14 w-full rounded-xl" />
      <Skeleton className="mt-8 h-12 w-full rounded-full" />
      <Skeleton className="mt-10 h-11 w-32" />
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-card shadow-soft">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
