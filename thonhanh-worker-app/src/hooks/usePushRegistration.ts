/**
 * Đăng ký nhận thông báo đẩy (Expo Push) — để thợ nhận đơn mới cả khi app đang chạy nền.
 * Không chạy trong Expo Go (Expo đã bỏ push trên Expo Go Android từ SDK 53) và trên web.
 * Cần development build + backend bật PUSH_ENABLED=true.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { api } from '../api';
import { isExpoGo } from '../config/env';
import { getItem, removeItem, setItem } from '../utils/storage';

const PUSH_KEY = 'thonhanh_worker_push_token';

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
          await Notifications.setNotificationChannelAsync('offers', {
            name: 'Đơn mới',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 400, 200, 400],
            lightColor: '#2563EB',
          });
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Thông báo chung',
            importance: Notifications.AndroidImportance.DEFAULT,
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
        await setItem(PUSH_KEY, token);
      } catch {
        // Không có push (thiếu projectId / chạy giả lập...) -> app vẫn hỏi đơn định kỳ khi đang mở
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}

export async function unregisterPush() {
  const token = await getItem(PUSH_KEY);
  if (!token) return;
  try {
    await api.removeDevice(token);
  } catch {
    // ignore
  }
  await removeItem(PUSH_KEY);
}
