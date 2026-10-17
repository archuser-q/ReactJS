import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { errMsg } from '../api';

/**
 * Gọi API khi màn hình mở (và khi deps đổi).
 * reload(true) = tải lại "im lặng" (không hiện loading) — dùng cho polling / kéo để làm mới.
 */
export function useApi<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(
    async (silent = false) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const res = await run();
        if (id === reqId.current) {
          setData(res);
          setError(null);
        }
      } catch (e) {
        if (id === reqId.current && !silent) setError(errMsg(e));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [run],
  );

  /** Dùng cho RefreshControl */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, loading, refreshing, error, reload, refresh };
}

/** Gọi cb mỗi `ms` mili-giây khi enabled (dừng khi rời màn hình) */
export function useInterval(cb: () => void, ms: number, enabled = true) {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => saved.current(), ms);
    return () => clearInterval(t);
  }, [ms, enabled]);
}
