"use client";

import { Toaster as Sonner } from "sonner";

/** App-wide toast host, styled to match the design system. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--ink)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-lifted)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
