import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon, type IconName } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { api, errMsg, uploadImage } from '../api';
import { pickImages } from '../utils/pickImage';
import { useAuth } from '../auth/AuthContext';
import { fmtDate } from '../utils/format';
import { colors } from '../theme';

export default function PersonalInfoScreen() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const cleanPhone = phone.replace(/[\s.]/g, '');
  const changed =
    fullName.trim() !== user.full_name || (email.trim() || null) !== user.email || (cleanPhone || null) !== user.phone;

  const changeAvatar = async () => {
    const [img] = await pickImages({ max: 1 });
    if (!img) return;
    setUploading(true);
    try {
      const url = await uploadImage(img);
      setUser(await api.updateProfile({ avatar_url: url }));
    } catch (e) {
      Alert.alert('Không đổi được ảnh', errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ và tên không được để trống');
      return;
    }
    if (cleanPhone && !/^0\d{9}$/.test(cleanPhone)) {
      Alert.alert('Số điện thoại chưa đúng', 'Số điện thoại gồm 10 số, bắt đầu bằng 0');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName.trim(), email: email.trim() || null, phone: cleanPhone || null });
      setUser(updated);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (e) {
      Alert.alert('Không cập nhật được', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; icon: IconName; value: string; onChange?: (v: string) => void; keyboard?: 'email-address' | 'phone-pad' }[] = [
    { label: 'Họ và tên', icon: 'account-outline', value: fullName, onChange: setFullName },
    // SĐT để thợ gọi khi tới nơi — bắt buộc trước khi đặt đơn
    { label: 'Số điện thoại', icon: 'phone-outline', value: phone, onChange: setPhone, keyboard: 'phone-pad' },
    { label: 'Email', icon: 'email-outline', value: email, onChange: setEmail, keyboard: 'email-address' },
    { label: 'Ngày tham gia', icon: 'calendar-month-outline', value: fmtDate(user.created_at) },
  ];

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Thông tin cá nhân" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Avatar name={fullName || user.full_name} size={72} uri={user.avatar_url} />
          <Pressable onPress={changeAvatar} disabled={uploading}>
            {uploading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : <Text style={styles.change}>Đổi ảnh đại diện</Text>}
          </Pressable>
        </View>
        <View style={styles.card}>
          {fields.map((f, i) => (
            <View key={f.label} style={[styles.field, i > 0 && styles.divider]}>
              <Icon name={f.icon} size={18} color={colors.gray400} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                {f.onChange ? (
                  <TextInput
                    style={[styles.fieldValue, styles.input]}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder="Chưa có"
                    placeholderTextColor={colors.gray300}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.keyboard ? 'none' : 'words'}
                    selectionColor={colors.primary}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.gray500 }]}>{f.value}</Text>
                )}
              </View>
              {f.onChange && <Icon name="pencil-outline" size={14} color={colors.gray300} />}
            </View>
          ))}
        </View>
        <Pressable
          style={[styles.submit, (!changed || saving) && { opacity: 0.6 }]}
          disabled={!changed || saving}
          onPress={save}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Cập nhật thông tin</Text>}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16 },
  change: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.gray100 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.gray100 },
  fieldLabel: { fontSize: 12, color: colors.gray400 },
  fieldValue: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 2 },
  input: { paddingVertical: 0, paddingHorizontal: 0 },
  submit: { marginTop: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
