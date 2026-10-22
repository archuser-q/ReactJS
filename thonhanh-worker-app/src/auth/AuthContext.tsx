import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qk, setOnUnauthorized, setToken, type LoginResult, type User } from '../api';
import { setApiOverride } from '../config/env';
import { getItem, KEYS, removeItem, setItem } from '../utils/storage';
import { unregisterPush } from '../hooks/usePushRegistration';
import { useRealtime } from '../realtime/useRealtime';

type Status = 'booting' | 'guest' | 'authed';

type AuthValue = {
  status: Status;
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithResult: (res: LoginResult) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('booting');
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  // Realtime (Socket.IO) chỉ bật khi đã đăng nhập
  useRealtime(status === 'authed' ? sessionToken : null);

  const clearSession = useCallback(async () => {
    setToken(null);
    setSessionToken(null);
    await removeItem(KEYS.token);
    setUser(null);
    setStatus('guest');
    qc.clear();
  }, [qc]);

  // Mở app: đọc địa chỉ máy chủ + token đã lưu, kiểm tra token còn hạn
  useEffect(() => {
    setOnUnauthorized(() => void clearSession());
    (async () => {
      const savedUrl = await getItem(KEYS.apiUrl);
      if (savedUrl) setApiOverride(savedUrl);
      const saved = await getItem(KEYS.token);
      if (!saved) {
        setStatus('guest');
        return;
      }
      setToken(saved);
      setSessionToken(saved);
      try {
        const me = await api.me();
        if (me.role !== 'worker') throw new Error('not worker');
        setUser(me);
        setStatus('authed');
      } catch {
        await clearSession();
      }
    })();
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  const loginWithResult = useCallback(
    async (res: LoginResult) => {
      if (res.user.role !== 'worker') throw new Error('Đây không phải tài khoản thợ');
      setToken(res.token);
      setSessionToken(res.token);
      await setItem(KEYS.token, res.token);
      qc.clear();
      setUser(res.user);
      setStatus('authed');
    },
    [qc],
  );

  const login = useCallback(
    async (identifier: string, password: string) => loginWithResult(await api.login(identifier, password)),
    [loginWithResult],
  );

  const register = useCallback(
    async (data: { full_name: string; email: string; password: string }) => {
      // Đăng ký xong backend trả luôn token (giống app khách) -> vào app ngay
      await loginWithResult(await api.register(data));
    },
    [loginWithResult],
  );

  const logout = useCallback(async () => {
    // Tắt nhận đơn trước khi thoát để hệ thống không gửi đơn cho máy đã đăng xuất
    try {
      await api.setAvailability(false);
    } catch {
      // bỏ qua
    }
    await unregisterPush();
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ status, user, login, loginWithResult, register, logout, setUser }),
    [status, user, login, loginWithResult, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}

/** Hồ sơ thợ đầy đủ (dùng chung cache cho mọi màn) */
export function useWorkerMe(opts: { poll?: number } = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: api.workerMe,
    enabled: status === 'authed',
    refetchInterval: opts.poll,
  });
}
