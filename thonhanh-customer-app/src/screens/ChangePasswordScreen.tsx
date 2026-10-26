import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetailHeader, Screen } from '../components/Screen';
import { GradientButton } from '../components/GradientButton';
import { AuthError, AuthField } from '../components/auth/AuthField';
import { PasswordRules } from '../components/auth/PasswordRules';
import { api, errMsg } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useNav } from '../navigation/NavigationContext';
import { colors } from '../theme';
import { PASSWORD_HINT, passwordError } from '../utils/password';

/** Đổi mật khẩu. Tài khoản tạo bằng Google/Facebook chưa có mật khẩu thì đặt mới, không cần mật khẩu cũ. */
export default function ChangePasswordScreen() {
  const { hasPassword, setHasPassword } = useAuth();
  const { goBack } = useNav();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (hasPassword && !oldPw) return setError('Vui lòng nhập mật khẩu hiện tại');
    const pwErr = passwordError(newPw, 'Mật khẩu mới');
    if (pwErr) return setError(pwErr);
    if (newPw !== confirm) return setError('Mật khẩu nhập lại không khớp');
    setLoading(true);
    try {
      const res = await api.changePassword(hasPassword ? oldPw : null, newPw);
      setHasPassword(true);
      Alert.alert('Thành công', res.message, [{ text: 'OK', onPress: goBack }]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title={hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!hasPassword && (
          <Text style={styles.note}>
            Tài khoản của bạn đăng nhập bằng Google/Facebook. Đặt thêm mật khẩu để đăng nhập được bằng email.
          </Text>
        )}
        <View style={styles.card}>
          {hasPassword && <AuthField label="Mật khẩu hiện tại" icon="lock-outline" secure value={oldPw} onChangeText={setOldPw} />}
          <AuthField label="Mật khẩu mới" icon="lock-reset" placeholder={PASSWORD_HINT} secure value={newPw} onChangeText={setNewPw} />
          <PasswordRules value={newPw} />
          <AuthField label="Nhập lại mật khẩu mới" icon="lock-check-outline" secure value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} />
        </View>
        <AuthError text={error} />
        <GradientButton title="Lưu mật khẩu" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16 },
  card: { gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.gray100 },
  note: { fontSize: 12, color: colors.blue700, backgroundColor: colors.blue50, padding: 12, borderRadius: 12, marginBottom: 12, lineHeight: 17 },
});
