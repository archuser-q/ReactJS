/**
 * Đăng ký nhận thông báo đẩy (Expo Push) — khách biết ngay khi thợ nhận đơn, đến nơi, gửi báo giá...
 * cả lúc app đang chạy nền. Cách làm giống app thợ.
 * Không chạy trong Expo Go (Expo đã bỏ push trên Expo Go Android từ SDK 53): cần development build
 * và backend bật PUSH_ENABLED=true. Trong Expo Go app vẫn nhận thông báo qua Socket.IO khi đang mở.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api';
import { isExpoGo } from '../config/env';

const PUSH_KEY = 'thonhanh_customer_push_token';

export function usePushRegistration(enabled: boolean) {
  useEffect(() => {
    if (!enabled || isExpoGo || Platform.OS === 'web' || !Device.isDevice) return;
    let cancelled = false;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Thông báo đơn hàng',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }
        const perm = await Notifications.requestPermissionsAsync();
        if (!perm.granted || cancelled) return;
        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (cancelled) return;
        await api.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
        await SecureStore.setItemAsync(PUSH_KEY, token);
      } catch {
        // Không có push (thiếu projectId / máy ảo...) -> app vẫn nhận thông báo qua Socket.IO khi đang mở
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}

/** Gỡ thiết bị khỏi tài khoản khi đăng xuất (để không nhận thông báo của người khác) */
export async function unregisterPush() {
  try {
    const token = await SecureStore.getItemAsync(PUSH_KEY);
    if (!token) return;
    await api.removeDevice(token).catch(() => {});
    await SecureStore.deleteItemAsync(PUSH_KEY);
  } catch {
    // bỏ qua
  }
}
