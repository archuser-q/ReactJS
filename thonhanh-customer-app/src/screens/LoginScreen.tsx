import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { AuthError, AuthField } from '../components/auth/AuthField';
import { SocialButtons } from '../components/auth/SocialButtons';
import { useAuth } from '../auth/AuthContext';
import { api, errMsg, pingServer } from '../api';
import { defaultServerUrl, isServerOverridden, normalizeServer, serverUrl, setServerOverride } from '../config/env';
import { GRADIENT, GRADIENT_PROPS, colors } from '../theme';

type Mode = 'login' | 'register' | 'forgot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={GRADIENT} {...GRADIENT_PROPS} style={styles.logo}>
            <Icon name="lightning-bolt" size={34} color="#fff" />
          </LinearGradient>
          <Text style={styles.brand}>Thợ Nhanh</Text>
          <Text style={styles.tagline}>Thợ điện tận nhà, gọi là có thợ</Text>
        </View>

        {mode === 'forgot' ? <ForgotForm onDone={() => setMode('login')} /> : <SignInForm mode={mode} setMode={setMode} />}

        <ServerSetting />
      </ScrollView>
    </Screen>
  );
}

// ── Đăng nhập / đăng ký ─────────────────────────────────────────────────────

function SignInForm({ mode, setMode }: { mode: 'login' | 'register'; setMode: (m: Mode) => void }) {
  const { login, register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === 'register';

  const submit = async () => {
    setError(null);
    if (isRegister) {
      const p = phone.replace(/[\s.]/g, '');
      if (fullName.trim().length < 2) return setError('Vui lòng nhập họ tên');
      if (!EMAIL_RE.test(email.trim())) return setError('Email không hợp lệ');
      if (!PHONE_RE.test(p)) return setError('Số điện thoại gồm 10 số, bắt đầu bằng 0 (để thợ liên hệ khi đến)');
      if (password.length < 8) return setError('Mật khẩu tối thiểu 8 ký tự');
      setLoading(true);
      try {
        await register({ full_name: fullName.trim(), email: email.trim().toLowerCase(), phone: p, password });
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
      return;
    }
    const id = identifier.trim();
    if (!id || !password) return setError('Vui lòng nhập email/số điện thoại và mật khẩu');
    setLoading(true);
    try {
      await login(id.includes('@') ? id.toLowerCase() : id.replace(/[\s.]/g, ''), password);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</Text>
      <View style={{ gap: 12 }}>
        {isRegister ? (
          <>
            <AuthField label="Họ và tên" icon="account-outline" placeholder="Nguyễn Văn A" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <AuthField label="Email" icon="email-outline" placeholder="ban@email.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <AuthField label="Số điện thoại" icon="phone-outline" placeholder="0912345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={12} />
          </>
        ) : (
          <AuthField
            label="Email hoặc số điện thoại"
            icon="account-outline"
            placeholder="ban@email.com"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />
        )}
        <AuthField
          label="Mật khẩu"
          icon="lock-outline"
          placeholder={isRegister ? 'Tối thiểu 8 ký tự' : 'Mật khẩu'}
          secure
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          returnKeyType="go"
        />
      </View>

      {!isRegister && (
        <Pressable onPress={() => setMode('forgot')} style={{ alignSelf: 'flex-end', marginTop: 10 }} hitSlop={8}>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </Pressable>
      )}

      <AuthError text={error} />
      <GradientButton title={isRegister ? 'Đăng ký' : 'Đăng nhập'} onPress={submit} loading={loading} style={{ marginTop: 20 }} />

      <View style={styles.or}>
        <View style={styles.line} />
        <Text style={styles.orText}>hoặc</Text>
        <View style={styles.line} />
      </View>
      <SocialButtons disabled={loading} />

      <Pressable
        onPress={() => {
          setMode(isRegister ? 'login' : 'register');
          setError(null);
        }}
        style={{ alignItems: 'center', marginTop: 20 }}
        hitSlop={8}
      >
        <Text style={{ fontSize: 13, color: colors.gray500 }}>
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Text style={styles.link}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</Text>
        </Text>
      </Pressable>
    </>
  );
}

// ── Quên mật khẩu: nhận mã 6 số qua email rồi đặt mật khẩu mới ─────────────

function ForgotForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('Email không hợp lệ');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      // Máy chủ chạy thử chưa cấu hình gửi email: backend trả mã về để thử
      if (res.debug_code) {
        setCode(res.debug_code);
        setInfo(`${res.message}\n(Máy chủ thử nghiệm chưa gửi được email — mã của bạn: ${res.debug_code})`);
      } else setInfo(res.message);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError('Mã xác nhận gồm 6 chữ số');
    if (password.length < 8) return setError('Mật khẩu mới tối thiểu 8 ký tự');
    setLoading(true);
    try {
      const res = await api.resetPassword(email.trim().toLowerCase(), code.trim(), password);
      Alert.alert('Thành công', res.message, [{ text: 'Đăng nhập', onPress: onDone }]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <View style={{ gap: 12 }}>
        <AuthField label="Email đã đăng ký" icon="email-outline" placeholder="ban@email.com" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!sent} />
        {sent && (
          <>
            <AuthField label="Mã xác nhận (6 số)" icon="shield-key-outline" placeholder="123456" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            <AuthField label="Mật khẩu mới" icon="lock-outline" placeholder="Tối thiểu 8 ký tự" secure value={password} onChangeText={setPassword} />
          </>
        )}
      </View>
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <AuthError text={error} />
      <GradientButton title={sent ? 'Đặt lại mật khẩu' : 'Gửi mã xác nhận'} onPress={sent ? reset : send} loading={loading} style={{ marginTop: 20 }} />
      {sent && (
        <Pressable onPress={send} disabled={loading} style={{ alignItems: 'center', marginTop: 14 }} hitSlop={8}>
          <Text style={styles.link}>Gửi lại mã</Text>
        </Pressable>
      )}
      <Pressable onPress={onDone} style={{ alignItems: 'center', marginTop: 16 }} hitSlop={8}>
        <Text style={{ fontSize: 13, color: colors.gray500 }}>
          Nhớ mật khẩu rồi? <Text style={styles.link}>Đăng nhập</Text>
        </Text>
      </Pressable>
    </>
  );
}

// ── Địa chỉ máy chủ (khi đổi Wi-Fi, IP máy chạy backend thay đổi) ───────────

function ServerSetting() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(serverUrl());
  const [checking, setChecking] = useState(false);
  const [, force] = useState(0);

  const save = async () => {
    const url = normalizeServer(value);
    setChecking(true);
    const ok = await pingServer(url);
    setChecking(false);
    if (!ok) {
      Alert.alert('Không kết nối được', `Không gọi được ${url}/api/health. Kiểm tra backend đang chạy, cùng Wi-Fi và đã mở cổng 3000.`);
      return;
    }
    await setServerOverride(url === defaultServerUrl() ? null : url);
    setOpen(false);
    force((n) => n + 1);
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={{ marginTop: 24 }} hitSlop={8}>
        <Text style={styles.server}>
          Máy chủ: {serverUrl()}
          {isServerOverridden() ? ' (tự nhập)' : ''} · <Text style={{ color: colors.primary }}>Đổi</Text>
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.serverBox}>
      <Text style={{ fontSize: 12, color: colors.gray500 }}>Địa chỉ máy chạy backend (IP Wi-Fi, cổng 3000)</Text>
      <TextInput
        style={styles.serverInput}
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="192.168.1.10:3000"
        placeholderTextColor={colors.gray400}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={async () => {
            await setServerOverride(null);
            setValue(defaultServerUrl());
            setOpen(false);
          }}
          style={[styles.smallBtn, { borderColor: colors.gray200 }]}
        >
          <Text style={{ fontSize: 13, color: colors.gray600 }}>Tự động</Text>
        </Pressable>
        <Pressable onPress={save} style={[styles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1 }]}>
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>Kiểm tra & lưu</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  brand: { fontSize: 22, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 13, color: colors.gray400 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.gray200 },
  orText: { fontSize: 12, color: colors.gray400 },
  info: { fontSize: 12, color: colors.blue700, backgroundColor: colors.blue50, padding: 12, borderRadius: 12, marginTop: 16, lineHeight: 17 },
  server: { fontSize: 11, color: colors.gray400, textAlign: 'center' },
  serverBox: { marginTop: 24, gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200 },
  serverInput: {
    borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.text, backgroundColor: '#fff',
  },
  smallBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
});
