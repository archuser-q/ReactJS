import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Địa chỉ backend Node.js (cổng 3000). Ưu tiên theo thứ tự (giống app thợ):
 *  1. Người dùng tự nhập trong app (nút "Máy chủ" ở màn đăng nhập) — tiện khi đổi Wi-Fi lúc demo
 *  2. EXPO_PUBLIC_API_URL trong file .env
 *  3. Tự đoán: điện thoại chạy Expo Go -> IP của máy đang chạy Expo (Metro), cổng 3000
 *     (backend và Expo thường chạy chung 1 máy nên không cần sửa .env khi đổi mạng)
 */
export const API_PORT = 3000;
const OVERRIDE_KEY = 'thonhanh_customer_server';
let override: string | null = null;

/** "192.168.1.10:3000" | "http://192.168.1.10:3000/api/customer" -> "http://192.168.1.10:3000" */
export function normalizeServer(url: string): string {
  let u = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  u = u.replace(/\/api(\/(v\d+|customer))?$/i, '');
  if (!/:\d+$/.test(u.replace(/^https?:\/\//i, ''))) u = `${u}:${API_PORT}`;
  return u;
}

export function defaultServerUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return normalizeServer(fromEnv);
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ?? (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${API_PORT}`;
  return `http://10.0.2.2:${API_PORT}`;
}

/** Gốc máy chủ (không có /api) — dùng cho REST, Socket.IO và ảnh /media */
export function serverUrl(): string {
  return override ?? defaultServerUrl();
}

export function isServerOverridden(): boolean {
  return override !== null;
}

/** Đọc địa chỉ đã lưu lúc mở app */
export async function loadServerOverride(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(OVERRIDE_KEY);
    override = saved ? normalizeServer(saved) : null;
  } catch {
    override = null;
  }
}

export async function setServerOverride(url: string | null): Promise<void> {
  override = url ? normalizeServer(url) : null;
  try {
    if (override) await SecureStore.setItemAsync(OVERRIDE_KEY, override);
    else await SecureStore.deleteItemAsync(OVERRIDE_KEY);
  } catch {
    // không lưu được thì chỉ dùng trong phiên này
  }
}

/**
 * Ảnh do backend lưu (/media/...) có thể mang địa chỉ máy chủ lúc tải lên (VD dữ liệu mẫu "localhost:3000",
 * hoặc IP cũ khi máy tính đổi Wi-Fi). Điện thoại không mở được các địa chỉ nội bộ đó, nên đổi phần máy chủ
 * sang máy chủ app đang dùng. Ảnh trên tên miền thật giữ nguyên.
 */
const LOCAL_MEDIA =
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?(?=\/media\/)/i;

export function mediaUri(url: string): string;
export function mediaUri(url: string | null | undefined): string | undefined;
export function mediaUri(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const m = LOCAL_MEDIA.exec(url);
  return m ? serverUrl() + url.slice(m[0].length) : url;
}

/** Đang chạy trong Expo Go (không hỗ trợ push, đăng nhập Google/Facebook native) */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';
