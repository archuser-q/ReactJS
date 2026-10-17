import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { GradientButton } from '../components/GradientButton';
import { Icon } from '../components/Icon';
import { Header, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { REVIEW_TAGS } from '../data/mock';
import { api, errMsg } from '../api';
import { useApi } from '../hooks/useApi';
import { fmtDate } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors, common } from '../theme';

const LABELS: Record<number, string> = {
  5: 'Xuất sắc!',
  4: 'Rất tốt',
  3: 'Tạm ổn',
  2: 'Chưa hài lòng',
  1: 'Chưa hài lòng',
};

/** Backend chỉ có 1 ô comment -> ghép "nhận xét nhanh" + nhận xét tự viết */
function buildComment(tags: string[], text: string): string | null {
  const parts = [tags.join(', '), text.trim()].filter(Boolean);
  return parts.length ? parts.join('. ').slice(0, 1000) : null;
}

export default function ReviewScreen() {
  const { navigate, orderId } = useNav();
  const q = useApi(() => (orderId ? api.getOrder(orderId) : Promise.resolve(null)), [orderId]);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const toggle = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const o = q.data;
  if (!o || !o.worker) {
    return (
      <Screen>
        <Header title="Đánh giá dịch vụ" />
        <StateView
          loading={q.loading}
          error={q.error}
          onRetry={() => q.reload()}
          empty="Không có đơn để đánh giá"
          icon="star-outline"
          actionLabel="Xem lịch sử đơn"
          onAction={() => navigate('history')}
        />
      </Screen>
    );
  }

  const done = o.review; // đã đánh giá -> chỉ xem
  const shown = done ? done.rating : stars;

  const submit = async () => {
    setSending(true);
    try {
      await api.createReview(o.id, stars, buildComment(tags, comment));
      Alert.alert('Cảm ơn bạn!', 'Đánh giá của bạn đã được gửi.', [{ text: 'OK', onPress: () => navigate('history') }]);
    } catch (e) {
      Alert.alert('Không gửi được đánh giá', errMsg(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Header title="Đánh giá dịch vụ" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar name={o.worker.full_name} size={72} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.name}>{o.worker.full_name}</Text>
            <Text style={styles.sub}>{o.service_name} · {fmtDate(o.completed_at ?? o.created_at)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => !done && setStars(s)} hitSlop={4} disabled={!!done}>
                <Icon
                  name={s <= shown ? 'star' : 'star-outline'}
                  size={38}
                  color={s <= shown ? colors.amber400 : colors.gray200}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{done ? 'Bạn đã đánh giá đơn này' : LABELS[stars]}</Text>
        </View>

        {done ? (
          done.comment ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={common.label}>Nhận xét của bạn</Text>
              <Text style={[common.textarea, { minHeight: 0 }]}>{done.comment}</Text>
            </View>
          ) : null
        ) : (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text style={common.label}>Nhận xét nhanh</Text>
              <View style={styles.tags}>
                {REVIEW_TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => toggle(t)}
                      style={[
                        styles.tag,
                        on
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: '#fff', borderColor: colors.gray200 },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: on ? '#fff' : colors.gray500 }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={common.label}>Nhận xét của bạn</Text>
              <TextInput
                style={common.textarea}
                multiline
                numberOfLines={3}
                maxLength={800}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                placeholderTextColor={colors.gray400}
                value={comment}
                onChangeText={setComment}
                selectionColor={colors.primary}
              />
            </View>
          </>
        )}

        {done ? (
          <GradientButton title="Về trang chủ" onPress={() => navigate('home')} />
        ) : o.can_review ? (
          <GradientButton title="Gửi đánh giá" onPress={submit} loading={sending} />
        ) : (
          <Text style={[styles.sub, { textAlign: 'center' }]}>Chỉ đánh giá được đơn đã hoàn thành</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 24 },
  hero: { alignItems: 'center', gap: 16, marginBottom: 24 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, color: colors.gray400, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '500' },
});
