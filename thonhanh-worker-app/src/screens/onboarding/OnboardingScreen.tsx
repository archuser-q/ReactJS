import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { CircuitPattern, FocusStatusBar } from '../../components/Brand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMsg, qk } from '../../api';
import { useAuth, useWorkerMe } from '../../auth/AuthContext';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { markOnboardingSkipped } from '../../utils/onboarding';
import { Banner, PulseDot } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Icon, type IconName } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, gradients, GRADIENT_PROPS, op, radius } from '../../theme';
import { fmtDateTime } from '../../utils/format';

const REQUIRED = ['id_card_front', 'id_card_back', 'portrait'] as const;

/**
 * Hoàn thiện hồ sơ để được duyệt. Tự mở sau khi đăng ký (thợ chưa gửi hồ sơ); có nút X để bỏ qua,
 * vào app dùng bình thường và nộp sau (thẻ ở Trang chủ, Hồ sơ → Giấy tờ xác minh). Chưa được duyệt thì
 * chưa bật nhận đơn được. Thông báo kết quả duyệt do RootNavigator lo (dùng chung cho mọi màn).
 */
export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { user } = useAuth();
  const ui = useOverlay();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const me = useWorkerMe({ poll: 15000 });
  const [submitting, setSubmitting] = useState(false);
  useRefetchOnFocus(me.refetch);

  const ob = me.data?.onboarding;

  // Màn này mở trên Trang chủ (goBack) hoặc là màn đầu tiên sau đăng ký (thay bằng Trang chủ)
  const close = () => {
    if (user) void markOnboardingSkipped(user.id);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Main');
  };

  if (!me.data || !ob) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
        <StateView loading={me.isLoading} error={me.error ? errMsg(me.error) : null} onRetry={() => void me.refetch()} />
      </View>
    );
  }

  const docsOk = REQUIRED.every((t) => ob.documents[t] === 'pending' || ob.documents[t] === 'approved');
  const state = me.data.profile.review_state;
  const submitted = state === 'pending';
  const rejected = state === 'rejected';
  const approved = state === 'approved';
  const years = me.data.profile.experience_years;

  const steps: { title: string; sub: string; done: boolean; icon: IconName; go: () => void }[] = [
    {
      title: 'Thông tin cá nhân',
      sub: ob.has_phone
        ? `SĐT ${me.data.user.phone} · ${years ? `${years} năm kinh nghiệm` : 'kinh nghiệm dưới 1 năm'}`
        : 'Thêm số điện thoại và số năm kinh nghiệm',
      done: ob.has_phone,
      icon: 'account-outline',
      go: () => navigation.navigate('PersonalInfo'),
    },
    {
      title: 'Nhóm dịch vụ nhận làm',
      sub: ob.has_skills
        ? `${me.data.skills.map((s) => s.category_name).join(', ')} · bán kính ${me.data.profile.service_radius_km} km`
        : 'Chọn nhóm việc bạn làm được',
      done: ob.has_skills,
      icon: 'lightning-bolt-outline',
      go: () => navigation.navigate('Skills'),
    },
    {
      title: 'Giấy tờ xác minh',
      sub: docsOk ? 'Đã tải đủ CCCD 2 mặt và ảnh chân dung' : 'CCCD 2 mặt, ảnh chân dung, chứng chỉ (nếu có)',
      done: docsOk,
      icon: 'card-account-details-outline',
      go: () => navigation.navigate('Documents'),
    },
  ];

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitVerification();
      qc.setQueryData(qk.me, res);
      void qc.invalidateQueries({ queryKey: qk.home });
      await ui.alert(
        'Đã gửi hồ sơ',
        'Bộ phận xét duyệt sẽ kiểm tra trong 24 giờ làm việc. Trong lúc chờ, bạn vẫn xem được app; có kết quả app sẽ báo ngay.',
        'success',
      );
    } catch (e) {
      void ui.alert('Chưa gửi được', errMsg(e), 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="light" />
      <LinearGradient colors={gradients.primary} {...GRADIENT_PROPS} style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <CircuitPattern />
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Xin chào,</Text>
            <Text style={styles.name}>{user?.full_name}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Help')} style={styles.headBtn} hitSlop={8}>
            <Icon name="help-circle-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={close} style={styles.headBtn} hitSlop={8} accessibilityLabel="Bỏ qua, vào trang chủ">
            <Icon name="close" size={22} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.headTitle}>{approved ? 'Hồ sơ đã được duyệt' : 'Hoàn thiện hồ sơ để bắt đầu nhận việc'}</Text>
        {!approved && !submitted ? (
          <Text style={styles.headSub}>Chưa sẵn sàng? Bấm X để vào app trước, nộp sau ở Hồ sơ → Giấy tờ xác minh.</Text>
        ) : null}
        <View style={styles.progress}>
          {[...steps.map((s) => s.done), submitted || approved].map((d, i) => (
            <View key={i} style={[styles.progressSeg, d && { backgroundColor: '#fff' }]} />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} tintColor={colors.primary} />}
      >
        {approved ? (
          <>
            <Banner tone="success" text="Chúc mừng! Bạn đã là đối tác Thợ Nhanh. Bật nhận đơn ở Trang chủ để bắt đầu nhận việc." />
            <Button title="Vào trang chủ" icon="home-outline" size="lg" onPress={close} />
          </>
        ) : null}
        {submitted ? (
          <View style={styles.waiting}>
            <PulseDot color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.waitTitle}>Hồ sơ đang được xét duyệt</Text>
              <Text style={styles.waitSub}>Đã gửi lúc {fmtDateTime(ob.submitted_at)}. Thường trong 24 giờ làm việc, có kết quả app sẽ báo ngay.</Text>
            </View>
          </View>
        ) : null}
        {rejected ? (
          <Banner tone="danger" text={`${ob.reject_reasons.join('\n') || 'Hồ sơ chưa được duyệt.'}\nCập nhật giấy tờ rồi bấm "Gửi lại hồ sơ".`} />
        ) : null}

        {steps.map((s, i) => (
          <Pressable key={s.title} onPress={s.go} style={({ pressed }) => [styles.step, pressed && { opacity: 0.9 }]}>
            <View style={[styles.stepIcon, { backgroundColor: s.done ? colors.successBg : colors.primaryLight }]}>
              <Icon name={s.done ? 'check-bold' : s.icon} size={20} color={s.done ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Bước {i + 1}. {s.title}
              </Text>
              <Text style={styles.stepSub}>{s.sub}</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.faint} />
          </Pressable>
        ))}

        {ob.missing.length && !submitted && !approved ? (
          <View style={styles.missing}>
            <Text style={styles.missingTitle}>Còn thiếu</Text>
            {ob.missing.map((m) => (
              <View key={m} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Icon name="circle-small" size={18} color={colors.warning} />
                <Text style={styles.missingText}>{m}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!submitted && !approved ? (
          <Button
            title={rejected ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ xét duyệt'}
            icon="send-check-outline"
            size="lg"
            onPress={submit}
            loading={submitting}
            disabled={!ob.can_submit}
          />
        ) : null}
        {submitted ? <Button title="Vào trang chủ" icon="home-outline" variant="secondary" size="lg" onPress={close} /> : null}
        {!submitted && !approved ? (
          <Button title="Để sau, vào app trước" variant="ghost" onPress={close} />
        ) : null}

        <Text style={styles.howTitle}>Làm việc với Thợ Nhanh thế nào?</Text>
        <View style={styles.how}>
          {[
            ['toggle-switch-outline', 'Bật nhận đơn', 'App gửi vị trí để hệ thống ghép đơn gần bạn'],
            ['bell-ring-outline', 'Nhận lời mời', 'Xem việc, khoảng cách, thu nhập rồi bấm Nhận'],
            ['motorbike', 'Đến & sửa chữa', 'Cập nhật tiến độ, chụp ảnh trước/sau'],
            ['cash-multiple', 'Nhận tiền', 'Khách trả qua MoMo / VNPay, tiền vào ví, rút về ngân hàng'],
          ].map(([icon, t, d]) => (
            <View key={t} style={styles.howItem}>
              <View style={[styles.howIcon, { backgroundColor: op(colors.primary, 0.1) }]}>
                <Icon name={icon as IconName} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howT}>{t}</Text>
                <Text style={styles.howD}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hello: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16 },
  headSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  progress: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  waiting: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.warningBg, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.warningSoft },
  waitTitle: { fontSize: 15, fontWeight: '800', color: colors.warning },
  waitSub: { fontSize: 13, color: colors.body, marginTop: 2, lineHeight: 18 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  stepIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  missing: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 2 },
  missingTitle: { fontSize: 13, fontWeight: '800', color: colors.warning, marginBottom: 4 },
  missingText: { fontSize: 13, color: colors.body },
  howTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  how: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 14 },
  howItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  howIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  howT: { fontSize: 14, fontWeight: '700', color: colors.text },
  howD: { fontSize: 12, color: colors.muted, marginTop: 1 },
});
