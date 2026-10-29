/**
 * Kênh realtime (Socket.IO) với backend Node — cùng kênh app khách đang dùng.
 *
 * Server đẩy sự kiện vào phòng riêng của thợ ("user:<id>"):
 *   offer:new         { offer_id, order_id, expires_at }  – có lời mời nhận đơn mới
 *   offer:closed      { offer_id, order_id }              – lời mời hết hạn / đơn đã có thợ khác nhận / khách huỷ
 *   order:updated     { order_id, status }                – đơn của mình đổi trạng thái, khách duyệt báo giá, thanh toán...
 *   message:new       Message                             – tin nhắn mới
 *   notification:new  Notification                        – thông báo mới
 * App chỉ dùng sự kiện để tải lại đúng dữ liệu liên quan (TanStack Query); việc hỏi định kỳ vẫn giữ làm dự phòng
 * khi mất kết nối socket, nên mạng chập chờn app vẫn đúng.
 */
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { qk, type WorkerMe } from '../api';
import { useOverlay } from '../components/Overlay';
import { serverUrl } from '../config/env';

type Ids = { order_id?: number };
type NotificationEvent = {
  type?: string;
  title?: string;
  body?: string | null;
  data?: { order_id?: number | string; withdrawal_id?: number | string } | null;
};

let current: Socket | null = null;

export function isRealtimeConnected(): boolean {
  return !!current?.connected;
}

export function useRealtime(token: string | null) {
  const qc = useQueryClient();
  const ui = useOverlay();

  useEffect(() => {
    if (!token) return;
    const socket = io(serverUrl(), {
      auth: { token },
      transports: ['websocket'], // React Native không cần long-polling; nhanh và ít pin hơn
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });
    current = socket;

    const refreshOffer = () => {
      void qc.invalidateQueries({ queryKey: qk.offer });
      void qc.invalidateQueries({ queryKey: qk.home });
    };
    const refreshOrder = (e: Ids) => {
      if (e?.order_id) void qc.invalidateQueries({ queryKey: qk.job(Number(e.order_id)) });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
      void qc.invalidateQueries({ queryKey: qk.home });
    };

    socket.on('offer:new', refreshOffer);
    socket.on('offer:closed', refreshOffer);
    socket.on('order:updated', (e: Ids) => {
      refreshOrder(e);
      void qc.invalidateQueries({ queryKey: qk.wallet });
    });
    socket.on('message:new', (m: Ids) => {
      if (m?.order_id) void qc.invalidateQueries({ queryKey: qk.messages(Number(m.order_id)) });
      refreshOrder(m);
    });
    socket.on('notification:new', (n: NotificationEvent) => {
      void qc.invalidateQueries({ queryKey: qk.unread });
      void qc.invalidateQueries({ queryKey: qk.notifications });
      void qc.invalidateQueries({ queryKey: qk.home });
      // Admin duyệt / từ chối / bỏ duyệt hồ sơ: cập nhật ngay màn giấy tờ, trang chủ (không chờ hỏi định kỳ)
      if (n?.type === 'verification') void qc.invalidateQueries({ queryKey: qk.me });
      // Admin trả lời báo cáo sự cố: màn "Báo cáo đã gửi" hiện ngay kết quả
      if (n?.type === 'complaint') void qc.invalidateQueries({ queryKey: qk.reports });
      if (n?.type === 'payment') {
        void qc.invalidateQueries({ queryKey: qk.wallet });
        void qc.invalidateQueries({ queryKey: qk.walletTx });
        void qc.invalidateQueries({ queryKey: ['earnings'] });
        void qc.invalidateQueries({ queryKey: qk.earningItems });
        // Khách vừa trả tiền 1 đơn (không phải thông báo rút tiền): hiện thông báo nổi ở bất kỳ màn nào
        const orderId = Number(n.data?.order_id);
        if (orderId) {
          void qc.invalidateQueries({ queryKey: qk.job(orderId) });
          ui.toast(n.body || n.title || 'Khách đã thanh toán', 'success');
        } else if (n.data?.withdrawal_id) {
          // Lệnh rút tiền được admin duyệt / từ chối trên web quản trị
          void qc.invalidateQueries({ queryKey: qk.withdrawals });
          // chế độ duyệt tự động: thợ vừa tự rút và đã thấy hộp thoại kết quả, không báo lặp
          const auto = qc.getQueryData<WorkerMe>(qk.me)?.settings.withdrawal_auto_approve;
          if (!auto) {
            const ok = !/từ chối/i.test(n.title ?? '');
            ui.toast([n.title, n.body].filter(Boolean).join(': ') || 'Cập nhật lệnh rút tiền', ok ? 'success' : 'error');
          }
        }
      }
    });
    // Kết nối lại sau khi mất mạng: tải lại phần quan trọng (có thể đã lỡ sự kiện)
    socket.io.on('reconnect', () => {
      refreshOffer();
      void qc.invalidateQueries({ queryKey: ['jobs'] });
      void qc.invalidateQueries({ queryKey: qk.me });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (current === socket) current = null;
    };
  }, [token, qc, ui]);
}
