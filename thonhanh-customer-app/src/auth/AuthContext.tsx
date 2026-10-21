import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setOnUnauthorized, setToken, type AuthResult, type User } from '../api';
import { loadServerOverride } from '../config/env';
import { connectSocket, disconnectSocket } from '../realtime/socket';
import { unregisterPush } from '../hooks/usePushRegistration';

const TOKEN_KEY = 'thonhanh_token';

type AuthValue = {
  user: User | null;
  /** Tài khoản đã có mật khẩu chưa (đăng nhập Google/Facebook thì chưa) */
  hasPassword: boolean;
  booting: boolean; // đang đọc token đã lưu lúc mở app
  /** identifier = email hoặc số điện thoại */
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; phone: string; password: string }) => Promise<void>;
  /** Dùng cho đăng nhập Google / Facebook */
  loginWithResult: (res: AuthResult) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
  setHasPassword: (v: boolean) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

async function saveToken(t: string | null) {
  setToken(t);
  if (t) connectSocket(t);
  else disconnectSocket();
  try {
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // SecureStore không có trên web -> chỉ giữ token trong bộ nhớ
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [booting, setBooting] = useState(true);

  const logout = useCallback(async () => {
    await unregisterPush();
    await saveToken(null);
    setUserState(null);
  }, []);

  // Mở app: đọc địa chỉ máy chủ + token cũ, gọi /auth/me để kiểm tra còn hạn
  useEffect(() => {
    setOnUnauthorized(() => {
      void saveToken(null).then(() => setUserState(null));
    });
    (async () => {
      try {
        await loadServerOverride();
        const saved = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
        if (saved) {
          setToken(saved);
          const me = await api.me();
          if (me.user.role === 'customer') {
            connectSocket(saved);
            setUserState(me.user);
            setHasPassword(me.has_password);
          } else await saveToken(null);
        }
      } catch {
        await saveToken(null);
      } finally {
        setBooting(false);
      }
    })();
    return () => setOnUnauthorized(null);
  }, []);

  const loginWithResult = useCallback(async (res: AuthResult) => {
    if (res.user.role !== 'customer') {
      throw new Error('Tài khoản này không phải tài khoản khách hàng');
    }
    await saveToken(res.token);
    setUserState(res.user);
    // Tài khoản tạo bằng Google/Facebook chưa có mật khẩu
    api.me().then((me) => setHasPassword(me.has_password)).catch(() => {});
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => loginWithResult(await api.login(identifier, password)),
    [loginWithResult],
  );

  // Đăng ký xong backend trả luôn token -> vào app ngay
  const register = useCallback(
    async (data: { full_name: string; email: string; phone: string; password: string }) =>
      loginWithResult(await api.register(data)),
    [loginWithResult],
  );

  const value = useMemo(
    () => ({ user, hasPassword, booting, login, register, loginWithResult, logout, setUser: setUserState, setHasPassword }),
    [user, hasPassword, booting, login, register, loginWithResult, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
