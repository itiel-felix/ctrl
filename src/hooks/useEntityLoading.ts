"use client";

import { useCallback, useState } from "react";

export function useEntityLoading() {
  const [keys, setKeys] = useState<Set<string>>(() => new Set());

  const start = useCallback((key: string) => {
    setKeys((prev) => new Set(prev).add(key));
  }, []);

  const stop = useCallback((key: string) => {
    setKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const isLoading = useCallback((key: string) => keys.has(key), [keys]);

  const run = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
      start(key);
      try {
        return await fn();
      } finally {
        stop(key);
      }
    },
    [start, stop]
  );

  return { isLoading, run, start, stop };
}

export function entityKey(type: string, id: number | string) {
  return `${type}-${id}`;
}
