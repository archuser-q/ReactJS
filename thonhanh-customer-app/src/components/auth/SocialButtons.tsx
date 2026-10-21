/**
 * Nút đăng nhập Google / Facebook (expo-auth-session) — cùng cách làm với app thợ.
 * - Client ID lấy từ backend (GET /api/customer/auth/providers): đổi cấu hình không phải build lại app.
 * - App lấy token từ Google/Facebook rồi gửi lên backend; backend tự xác minh lại với Google/Facebook.
 * - Google/Facebook không trả kết quả đăng nhập về được Expo Go (redirect theo scheme riêng của app)
 *   -> trên điện thoại cần development build. Trong Expo Go nút vẫn hiện, bấm sẽ báo lý do.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { api, errMsg, type AuthResult, type ProvidersConfig } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { isExpoGo } from '../../config/env';
import { Icon } from '../Icon';
import { colors } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

function googleIds(cfg: ProvidersConfig['google']) {
  if (!cfg) return null;
  const ids = { web: cfg.web_client_id ?? undefined, android: cfg.android_client_id ?? undefined, ios: cfg.ios_client_id ?? undefined };
  return Platform.select({ ios: ids.ios, android: ids.android, default: ids.web }) ? ids : null;
}

export function SocialButtons({ disabled }: { disabled?: boolean }) {
  const [cfg, setCfg] = useState<ProvidersConfig | null>(null);
  useEffect(() => {
    api.providers().then(setCfg).catch(() => setCfg(null));
  }, []);
  const g = googleIds(cfg?.google ?? null);
  const fb = cfg?.facebook?.app_id ?? null;

  const notReady = (name: string) =>
    Alert.alert(
      `Chưa bật đăng nhập ${name}`,
      isExpoGo
        ? `${name} không trả kết quả đăng nhập về ứng dụng Expo Go được. Hãy dùng bản development build, hoặc đăng nhập bằng email.`
        : `Máy chủ chưa cấu hình đăng nhập ${name} (${name === 'Google' ? 'GOOGLE_*_CLIENT_ID' : 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET'} trong .env của backend).`,
    );

  return (
    <View style={{ gap: 10 }}>
      {g && !isExpoGo ? <GoogleButton ids={g} disabled={disabled} /> : <SocialButton kind="google" dim disabled={disabled} onPress={() => notReady('Google')} />}
      {fb && !isExpoGo ? <FacebookButton appId={fb} disabled={disabled} /> : <SocialButton kind="facebook" dim disabled={disabled} onPress={() => notReady('Facebook')} />}
    </View>
  );
}

function useFinish() {
  const { loginWithResult } = useAuth();
  const [busy, setBusy] = useState(false);
  const finish = async (fn: () => Promise<AuthResult>) => {
    setBusy(true);
    try {
      await loginWithResult(await fn());
    } catch (e) {
      Alert.alert('Không đăng nhập được', errMsg(e));
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
  const { busy, finish } = useFinish();
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
  const { busy, finish } = useFinish();
  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken ?? response.params?.access_token;
    if (token) void finish(() => api.facebook(token));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);
  return <SocialButton kind="facebook" loading={busy} disabled={disabled || !request} onPress={() => void promptAsync()} />;
}

function SocialButton({ kind, onPress, disabled, loading, dim }: { kind: 'google' | 'facebook'; onPress: () => void; disabled?: boolean; loading?: boolean; dim?: boolean }) {
  const fb = kind === 'facebook';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, fb && styles.fb, { opacity: disabled ? 0.5 : pressed ? 0.85 : dim ? 0.8 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={fb ? '#fff' : colors.primary} />
      ) : (
        <>
          <Icon name={fb ? 'facebook' : 'google'} size={20} color={fb ? '#fff' : '#EA4335'} />
          <Text style={[styles.text, fb && { color: '#fff' }]}>Tiếp tục với {fb ? 'Facebook' : 'Google'}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  fb: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  text: { fontSize: 14, fontWeight: '700', color: colors.text },
});
