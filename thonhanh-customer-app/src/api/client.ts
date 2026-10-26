/**
 * HTTP client gọi backend Node.js của nhóm — nhóm API app khách: /api/customer/...
 * - Tự gắn token (Authorization: Bearer), timeout 15 giây
 * - Quy ước chung: trả JSON trực tiếp, lỗi dạng { message } (câu tiếng Việt), danh sách { items, total, page, pageSize }
 * Địa chỉ máy chủ: src/config/env.ts (tự nhận IP máy chạy Expo, hoặc EXPO_PUBLIC_API_URL, hoặc nhập trong app)
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { serverUrl } from '../config/env';

const TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 60000;

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const apiBase = () => `${serverUrl()}/api`;
export const API_PREFIX = '/customer';

export function setToken(t: string | null) {
  token = t;
}

export function getToken() {
  return token;
}

/** Gọi khi token hết hạn / tài khoản bị khoá (AuthContext đăng ký để tự đăng xuất) */
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorMessage(body: unknown, status: number): string {
  const msg = (body as { message?: unknown } | null)?.message;
  // Vài câu lỗi chung của backend còn tiếng Anh (ErrorHandler dùng chung) -> đổi sang câu dễ hiểu
  if (msg === 'Already exists') return 'Dữ liệu đã tồn tại';
  if (msg === 'Related record not found') return 'Không tìm thấy dữ liệu liên quan';
  if (msg === 'API not found') return 'Máy chủ chưa hỗ trợ chức năng này (kiểm tra phiên bản backend)';
  if (msg === 'Invalid JSON body') return 'Dữ liệu gửi lên không hợp lệ';
  if (typeof msg === 'string' && msg && msg !== 'Internal server error') return msg;
  if (status === 413) return 'Ảnh quá lớn';
  if (status >= 500) return 'Máy chủ đang gặp sự cố, vui lòng thử lại sau';
  if (status === 404) return 'Không tìm thấy dữ liệu';
  return `Lỗi ${status}`;
}

function networkMessage() {
  return `Không kết nối được máy chủ (${serverUrl()}). Kiểm tra backend đang chạy, cùng Wi-Fi, hoặc đổi địa chỉ máy chủ ở màn đăng nhập.`;
}

type Query = Record<string, string | number | boolean | null | undefined>;

async function request<T>(method: string, path: string, body?: unknown, query?: Query, prefix = API_PREFIX): Promise<T> {
  let url = apiBase() + prefix + path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(controller.signal.aborted ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.' : networkMessage(), 0);
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(errorMessage(json, res.status), res.status);
  }
  return json as T;
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Kiểm tra máy chủ: GET /api/health */
export async function pingServer(base: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${base}/api/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// ── Tải ảnh (POST /api/uploads, dùng chung với app thợ) ─────────────────────

/** Ảnh chọn từ máy (expo-image-picker) */
export type LocalImage = { uri: string; mimeType?: string | null; fileName?: string | null; width?: number; height?: number };

/** Cạnh dài tối đa của ảnh gửi lên: đủ rõ để thợ xem hiện trạng, nhẹ để gửi nhanh bằng 4G */
const MAX_SIDE = 1600;

/** Thu nhỏ + nén ảnh trước khi gửi (ảnh camera 5–15 MB vượt giới hạn 8 MB của máy chủ) */
async function shrink(img: LocalImage): Promise<LocalImage> {
  try {
    const ctx = ImageManipulator.manipulate(img.uri);
    const w = img.width ?? 0;
    const h = img.height ?? 0;
    if (w && h && Math.max(w, h) > MAX_SIDE) ctx.resize(w >= h ? { width: MAX_SIDE } : { height: MAX_SIDE });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ compress: 0.72, format: SaveFormat.JPEG });
    return { uri: out.uri, mimeType: 'image/jpeg', fileName: `photo-${Date.now()}.jpg`, width: out.width, height: out.height };
  } catch {
    return img;
  }
}

/**
 * Gửi multipart bằng XMLHttpRequest: từ Expo SDK 54, `fetch` toàn cục là `expo/fetch`, không gửi được
 * tệp dạng { uri } trong FormData. XMLHttpRequest của React Native vẫn đọc tệp từ uri.
 */
export async function uploadImage(original: LocalImage): Promise<string> {
  const img = await shrink(original);
  const form = new FormData();
  form.append('file', { uri: img.uri, name: img.fileName || `photo-${Date.now()}.jpg`, type: img.mimeType || 'image/jpeg' } as unknown as Blob);
  const { status, body } = await new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiBase()}/uploads`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        parsed = null;
      }
      resolve({ status: xhr.status, body: parsed });
    };
    xhr.onerror = () => reject(new ApiError(networkMessage(), 0));
    xhr.ontimeout = () => reject(new ApiError('Mạng chậm, gửi ảnh quá lâu. Thử lại hoặc chọn ảnh khác.', 0));
    xhr.send(form);
  });
  if (status < 200 || status >= 300) {
    if (status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(errorMessage(body, status), status);
  }
  return (body as { url: string }).url;
}

/** Lấy câu báo lỗi để hiện Alert */
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Đã có lỗi xảy ra';
}
