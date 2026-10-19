import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { api, errMsg } from '../../api';
import { Banner } from '../../components/Bits';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';

export default function ForgotPasswordScreen({ navigation, route }: ScreenProps<'ForgotPassword'>) {
  const ui = useOverlay();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      void ui.alert('Email không hợp lệ', 'Nhập email bạn đã dùng để đăng ký.', 'warning');
      return;
    }
    setBusy(true);
    try {
      const res = await api.forgotPassword(email);
      setInfo(res.message);
      setDebugCode(res.debug_code ?? null);
      setStep('code');
    } catch (e) {
      void ui.alert('Chưa gửi được mã', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!/^\d{6}$/.test(code)) return void ui.alert('Mã chưa đúng', 'Mã xác nhận gồm 6 chữ số.', 'warning');
    if (pw.length < 8) return void ui.alert('Mật khẩu quá ngắn', 'Mật khẩu mới tối thiểu 8 ký tự.', 'warning');
    setBusy(true);
    try {
      await api.resetPassword(email, code, pw);
      await ui.alert('Đã đặt lại mật khẩu', 'Hãy đăng nhập bằng mật khẩu mới.', 'success');
      navigation.goBack();
    } catch (e) {
      void ui.alert('Không đặt lại được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bg={colors.white}>
      <Header title="Quên mật khẩu" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.icon}>
          <Icon name={step === 'email' ? 'email-fast-outline' : 'shield-key-outline'} size={34} color={colors.primary} />
        </View>
        {step === 'email' ? (
          <>
            <Text style={styles.text}>Nhập email đăng ký, chúng tôi sẽ gửi mã xác nhận 6 chữ số để bạn đặt mật khẩu mới.</Text>
            <TextField label="Email" icon="email-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ten@email.com" />
            <Button title="Gửi mã xác nhận" onPress={send} loading={busy} size="lg" />
          </>
        ) : (
          <>
            {info ? <Banner text={info} tone="info" /> : null}
            {debugCode ? <Banner tone="warning" icon="bug-outline" text={`Môi trường demo (chưa cấu hình email): mã của bạn là ${debugCode}`} /> : null}
            <TextField label="Mã xác nhận" icon="numeric" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="6 chữ số" maxLength={6} />
            <TextField label="Mật khẩu mới" icon="lock-outline" value={pw} onChangeText={setPw} secure placeholder="Ít nhất 8 ký tự" />
            <Button title="Đặt lại mật khẩu" onPress={reset} loading={busy} size="lg" />
            <Button title="Gửi lại mã" variant="ghost" onPress={send} disabled={busy} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, gap: 16 },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primaryLight, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
