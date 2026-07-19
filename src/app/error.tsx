"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="chapter-heading text-3xl text-ink">Something went wrong</h2>
      <p className="max-w-sm text-[15px] text-stone">
        The page hit an unexpected error. Your memories are safe — try loading it again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-paper shadow-soft"
      >
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </button>
    </div>
  );
}
