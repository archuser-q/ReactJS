import { useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Đơn mà màn Theo dõi / Chat đang hiển thị:
 * - Có orderId (đi từ màn khác sang) -> dùng luôn
 * - Không có (bấm từ tab dưới) -> lấy đơn đang chạy mới nhất; Chat thì cần đơn đã có thợ
 */
export function useCurrentOrderId(navOrderId: number | null, needWorker = false) {
  const [orderId, setOrderId] = useState<number | null>(navOrderId);
  const [resolving, setResolving] = useState(navOrderId === null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (navOrderId !== null) {
      setOrderId(navOrderId);
      setResolving(false);
      return;
    }
    let alive = true;
    setResolving(true);
    setError(null);
    api
      .listOrders({ group: 'active', pageSize: 20 })
      .then((res) => {
        if (!alive) return;
        const found = needWorker ? res.items.find((o) => o.worker) : res.items[0];
        setOrderId(found?.id ?? null);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Lỗi tải đơn'))
      .finally(() => alive && setResolving(false));
    return () => {
      alive = false;
    };
  }, [navOrderId, needWorker, attempt]);

  return { orderId, resolving, error, retry: () => setAttempt((n) => n + 1) };
}
