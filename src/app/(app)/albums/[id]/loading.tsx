import { Skeleton } from "@/components/ui/skeleton";

export default function AlbumLoading() {
  return (
    <div className="pt-4 md:pt-8">
      <Skeleton className="-mx-[var(--gutter)] aspect-[4/5] rounded-none sm:aspect-[16/10] md:mx-0 md:aspect-[21/10] md:rounded-xl" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-48 flex-1 rounded-xl" />
          <Skeleton className="h-48 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
