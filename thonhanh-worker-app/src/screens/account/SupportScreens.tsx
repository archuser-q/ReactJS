/** Trợ giúp, báo cáo sự cố, danh sách báo cáo, đổi mật khẩu */
import { useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk } from '../../api';
import { Banner, Card, Tag } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Chip, MenuItem, MenuSection, TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../config/env';
import { colors, radius } from '../../theme';
import { fmtDateTime, fmtWhenInline, orderCode } from '../../utils/format';

const FAQ = [
  {
    q: 'Làm sao để nhận được nhiều đơn hơn?',
    a: 'Bật nhận đơn và giữ app mở (có GPS). Hệ thống ghép đơn theo khoảng cách, điểm tin cậy, mức giá và số việc đang làm — thợ ở gần, được đánh giá tốt, ít hủy đơn sẽ được ưu tiên.',
  },
  {
    q: 'Lời mời nhận đơn tồn tại bao lâu?',
    a: 'Mỗi lời mời có thời gian đếm ngược (mặc định 60 giây). Hết giờ hoặc bạn bấm "Bỏ qua" thì đơn được chuyển cho thợ khác. Bỏ qua không bị phạt, nhưng tỷ lệ nhận đơn thấp có thể làm giảm ưu tiên.',
  },
  {
    q: 'Phí nền tảng tính thế nào?',
    a: 'Mỗi đơn hoàn thành, nền tảng thu 15% trên tổng tiền khách trả. Khách trả qua MoMo/VNPay: bạn nhận 85% vào ví. Khách trả tiền mặt: bạn giữ toàn bộ tiền, 15% phí được trừ vào ví (ví có thể âm, nạp tiền để bù).',
  },
  {
    q: 'Khi nào được rút tiền?',
    a: 'Bạn rút được khi số dư ví dương, tối thiểu 50.000đ, về tài khoản ngân hàng trùng tên CCCD. Bản demo chuyển ngay; khi chạy thật, yêu cầu được xử lý trong 1 ngày làm việc.',
  },
  {
    q: 'Phát sinh thêm vật tư thì báo giá thế nào?',
    a: 'Trong màn làm việc bấm "Báo giá phát sinh", nhập nội dung và số tiền. Khách đồng ý trên app thì khoản này mới được cộng vào hóa đơn. Không tự ý thu thêm ngoài app.',
  },
  {
    q: 'Vì sao phải chụp ảnh trước/sau khi sửa?',
    a: 'Ảnh là bằng chứng khi có tranh chấp và căn cứ bảo hành. Đơn chỉ hoàn thành được khi có ít nhất 1 ảnh sau khi sửa.',
  },
  {
    q: 'Tôi đến nơi nhưng khách vắng mặt?',
    a: 'Gọi/nhắn khách và chờ tối thiểu 15 phút. Nếu vẫn không liên lạc được, vào "..." ở màn làm việc > Hủy đơn > "Khách không có mặt", rồi gửi Báo cáo sự cố để được hỗ trợ.',
  },
  {
    q: 'Đơn bảo hành là gì?',
    a: 'Mỗi đơn hoàn thành có bảo hành 30 ngày. Nếu sự cố tái diễn, khách gửi yêu cầu bảo hành và bộ phận hỗ trợ sẽ liên hệ bạn để quay lại kiểm tra.',
  },
];

export function HelpScreen({ navigation }: ScreenProps<'Help'>) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen>
      <Header title="Trung tâm trợ giúp" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
        {FAQ.map((f, i) => (
          <Pressable key={f.q} onPress={() => setOpen(open === i ? null : i)} style={styles.faq}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.q}>{f.q}</Text>
              <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={20} color={colors.faint} />
            </View>
            {open === i ? <Text style={styles.a}>{f.a}</Text> : null}
          </Pressable>
        ))}
        <MenuSection title="Liên hệ hỗ trợ đối tác">
          <MenuItem icon="alert-circle-outline" label="Báo cáo sự cố" sub="Gửi thẳng tới bộ phận hỗ trợ, có phản hồi trong app" onPress={() => navigation.navigate('ReportIssue', {})} last={!SUPPORT_PHONE && !SUPPORT_EMAIL} />
          {SUPPORT_PHONE ? (
            <MenuItem icon="phone-outline" label="Gọi tổng đài" sub={SUPPORT_PHONE} onPress={() => void Linking.openURL(`tel:${(SUPPORT_PHONE ?? '').replace(/\s/g, '')}`)} last={!SUPPORT_EMAIL} />
          ) : null}
          {SUPPORT_EMAIL ? (
            <MenuItem icon="email-outline" label="Gửi email" sub={SUPPORT_EMAIL} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} last />
          ) : null}
        </MenuSection>
        <Banner tone="danger" icon="flash-alert-outline" text="An toàn điện là trên hết: luôn ngắt cầu dao, dùng dụng cụ cách điện và từ chối công việc vượt khả năng/thiết bị." />
      </ScrollView>
    </Screen>
  );
}

const REPORT_TYPES = [
  'Khách vắng mặt',
  'Khách không thanh toán',
  'Tranh chấp giá',
  'Khách có hành vi không phù hợp',
  'Sự cố an toàn tại nơi làm việc',
  'Đánh giá không đúng sự thật',
  'Khác',
];

export function ReportIssueScreen({ route, navigation }: ScreenProps<'ReportIssue'>) {
  const qc = useQueryClient();
  const ui = useOverlay();
  const fixed = route.params?.orderId ?? null;
  const [orderId, setOrderId] = useState<number | null>(fixed);
  const preset = route.params?.type;
  const [type, setType] = useState(preset && REPORT_TYPES.includes(preset) ? preset : REPORT_TYPES[0]);
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const recent = useQuery({ queryKey: ['jobs', 'history', 'report'], queryFn: () => api.jobs('history', 1, 10), enabled: !fixed });
  const active = useQuery({ queryKey: ['jobs', 'active', 'report'], queryFn: () => api.jobs('active', 1, 10), enabled: !fixed });
  const jobs = [...(active.data?.items ?? []), ...(recent.data?.items ?? [])];

  const submit = async () => {
    if (!orderId) return void ui.alert('Chọn đơn cần báo cáo', 'Báo cáo được gắn với 1 đơn để bộ phận hỗ trợ kiểm tra.', 'warning');
    setBusy(true);
    try {
      await api.report(orderId, type, desc.trim() || null);
      void qc.invalidateQueries({ queryKey: qk.reports });
      await ui.alert('Đã gửi báo cáo', 'Bộ phận hỗ trợ sẽ liên hệ bạn sớm nhất.', 'success');
      navigation.goBack();
    } catch (e) {
      void ui.alert('Chưa gửi được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Báo cáo sự cố" subtitle={fixed ? orderCode(fixed) : 'Gửi tới bộ phận hỗ trợ'} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!fixed ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Đơn liên quan</Text>
            {jobs.length ? (
              jobs.map((j) => (
                <Pressable key={j.id} onPress={() => setOrderId(j.id)} style={[styles.job, orderId === j.id && styles.jobOn]}>
                  <Icon name={orderId === j.id ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={orderId === j.id ? colors.primary : colors.faint} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>
                      {orderCode(j)}, {j.service_name}
                    </Text>
                    <Text style={styles.jobSub} numberOfLines={1}>
                      {j.customer_name}, {fmtWhenInline(j.completed_at ?? j.accepted_at ?? j.created_at)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.jobSub}>{recent.isLoading ? 'Đang tải...' : 'Bạn chưa có đơn nào. Lỗi ứng dụng hãy chọn "Khác" ở loại sự cố bên trên.'}</Text>
            )}
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Loại sự cố</Text>
          <View style={styles.chips}>
            {REPORT_TYPES.map((t) => (
              <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
            ))}
          </View>
        </View>
        <TextField
          label="Mô tả chi tiết"
          value={desc}
          onChangeText={setDesc}
          multiline
          maxLength={2000}
          placeholder={
            type === 'Đánh giá không đúng sự thật'
              ? 'Nêu rõ điểm nào trong đánh giá chưa đúng. Ảnh trước/sau và tin nhắn trong đơn sẽ được dùng để đối chiếu.'
              : 'Mô tả sự việc, thời gian, những gì bạn đã làm...'
          }
        />
        <Button title="Gửi báo cáo" onPress={submit} loading={busy} size="lg" />
      </ScrollView>
    </Screen>
  );
}

export function ReportsScreen() {
  const q = useQuery({ queryKey: qk.reports, queryFn: () => api.reports(1) });
  const ST = { open: ['Mới gửi', colors.primary], processing: ['Đang xử lý', colors.warning], resolved: ['Đã giải quyết', colors.success], rejected: ['Từ chối', colors.danger] } as const;
  return (
    <Screen>
      <Header title="Báo cáo đã gửi" />
      <FlatList
        data={q.data?.items ?? []}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        renderItem={({ item: r }) => (
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.jobTitle}>{orderCode({ id: r.order_id, code: r.code })}</Text>
              <Tag label={ST[r.status][0]} color={ST[r.status][1]} />
            </View>
            <Text style={styles.a}>{r.reason.replace('[Thợ báo cáo] ', '')}</Text>
            {r.description ? <Text style={styles.jobSub}>{r.description}</Text> : null}
            {r.resolution ? <Banner tone="success" text={`Kết quả: ${r.resolution}`} /> : null}
            <Text style={styles.time}>{fmtDateTime(r.created_at)}</Text>
          </Card>
        )}
        ListEmptyComponent={<StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} empty="Chưa có báo cáo nào" icon="file-document-outline" />}
      />
    </Screen>
  );
}

export function ChangePasswordScreen({ navigation }: ScreenProps<'ChangePassword'>) {
  const ui = useOverlay();
  const [oldPw, setOld] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (pw.length < 8) return void ui.alert('Mật khẩu quá ngắn', 'Tối thiểu 8 ký tự.', 'warning');
    if (pw !== confirm) return void ui.alert('Không khớp', 'Mật khẩu nhập lại không khớp.', 'warning');
    setBusy(true);
    try {
      await api.changePassword(oldPw || null, pw);
      ui.toast('Đã đổi mật khẩu');
      navigation.goBack();
    } catch (e) {
      void ui.alert('Chưa đổi được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Đổi mật khẩu" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <TextField label="Mật khẩu hiện tại" icon="lock-outline" value={oldPw} onChangeText={setOld} secure hint="Đăng nhập bằng Google/Facebook và chưa có mật khẩu thì để trống" />
        <TextField label="Mật khẩu mới" icon="lock-plus-outline" value={pw} onChangeText={setPw} secure />
        <TextField label="Nhập lại mật khẩu mới" icon="lock-check-outline" value={confirm} onChangeText={setConfirm} secure />
        <Button title="Lưu mật khẩu" onPress={save} loading={busy} size="lg" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  faq: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.line },
  q: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  a: { fontSize: 14, color: colors.body, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '700', color: colors.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  job: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  jobOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  jobTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  jobSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  time: { fontSize: 11, color: colors.faint },
});
