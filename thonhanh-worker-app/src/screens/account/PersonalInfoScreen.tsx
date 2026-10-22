import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk } from '../../api';
import { useAuth, useWorkerMe } from '../../auth/AuthContext';
import { Avatar } from '../../components/Bits';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { useUploadImages } from '../../components/Photos';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius } from '../../theme';

const MAX_YEARS = 50;
const yearsText = (y: number) => (y === 0 ? 'Dưới 1 năm' : `${y} năm`);

export default function PersonalInfoScreen({ navigation }: ScreenProps<'PersonalInfo'>) {
  const me = useWorkerMe();
  const { setUser } = useAuth();
  const qc = useQueryClient();
  const ui = useOverlay();
  const upload = useUploadImages();
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '', experience_years: 0, avatar_url: null as string | null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ full_name?: string; phone?: string }>({});

  useEffect(() => {
    if (!me.data) return;
    setForm({
      full_name: me.data.user.full_name,
      phone: me.data.user.phone ?? '',
      bio: me.data.profile.bio ?? '',
      experience_years: me.data.profile.experience_years,
      avatar_url: me.data.user.avatar_url,
    });
  }, [me.data]);

  if (!me.data) {
    return (
      <Screen>
        <Header title="Thông tin cá nhân" />
        <StateView loading={me.isLoading} error={me.error ? errMsg(me.error) : null} onRetry={() => void me.refetch()} />
      </Screen>
    );
  }

  // Chỉ bật nút Lưu khi thực sự có thay đổi
  const dirty =
    form.full_name !== me.data.user.full_name ||
    form.phone !== (me.data.user.phone ?? '') ||
    form.bio !== (me.data.profile.bio ?? '') ||
    form.experience_years !== me.data.profile.experience_years ||
    form.avatar_url !== me.data.user.avatar_url;

  const changeAvatar = async () => {
    const [url] = await upload.run({ title: 'Ảnh đại diện' });
    if (url) setForm((f) => ({ ...f, avatar_url: url }));
  };

  const save = async () => {
    const e: typeof err = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Nhập họ tên đầy đủ';
    const phone = form.phone.replace(/\s|\./g, '');
    if (!/^0\d{9}$/.test(phone)) e.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const res = await api.updateProfile({
        full_name: form.full_name.trim(),
        phone,
        bio: form.bio.trim() || null,
        experience_years: form.experience_years,
        avatar_url: form.avatar_url,
      });
      qc.setQueryData(qk.me, res);
      setUser(res.user);
      ui.toast('Đã lưu thông tin');
      navigation.goBack();
    } catch (ex) {
      void ui.alert('Chưa lưu được', errMsg(ex), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bg={colors.white}>
      <Header title="Thông tin cá nhân" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Pressable onPress={changeAvatar} style={styles.avatarBox}>
          <Avatar name={form.full_name} uri={form.avatar_url} size={84} />
          <View style={styles.camera}>
            <Icon name={upload.uploading ? 'progress-upload' : 'camera'} size={16} color="#fff" />
          </View>
          <Text style={styles.avatarHint}>Ảnh đại diện rõ mặt giúp khách tin tưởng hơn</Text>
        </Pressable>
        <TextField label="Họ và tên (như trên CCCD)" icon="account-outline" value={form.full_name} onChangeText={(t) => setForm((f) => ({ ...f, full_name: t }))} error={err.full_name} />
        <TextField
          label="Số điện thoại liên hệ *"
          icon="phone-outline"
          value={form.phone}
          onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
          keyboardType="phone-pad"
          placeholder="09xxxxxxxx"
          error={err.phone}
          hint="Khách gọi số này khi bạn đang làm đơn của họ"
        />
        <TextField label="Email đăng nhập" icon="email-outline" value={me.data.user.email ?? '(đăng nhập bằng mạng xã hội)'} editable={false} />
        {/* 1 con số chung cho mọi nhóm dịch vụ thợ nhận làm (máy chủ tự áp cho từng nhóm khi ghép đơn) */}
        <View>
          <Text style={styles.label}>Số năm kinh nghiệm làm thợ điện</Text>
          <View style={styles.expRow}>
            <Pressable
              onPress={() => setForm((f) => ({ ...f, experience_years: Math.max(0, f.experience_years - 1) }))}
              style={styles.stepBtn}
              hitSlop={6}
              accessibilityLabel="Bớt 1 năm"
            >
              <Icon name="minus" size={22} color={form.experience_years > 0 ? colors.primary : colors.faint} />
            </Pressable>
            <Text style={styles.expValue}>{yearsText(form.experience_years)}</Text>
            <Pressable
              onPress={() => setForm((f) => ({ ...f, experience_years: Math.min(MAX_YEARS, f.experience_years + 1) }))}
              style={styles.stepBtn}
              hitSlop={6}
              accessibilityLabel="Thêm 1 năm"
            >
              <Icon name="plus" size={22} color={form.experience_years < MAX_YEARS ? colors.primary : colors.faint} />
            </Pressable>
          </View>
          <Text style={styles.hint}>Áp dụng cho mọi nhóm dịch vụ bạn nhận làm. Kinh nghiệm càng lâu càng được ưu tiên khi ghép đơn.</Text>
        </View>
        <TextField
          label="Giới thiệu bản thân"
          icon="text-account"
          value={form.bio}
          onChangeText={(t) => setForm((f) => ({ ...f, bio: t }))}
          multiline
          maxLength={1000}
          placeholder="VD: Thợ điện 8 năm, chuyên sửa chập điện, thay aptomat, lắp đèn trang trí. Làm nhanh, gọn, bảo hành 30 ngày."
        />
        <Button title={dirty ? 'Lưu thông tin' : 'Chưa có thay đổi'} onPress={save} loading={busy} disabled={!dirty} size="lg" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  avatarBox: { alignItems: 'center', gap: 8 },
  camera: { position: 'absolute', top: 58, left: '55%', width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarHint: { fontSize: 12, color: colors.faint },
  label: { fontSize: 13, fontWeight: '700', color: colors.body, marginBottom: 8 },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: 6,
  },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  expValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  hint: { fontSize: 12, color: colors.faint, marginTop: 6, lineHeight: 17 },
});
