import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="pt-8 md:pt-12">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-6 h-24 w-full rounded-xl" />
      <Skeleton className="mt-4 h-36 w-full rounded-xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
