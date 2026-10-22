/**
 * Nút đăng nhập Google / Facebook (expo-auth-session).
 * - Client ID lấy từ backend (GET /auth/providers) nên không phải build lại app khi đổi cấu hình.
 * - App lấy token từ Google/Facebook rồi gửi lên backend; backend tự xác minh lại với Google/Facebook.
 * - Lưu ý: Google/Facebook không trả kết quả đăng nhập về được ứng dụng Expo Go (redirect theo scheme riêng của app)
 *   -> trên điện thoại cần development build; bản web dùng được ngay (xem README).
 */
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { useQuery } from '@tanstack/react-query';
import { api, errMsg, qk, type ProvidersConfig } from '../api';
import { Icon } from '../components/Icon';
import { useOverlay } from '../components/Overlay';
import { isExpoGo } from '../config/env';
import { colors, radius } from '../theme';
import { useAuth } from './AuthContext';

function googleClientFor(cfg: ProvidersConfig['google']): { web?: string; android?: string; ios?: string } | null {
  if (!cfg) return null;
  const pick = { web: cfg.web_client_id ?? undefined, android: cfg.android_client_id ?? undefined, ios: cfg.ios_client_id ?? undefined };
  const need = Platform.select({ ios: pick.ios, android: pick.android, default: pick.web });
  return need ? pick : null;
}

export function SocialButtons({ disabled }: { disabled?: boolean }) {
  const providers = useQuery({ queryKey: qk.providers, queryFn: api.providers, staleTime: 60_000, retry: 0 });
  const ui = useOverlay();
  const g = googleClientFor(providers.data?.google ?? null);
  const fb = providers.data?.facebook?.app_id ?? null;
  const nativeExpoGo = isExpoGo && Platform.OS !== 'web';

  const notReady = (name: string) => {
    const reason =
      nativeExpoGo
        ? `${name} không trả kết quả đăng nhập về ứng dụng Expo Go được. Hãy dùng bản web (Docker) hoặc bản development build, hoặc đăng nhập bằng email.`
        : `Máy chủ chưa cấu hình đăng nhập ${name}. Quản trị viên cần điền ${name === 'Google' ? 'GOOGLE_*_CLIENT_ID' : 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET'} trong file .env của backend (xem README).`;
    void ui.alert(`Chưa bật đăng nhập ${name}`, reason, 'info');
  };

  return (
    <View style={{ gap: 10 }}>
      {g && !nativeExpoGo ? (
        <GoogleButton ids={g} disabled={disabled} />
      ) : (
        <SocialButton kind="google" onPress={() => notReady('Google')} disabled={disabled} dim />
      )}
      {fb && !nativeExpoGo ? <FacebookButton appId={fb} disabled={disabled} /> : <SocialButton kind="facebook" onPress={() => notReady('Facebook')} disabled={disabled} dim />}
    </View>
  );
}

function useSocialFinish() {
  const { loginWithResult } = useAuth();
  const ui = useOverlay();
  const [busy, setBusy] = useState(false);
  const finish = async (fn: () => Promise<Parameters<typeof loginWithResult>[0]>) => {
    setBusy(true);
    try {
      const res = await fn();
      await loginWithResult(res);
      if (res.is_new) ui.toast('Tạo tài khoản thành công, hãy hoàn thiện hồ sơ thợ');
    } catch (e) {
      void ui.alert('Không đăng nhập được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };
  return { busy, finish };
}

function GoogleButton({ ids, disabled }: { ids: { web?: string; android?: string; ios?: string }; disabled?: boolean }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: ids.web,
    androidClientId: ids.android,
    iosClientId: ids.ios,
    selectAccount: true,
  });
  const { busy, finish } = useSocialFinish();

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token ?? response.authentication?.idToken;
    const accessToken = response.authentication?.accessToken ?? response.params?.access_token;
    void finish(() => api.google(idToken ? { id_token: idToken } : { access_token: accessToken }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return <SocialButton kind="google" loading={busy} disabled={disabled || !request} onPress={() => void promptAsync()} />;
}

function FacebookButton({ appId, disabled }: { appId: string; disabled?: boolean }) {
  const [request, response, promptAsync] = Facebook.useAuthRequest({ clientId: appId });
  const { busy, finish } = useSocialFinish();

  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken ?? response.params?.access_token;
    if (token) void finish(() => api.facebook(token));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return <SocialButton kind="facebook" loading={busy} disabled={disabled || !request} onPress={() => void promptAsync()} />;
}

function SocialButton({
  kind,
  onPress,
  disabled,
  loading,
  dim,
}: {
  kind: 'google' | 'facebook';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  dim?: boolean;
}) {
  const fb = kind === 'facebook';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        fb ? { backgroundColor: '#1877F2', borderColor: '#1877F2' } : null,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : dim ? 0.8 : 1 },
      ]}
    >
      <Icon name={fb ? 'facebook' : 'google'} size={20} color={fb ? '#fff' : '#EA4335'} />
      <Text style={[styles.text, fb && { color: '#fff' }]}>
        {loading ? 'Đang đăng nhập...' : `Tiếp tục với ${fb ? 'Facebook' : 'Google'}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: { fontSize: 15, fontWeight: '700', color: colors.text },
});
