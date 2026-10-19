/**
 * Định vị của thợ:
 * - getCoords(): lấy toạ độ hiện tại (khi bật nhận đơn)
 * - useLocationTracker(active): khi đang nhận đơn / đang làm đơn thì gửi vị trí định kỳ lên server
 *   (để thuật toán ghép đơn biết thợ ở đâu và để khách theo dõi thợ trên bản đồ)
 *
 * Bản web dùng để demo trên máy tính: nếu trình duyệt không lấy được vị trí, thợ có thể
 * chọn "vị trí mô phỏng" trên bản đồ (chỉ có ở bản web).
 */
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';

export type Coords = { latitude: number; longitude: number };

const SEND_EVERY_MS = 15_000;
const HEARTBEAT_MS = 60_000;
const MOVE_METERS = 80;
const DEMO_KEY = 'thonhanh_demo_location';

// ---------- Vị trí mô phỏng (chỉ bản web) ----------

let demo: Coords | null = null;
if (Platform.OS === 'web') {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DEMO_KEY) : null;
    demo = raw ? (JSON.parse(raw) as Coords) : null;
  } catch {
    demo = null;
  }
}

export function getDemoLocation(): Coords | null {
  return demo;
}

export function setDemoLocation(c: Coords | null) {
  demo = c;
  try {
    if (c) window.localStorage.setItem(DEMO_KEY, JSON.stringify(c));
    else window.localStorage.removeItem(DEMO_KEY);
  } catch {
    // ignore
  }
}

// ---------- Lấy toạ độ ----------

export class LocationError extends Error {
  kind: 'denied' | 'unavailable';
  constructor(kind: 'denied' | 'unavailable', msg: string) {
    super(msg);
    this.kind = kind;
  }
}

export async function getCoords(): Promise<Coords> {
  if (Platform.OS === 'web' && demo) return demo;
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new LocationError('denied', 'Bạn chưa cho phép app dùng vị trí');
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12_000)),
    ]);
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    throw new LocationError('unavailable', 'Không lấy được vị trí. Hãy bật GPS/định vị rồi thử lại.');
  }
}

function meters(a: Coords, b: Coords) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Gửi vị trí định kỳ ----------

export function useLocationTracker(active: boolean) {
  const last = useRef<{ at: number; c: Coords } | null>(null);

  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let stopped = false;

    const send = async (c: Coords, force = false) => {
      const prev = last.current;
      const now = Date.now();
      if (!force && prev && now - prev.at < SEND_EVERY_MS && meters(prev.c, c) < MOVE_METERS) return;
      last.current = { at: now, c };
      try {
        await api.updateLocation(c.latitude, c.longitude);
      } catch {
        // mất mạng tạm thời: lần sau gửi lại
      }
    };

    (async () => {
      if (Platform.OS === 'web' && demo) {
        await send(demo, true);
        return;
      }
      const perm = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (!perm?.granted || stopped) return;
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 25 },
          (pos) => void send({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        );
        if (stopped) sub.remove();
      } catch {
        // thiết bị không hỗ trợ theo dõi liên tục -> dựa vào nhịp heartbeat bên dưới
      }
    })();

    // Đứng yên lâu thì GPS không báo vị trí mới -> vẫn gửi lại vị trí cũ để server biết app còn chạy
    const beat = setInterval(async () => {
      if (AppState.currentState !== 'active') return;
      if (Platform.OS === 'web' && demo) return void send(demo, true);
      if (last.current) return void send(last.current.c, true);
      try {
        void send(await getCoords(), true);
      } catch {
        // ignore
      }
    }, HEARTBEAT_MS);

    return () => {
      stopped = true;
      sub?.remove();
      clearInterval(beat);
    };
  }, [active]);
}
