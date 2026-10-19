import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk, type DocType, type WorkerDocument } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Banner, Tag } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Icon, type IconName } from '../../components/Icon';
import { mediaUri } from '../../config/env';
import { useOverlay } from '../../components/Overlay';
import { useUploadImages } from '../../components/Photos';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { fmtDateTime } from '../../utils/format';

const REQUIRED: { type: DocType; label: string; guide: string; icon: IconName }[] = [
  { type: 'id_card_front', label: 'CCCD mặt trước', guide: 'Chụp thẳng, đủ 4 góc, không lóa sáng', icon: 'card-account-details-outline' },
  { type: 'id_card_back', label: 'CCCD mặt sau', guide: 'Thấy rõ chip và mã QR', icon: 'card-bulleted-outline' },
  { type: 'portrait', label: 'Ảnh chân dung', guide: 'Rõ mặt, không đeo kính râm/khẩu trang', icon: 'face-recognition' },
];

/** Khớp MAX_CERTIFICATES của backend */
const MAX_CERTS = 5;

const STATUS = {
  approved: { label: 'Hợp lệ', color: colors.success, icon: 'check-circle' as IconName },
  pending: { label: 'Chờ duyệt', color: colors.warning, icon: 'clock-outline' as IconName },
  rejected: { label: 'Bị từ chối', color: colors.danger, icon: 'close-circle' as IconName },
};

export default function DocumentsScreen({ navigation }: ScreenProps<'Documents'>) {
  const me = useWorkerMe();
  const qc = useQueryClient();
  const ui = useOverlay();
  const upload = useUploadImages();
  const [busyType, setBusyType] = useState<DocType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!me.data) {
    return (
      <Screen>
        <Header title="Giấy tờ xác minh" />
        <StateView loading={me.isLoading} error={me.error ? errMsg(me.error) : null} onRetry={() => void me.refetch()} />
      </Screen>
    );
  }
  const docs = me.data.documents; // máy chủ trả mới -> cũ
  const ob = me.data.onboarding;
  const approved = me.data.profile.verification_status === 'approved';
  const certs = docs.filter((d) => d.doc_type === 'certificate');
  const certSlots = certs.filter((c) => c.status !== 'rejected').length;

  /**
   * Mỗi loại giấy tờ bắt buộc:
   *  - current: bản đã duyệt mới nhất (đang có hiệu lực)
   *  - update : bản gửi sau bản đã duyệt mà chưa duyệt (chờ duyệt / bị từ chối) -> ảnh cũ vẫn dùng tới khi bản này được duyệt
   *  - chưa có bản duyệt nào (đang làm hồ sơ): dùng bản mới nhất như trước
   */
  const slot = (t: DocType) => {
    const all = docs.filter((d) => d.doc_type === t);
    const current = all.find((d) => d.status === 'approved') ?? null;
    const latest = all[0] ?? null;
    const update = current && latest && latest.id !== current.id && latest.status !== 'approved' ? latest : null;
    return { current, update, latest };
  };

  const add = async (t: DocType, title: string, replacing = false) => {
    setBusyType(t);
    try {
      const [url] = await upload.run({ title });
      if (!url) return;
      await api.addDocument(t, url);
      await qc.invalidateQueries({ queryKey: qk.me });
      ui.toast(replacing ? 'Đã gửi ảnh mới, ảnh cũ vẫn dùng đến khi được duyệt' : 'Đã tải lên, chờ duyệt');
    } catch (e) {
      void ui.alert('Chưa tải lên được', errMsg(e), 'danger');
    } finally {
      setBusyType(null);
    }
  };

  const remove = async (d: WorkerDocument, title: string, message?: string) => {
    if (!(await ui.confirm({ title, message, tone: 'danger', confirmText: 'Gỡ ảnh' }))) return;
    try {
      await api.deleteDocument(d.id);
      await qc.invalidateQueries({ queryKey: qk.me });
      ui.toast('Đã gỡ ảnh', 'info');
    } catch (e) {
      void ui.alert('Chưa gỡ được', errMsg(e), 'danger');
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      qc.setQueryData(qk.me, await api.submitVerification());
      await ui.alert('Đã gửi hồ sơ', 'Bạn sẽ nhận thông báo khi có kết quả xét duyệt.', 'success');
      navigation.goBack();
    } catch (e) {
      void ui.alert('Chưa gửi được', errMsg(e), 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="Giấy tờ xác minh" subtitle={approved ? 'Hồ sơ đã được duyệt' : 'Bắt buộc để được nhận việc'} />
      <ScrollView contentContainerStyle={styles.body}>
        {approved ? (
          <Banner
            icon="shield-sync-outline"
            text="Giấy tờ thay đổi (VD làm lại CCCD) thì gửi ảnh mới. Ảnh cũ vẫn có hiệu lực đến khi quản trị viên duyệt ảnh mới, bạn vẫn nhận việc bình thường."
          />
        ) : (
          <Banner icon="shield-lock-outline" text="Giấy tờ chỉ dùng để xác minh danh tính và được bảo mật. Khách hàng không xem được ảnh CCCD của bạn." />
        )}
        {!approved && ob.reject_reasons.length ? <Banner tone="danger" text={ob.reject_reasons.join('\n')} /> : null}

        {REQUIRED.map((r) => {
          const { current, update, latest } = slot(r.type);
          const shown = current ?? latest;
          const st = shown ? STATUS[shown.status] : null;
          return (
            <View key={r.type} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.icon}>
                  <Icon name={r.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{r.label}</Text>
                  <Text style={styles.guide}>{r.guide}</Text>
                </View>
                {st ? <Tag label={st.label} color={st.color} icon={st.icon} /> : <Tag label="Chưa có" color={colors.faint} />}
              </View>
              {shown ? (
                <Pressable onPress={() => ui.viewImage(shown.file_url)}>
                  <Image source={{ uri: mediaUri(shown.file_url) }} style={styles.preview} resizeMode="cover" />
                </Pressable>
              ) : null}
              {shown ? <Text style={styles.meta}>Tải lên {fmtDateTime(shown.created_at)} · bấm ảnh để xem rõ</Text> : null}

              {current ? (
                update ? (
                  // Đang có bản cập nhật chờ duyệt / bị từ chối
                  <View style={[styles.update, update.status === 'rejected' && styles.updateRejected]}>
                    <Pressable onPress={() => ui.viewImage(update.file_url)}>
                      <Image source={{ uri: mediaUri(update.file_url) }} style={styles.updateImg} />
                    </Pressable>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.updateTitle}>{update.status === 'pending' ? 'Ảnh mới đang chờ duyệt' : 'Ảnh mới bị từ chối'}</Text>
                      {update.status === 'rejected' && update.reject_reason ? <Text style={styles.reason}>Lý do: {update.reject_reason}</Text> : null}
                      <View style={styles.updateBtns}>
                        <Pressable onPress={() => void add(r.type, r.label, true)} disabled={busyType === r.type} hitSlop={6}>
                          <Text style={styles.link}>{busyType === r.type ? 'Đang gửi...' : 'Đổi ảnh khác'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void remove(update, 'Hủy ảnh cập nhật?', 'Bạn tiếp tục dùng ảnh đã duyệt hiện tại.')}
                          hitSlop={6}
                        >
                          <Text style={[styles.link, { color: colors.danger }]}>Hủy cập nhật</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Button
                    title="Gửi ảnh mới để cập nhật"
                    icon="camera-retake-outline"
                    variant="secondary"
                    size="sm"
                    loading={busyType === r.type}
                    onPress={() => void add(r.type, r.label, true)}
                  />
                )
              ) : (
                <>
                  {latest?.status === 'rejected' && latest.reject_reason ? <Text style={styles.reason}>Lý do: {latest.reject_reason}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button
                      title={latest ? (latest.status === 'rejected' ? 'Tải lại ảnh' : 'Thay ảnh khác') : 'Chụp / tải ảnh'}
                      icon="camera-outline"
                      variant={latest ? 'secondary' : 'primary'}
                      size="sm"
                      loading={busyType === r.type}
                      onPress={() => void add(r.type, r.label)}
                      style={{ flex: 1 }}
                    />
                    {latest ? (
                      <Button title="Gỡ ảnh" icon="trash-can-outline" variant="outline" size="sm" onPress={() => void remove(latest, `Gỡ ảnh ${r.label}?`)} />
                    ) : null}
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Icon name="certificate-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Chứng chỉ nghề</Text>
              <Text style={styles.guide}>Không bắt buộc. Chứng chỉ nghề điện, an toàn điện... để quản trị viên tham khảo khi duyệt hồ sơ</Text>
            </View>
            <Text style={styles.count}>
              {certSlots}/{MAX_CERTS}
            </Text>
          </View>
          {certs.map((c) => (
            <View key={c.id} style={styles.cert}>
              <Pressable onPress={() => ui.viewImage(c.file_url)}>
                <Image source={{ uri: mediaUri(c.file_url) }} style={styles.certImg} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Tag label={STATUS[c.status].label} color={STATUS[c.status].color} />
                {c.reject_reason ? <Text style={styles.reason}>{c.reject_reason}</Text> : null}
                <Text style={styles.meta}>{fmtDateTime(c.created_at)}</Text>
              </View>
              <Pressable
                onPress={() => void remove(c, 'Gỡ chứng chỉ này?', c.status === 'approved' ? 'Chứng chỉ đã duyệt sẽ bị gỡ khỏi hồ sơ của bạn.' : undefined)}
                hitSlop={8}
                accessibilityLabel="Gỡ chứng chỉ"
              >
                <Icon name="trash-can-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {certSlots < MAX_CERTS ? (
            <Button title="Thêm chứng chỉ" icon="plus" variant="secondary" size="sm" loading={busyType === 'certificate'} onPress={() => void add('certificate', 'Chứng chỉ nghề')} />
          ) : null}
        </View>

        {!approved && ob.can_submit ? <Button title="Gửi hồ sơ xét duyệt" icon="send-check-outline" size="lg" onPress={submit} loading={submitting} /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  guide: { fontSize: 12, color: colors.faint, marginTop: 2 },
  preview: { width: '100%', height: 170, borderRadius: radius.md, backgroundColor: colors.line },
  reason: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  meta: { fontSize: 11, color: colors.faint },
  cert: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  certImg: { width: 64, height: 48, borderRadius: 8, backgroundColor: colors.line },
  count: { fontSize: 13, fontWeight: '700', color: colors.muted, fontVariant: ['tabular-nums'] },
  update: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.warningBg },
  updateRejected: { backgroundColor: colors.dangerBg },
  updateImg: { width: 72, height: 54, borderRadius: 8, backgroundColor: colors.line },
  updateTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  updateBtns: { flexDirection: 'row', gap: 18, marginTop: 4 },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
