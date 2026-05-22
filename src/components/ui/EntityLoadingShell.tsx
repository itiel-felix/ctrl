"use client";

import { Loader2 } from "lucide-react";

export function EntityLoadingShell({
  loading,
  children,
  className = "",
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#0d1117]/75 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
        >
          <Loader2 className="size-6 animate-spin text-[var(--accent)]" />
        </div>
      )}
    </div>
  );
}
