import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Lưu trữ nhỏ (token, cấu hình): SecureStore trên điện thoại, localStorage trên web. */

function webStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStore()?.getItem(key) ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // bỏ qua: chỉ giữ trong bộ nhớ
  }
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

// "_v2": từ bản 2.0 app gọi backend Node.js (cổng 3000, /api) — bỏ qua token / địa chỉ máy chủ của bản cũ (FastAPI)
export const KEYS = {
  token: 'thonhanh_worker_token_v2',
  apiUrl: 'thonhanh_worker_api_url_v2',
};
