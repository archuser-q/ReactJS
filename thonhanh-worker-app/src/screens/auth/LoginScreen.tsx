import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { CircuitPattern, FocusStatusBar } from '../../components/Brand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errMsg } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { SocialButtons } from '../../auth/SocialButtons';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useOverlay } from '../../components/Overlay';
import { apiUrl } from '../../config/env';
import type { ScreenProps } from '../../navigation/types';
import { colors, gradients, GRADIENT_PROPS, radius } from '../../theme';

export default function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const { login } = useAuth();
  const ui = useOverlay();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Nhập email (hoặc số điện thoại)';
    if (!password) e.password = 'Nhập mật khẩu';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      void ui.alert('Không đăng nhập được', errMsg(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bg={colors.white} noTopInset>
      <FocusStatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={gradients.primary} {...GRADIENT_PROPS} style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <CircuitPattern />
          <View style={styles.logo}>
            <Icon name="lightning-bolt" size={38} color={colors.navy} />
          </View>
          <Text style={styles.brand}>Thợ Nhanh</Text>
          <Text style={styles.brandSub}>Đối tác thợ điện</Text>
          <Text style={styles.tagline}>Nhận việc sửa điện quanh bạn, biết trước tiền công từng đơn.</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.title}>Đăng nhập</Text>
          <TextField
            label="Email"
            icon="email-outline"
            placeholder="ten@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={errors.email}
            returnKeyType="next"
          />
          <TextField
            label="Mật khẩu"
            icon="lock-outline"
            placeholder="Ít nhất 8 ký tự"
            value={password}
            onChangeText={setPassword}
            secure
            autoComplete="password"
            error={errors.password}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          <Pressable onPress={() => navigation.navigate('ForgotPassword', { email })} style={{ alignSelf: 'flex-end' }} hitSlop={8}>
            <Text style={styles.link}>Quên mật khẩu?</Text>
          </Pressable>
          <Button title="Đăng nhập" onPress={submit} loading={busy} size="lg" />

          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>hoặc</Text>
            <View style={styles.line} />
          </View>
          <SocialButtons disabled={busy} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản đối tác?</Text>
            <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
              <Text style={styles.link}>Đăng ký làm thợ</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('ServerSettings')} style={styles.server} hitSlop={6}>
            <Icon name="server-network" size={13} color={colors.faint} />
            <Text style={styles.serverText} numberOfLines={1}>
              Máy chủ: {apiUrl()}
            </Text>
            <Text style={[styles.serverText, { color: colors.primary, fontWeight: '700' }]}>Đổi</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 44, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.volt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brand: { color: colors.white, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  brandSub: { color: colors.volt, fontSize: 15, fontWeight: '700', marginTop: 2 },
  tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  form: { padding: 24, gap: 14, marginTop: -16, backgroundColor: colors.white, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 },
  link: { color: colors.navy, fontWeight: '700', fontSize: 14, textDecorationLine: 'underline' },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.faint, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 },
  footerText: { color: colors.muted, fontSize: 14 },
  server: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  serverText: { fontSize: 11, color: colors.faint, maxWidth: 260 },
});
