import { Platform } from 'react-native';
import Constants from 'expo-constants';

declare global {
  interface Window {
    __THONHANH_CONFIG__?: { apiUrl?: string };
  }
}

/**
 * Địa chỉ API backend (Node.js, mặc định cổng 3000, tiền tố /api), ưu tiên theo thứ tự:
 *  1. Người dùng tự nhập trong app (màn "Máy chủ") — tiện khi đổi Wi-Fi lúc demo
 *  2. Web chạy bằng Docker: biến API_URL ghi vào /config.js
 *  3. EXPO_PUBLIC_API_URL trong file .env
 *  4. Tự đoán: web -> cùng máy đang mở trang, cổng 3000;
 *     điện thoại chạy Expo Go -> IP của máy chạy Expo (Metro), cổng 3000
 */
export const API_PORT = 3000;
let override: string | null = null;

export function setApiOverride(url: string | null) {
  override = url ? normalize(url) : null;
}

/** "192.168.1.10:3000" -> "http://192.168.1.10:3000/api" (nhận cả địa chỉ đã có /api hoặc /api/v1 của bản cũ) */
export function normalize(url: string): string {
  let u = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  u = u.replace(/\/api(\/v\d+)?$/i, '');
  return `${u}/api`;
}

/** Gốc máy chủ (không có /api) — dùng cho Socket.IO và ảnh /media */
export function serverUrl(): string {
  return apiUrl().replace(/\/api$/, '');
}

export function defaultApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') {
    const runtime = typeof window !== 'undefined' ? window.__THONHANH_CONFIG__?.apiUrl : undefined;
    if (runtime) return normalize(runtime);
    if (fromEnv) return normalize(fromEnv);
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;
    }
    return `http://localhost:${API_PORT}/api`;
  }
  if (fromEnv) return normalize(fromEnv);
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ?? (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${API_PORT}/api`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}/api` : `http://localhost:${API_PORT}/api`;
}

export function apiUrl(): string {
  return override ?? defaultApiUrl();
}

export function isOverridden(): boolean {
  return override !== null;
}

/**
 * Ảnh do backend lưu (đường dẫn /media/...) được ghi kèm địa chỉ máy chủ lúc tải lên — VD dữ liệu mẫu
 * "http://localhost:3000/media/...", ảnh tải lên từ bản web trên máy tính, hay ảnh chụp khi máy tính
 * đang dùng Wi-Fi khác (IP cũ). Điện thoại không mở được các địa chỉ đó, nên đổi phần máy chủ sang
 * máy chủ API app đang dùng. Chỉ áp dụng cho địa chỉ nội bộ (localhost, 127.x, 10.x, 172.16–31.x,
 * 192.168.x); ảnh trên tên miền thật giữ nguyên.
 */
const LOCAL_MEDIA =
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?(?=\/media\/)/i;

export function mediaUri(url: string): string;
export function mediaUri(url: string | null | undefined): string | undefined;
export function mediaUri(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const m = LOCAL_MEDIA.exec(url);
  if (!m) return url;
  return serverUrl() + url.slice(m[0].length);
}

/** Đang chạy trong Expo Go (không hỗ trợ push, đăng nhập Google native...) */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';
export const isWeb = Platform.OS === 'web';

/** Số tổng đài hỗ trợ đối tác (đặt EXPO_PUBLIC_SUPPORT_PHONE khi có số thật; để trống = ẩn nút gọi tổng đài) */
export const SUPPORT_PHONE: string | null = process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || null;
export const SUPPORT_EMAIL: string | null = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || null;
