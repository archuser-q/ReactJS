/**
 * Kênh realtime tới backend (Socket.IO).
 * AuthContext gọi connectSocket(token) khi đăng nhập, disconnectSocket() khi đăng xuất.
 * Màn hình nghe sự kiện bằng useSocketEvent — đăng ký được cả trước khi socket kết nối.
 *
 * Sự kiện server đẩy về:
 *   order:updated     { order_id, status }
 *   worker:location   { order_id, lat, lng, updated_at }
 *   message:new       Message
 *   notification:new  AppNotification
 *   connect           (tự phát khi kết nối / kết nối lại — dùng để tải lại dữ liệu bị lỡ)
 */
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { serverUrl } from '../config/env';

type Handler = (payload: any) => void;

let socket: Socket | null = null;
const listeners = new Map<string, Set<Handler>>();

function dispatch(event: string, payload?: unknown) {
  listeners.get(event)?.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      // lỗi ở 1 màn hình không làm hỏng màn khác
    }
  });
}

export function connectSocket(token: string) {
  disconnectSocket();
  socket = io(serverUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  socket.on('connect', () => dispatch('connect'));
  socket.onAny((event: string, payload: unknown) => dispatch(event, payload));
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function isSocketConnected() {
  return !!socket?.connected;
}

/** Nghe 1 sự kiện realtime khi enabled (tự huỷ khi rời màn hình) */
export function useSocketEvent<T = any>(event: string, handler: (payload: T) => void, enabled = true) {
  const saved = useRef(handler);
  saved.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const fn: Handler = (p) => saved.current(p);
    let set = listeners.get(event);
    if (!set) listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }, [event, enabled]);
}
