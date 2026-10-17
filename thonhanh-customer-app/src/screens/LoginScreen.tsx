import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useAuth } from '../auth/AuthContext';
import { SERVER_URL, errMsg } from '../api';
import { GRADIENT, GRADIENT_PROPS, colors, common } from '../theme';

function Field({ icon, ...props }: TextInputProps & { icon: IconName }) {
  return (
    <View style={styles.field}>
      <Icon name={icon} size={18} color={colors.primary} />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.gray400}
        selectionColor={colors.primary}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const submit = async () => {
    const p = phone.replace(/\s/g, '');
    if (!/^0\d{9}$/.test(p)) return setError('Số điện thoại gồm 10 số, bắt đầu bằng 0');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (isRegister && !fullName.trim()) return setError('Vui lòng nhập họ tên');

    setError(null);
    setLoading(true);
    try {
      if (isRegister) await register({ full_name: fullName.trim(), phone: p, password });
      else await login(p, password);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={GRADIENT} {...GRADIENT_PROPS} style={styles.logo}>
            <Icon name="lightning-bolt" size={34} color="#fff" />
          </LinearGradient>
          <Text style={styles.brand}>Thợ Nhanh</Text>
          <Text style={styles.tagline}>Sửa chữa tại nhà, gọi là có thợ</Text>
        </View>

        <Text style={styles.title}>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</Text>

        <View style={{ gap: 12 }}>
          {isRegister && (
            <View>
              <Text style={common.label}>Họ và tên</Text>
              <Field icon="account-outline" placeholder="Nguyễn Văn A" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </View>
          )}
          <View>
            <Text style={common.label}>Số điện thoại</Text>
            <Field icon="phone-outline" placeholder="0912345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={12} />
          </View>
          <View>
            <Text style={common.label}>Mật khẩu</Text>
            <View style={styles.field}>
              <Icon name="lock-outline" size={18} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={colors.gray400}
                selectionColor={colors.primary}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray400} />
              </Pressable>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.error}>
            <Icon name="alert-circle-outline" size={16} color={colors.red500} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GradientButton
          title={isRegister ? 'Đăng ký' : 'Đăng nhập'}
          onPress={submit}
          loading={loading}
          style={{ marginTop: 20 }}
        />

        <Pressable
          onPress={() => {
            setMode(isRegister ? 'login' : 'register');
            setError(null);
          }}
          style={{ alignItems: 'center', marginTop: 16 }}
          hitSlop={8}
        >
          <Text style={{ fontSize: 13, color: colors.gray500 }}>
            {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</Text>
          </Text>
        </Pressable>

        <Text style={styles.server}>Máy chủ: {SERVER_URL}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 32 },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  brand: { fontSize: 22, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 13, color: colors.gray400 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.gray50,
    borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.gray200,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 12 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12,
    borderRadius: 12, backgroundColor: colors.red50,
  },
  errorText: { flex: 1, fontSize: 12, color: colors.red600, lineHeight: 17 },
  server: { fontSize: 10, color: colors.gray300, textAlign: 'center', marginTop: 24 },
});
