import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { errMsg } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { SocialButtons } from '../../auth/SocialButtons';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const { register } = useAuth();
  const ui = useOverlay();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e: typeof errors = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Nhập họ tên đầy đủ (như trên CCCD)';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Email không hợp lệ';
    if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!agree) {
      void ui.alert('Chưa đồng ý điều khoản', 'Vui lòng đọc và đồng ý Điều khoản đối tác để tiếp tục.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await register({ full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      ui.toast('Đăng ký thành công! Hãy hoàn thiện hồ sơ để bắt đầu nhận việc');
    } catch (err) {
      void ui.alert('Không đăng ký được', errMsg(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bg={colors.white}>
      <Header title="Đăng ký làm đối tác" subtitle="Miễn phí, chỉ mất khoảng 5 phút" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.steps}>
          {['Tạo tài khoản', 'Gửi hồ sơ', 'Được duyệt', 'Nhận việc'].map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={[styles.stepDot, i === 0 && { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNum, i === 0 && { color: colors.white }]}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
        <TextField label="Họ và tên" icon="account-outline" placeholder="Nguyễn Văn A" value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} autoComplete="name" />
        <TextField
          label="Email"
          icon="email-outline"
          placeholder="ten@email.com"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email}
          hint="Dùng để đăng nhập và nhận mã khi quên mật khẩu"
        />
        <TextField label="Mật khẩu" icon="lock-outline" placeholder="Ít nhất 8 ký tự" value={form.password} onChangeText={set('password')} secure error={errors.password} autoComplete="new-password" />
        <TextField label="Nhập lại mật khẩu" icon="lock-check-outline" placeholder="Nhập lại mật khẩu" value={form.confirm} onChangeText={set('confirm')} secure error={errors.confirm} onSubmitEditing={submit} />

        <Pressable onPress={() => setAgree((v) => !v)} style={styles.agree} hitSlop={6}>
          <Icon name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={agree ? colors.primary : colors.faint} />
          <Text style={styles.agreeText}>
            Tôi đồng ý với <Text style={{ color: colors.primary, fontWeight: '700' }}>Điều khoản đối tác</Text>: cung cấp thông tin trung thực,
            tuân thủ an toàn điện, chịu phí nền tảng 15% mỗi đơn.
          </Text>
        </Pressable>

        <Button title="Tạo tài khoản" onPress={submit} loading={busy} size="lg" />
        <Text style={styles.or}>hoặc đăng ký nhanh bằng</Text>
        <SocialButtons disabled={busy} />
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center', marginTop: 6 }} hitSlop={8}>
          <Text style={styles.footer}>
            Đã có tài khoản? <Text style={{ color: colors.primary, fontWeight: '700' }}>Đăng nhập</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14, paddingBottom: 40 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primaryLight, padding: 12, borderRadius: radius.lg },
  step: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, fontWeight: '800', color: colors.primary },
  stepText: { fontSize: 11, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  agree: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  agreeText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 19 },
  or: { textAlign: 'center', color: colors.faint, fontSize: 13 },
  footer: { fontSize: 14, color: colors.muted },
});
