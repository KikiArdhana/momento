import { Skeleton } from "@/components/ui/skeleton";

export default function TimelineLoading() {
  return (
    <div className="pt-8 md:pt-12">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-10 h-11 w-28" />
      <div className="mt-6 space-y-6 border-l-2 border-blush pl-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
