import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, View, type TextInput as RNTextInput } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMsg, qk, type Message } from '../../api';
import { Icon } from '../../components/Icon';
import { mediaUri } from '../../config/env';
import { useOverlay } from '../../components/Overlay';
import { useUploadImages } from '../../components/Photos';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { fmtDate, fmtTime } from '../../utils/format';

const QUICK = ['Em đang trên đường tới ạ', 'Em đến nơi rồi ạ', 'Anh/chị chờ em 5 phút nhé', 'Anh/chị gửi giúp em ảnh chỗ hỏng', 'Em cảm ơn anh/chị!'];

export default function ChatScreen({ route }: ScreenProps<'Chat'>) {
  const { orderId, customerName, customerPhone } = route.params;
  const focused = useIsFocused();
  const qc = useQueryClient();
  const ui = useOverlay();
  const insets = useSafeAreaInsets();
  const upload = useUploadImages();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const q = useQuery({
    queryKey: qk.messages(orderId),
    queryFn: () => api.messages(orderId),
    refetchInterval: focused ? 4000 : false,
  });
  const msgs = q.data ?? [];
  const lastIncoming = [...msgs].reverse().find((m) => !m.is_mine && !m.is_read)?.id;

  // Đánh dấu đã đọc khi có tin mới của khách
  useEffect(() => {
    if (!focused || !lastIncoming) return;
    api
      .markMessagesRead(orderId)
      .then(() => {
        void qc.invalidateQueries({ queryKey: qk.job(orderId) });
        void qc.invalidateQueries({ queryKey: qk.home });
      })
      .catch(() => undefined);
  }, [focused, lastIncoming, orderId, qc]);

  const data = useMemo(() => [...msgs].reverse(), [msgs]); // FlatList inverted: mới nhất ở dưới

  const send = async (content: string | null, imageUrl?: string) => {
    if (!content?.trim() && !imageUrl) return;
    setSending(true);
    try {
      const m = await api.sendMessage(orderId, content?.trim() || null, imageUrl);
      qc.setQueryData<Message[]>(qk.messages(orderId), (old) => [...(old ?? []), m]);
      setText('');
    } catch (e) {
      void ui.alert('Chưa gửi được', errMsg(e), 'danger');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    const [url] = await upload.run({ title: 'Gửi ảnh cho khách' });
    if (url) await send(null, url);
  };

  return (
    <Screen bg={colors.white} noBottomInset>
      <Header
        title={customerName ?? 'Khách hàng'}
        subtitle="Tin nhắn theo đơn"
        right={customerPhone ? { icon: 'phone', onPress: () => void Linking.openURL(`tel:${customerPhone}`), label: 'Gọi' } : undefined}
      />
      {!q.data ? (
        <StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} onRetry={() => void q.refetch()} />
      ) : !data.length ? (
        // Không đặt trong FlatList "inverted": Android lật danh sách theo cả 2 chiều nên chữ bị ngược như soi gương
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <StateView icon="message-text-outline" empty="Chưa có tin nhắn. Hãy chào khách và báo thời gian bạn tới nhé!" />
        </View>
      ) : (
        <FlatList
          inverted
          data={data}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          renderItem={({ item, index }) => {
            const older = data[index + 1];
            const showDay = !older || fmtDate(older.created_at) !== fmtDate(item.created_at);
            return (
              <View>
                {showDay ? <Text style={styles.day}>{fmtDate(item.created_at)}</Text> : null}
                <Bubble m={item} onImage={(u) => ui.viewImage(u)} />
              </View>
            );
          }}
        />
      )}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }} keyboardShouldPersistTaps="handled">
          {QUICK.map((t) => (
            <Pressable key={t} onPress={() => void send(t)} style={styles.quick} disabled={sending}>
              <Text style={styles.quickText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <Pressable onPress={sendImage} style={styles.iconBtn} disabled={upload.uploading} accessibilityLabel="Gửi ảnh">
            <Icon name={upload.uploading ? 'progress-upload' : 'image-plus'} size={22} color={colors.primary} />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Nhắn cho khách..."
            placeholderTextColor={colors.faint}
            style={styles.input}
            multiline
            maxLength={2000}
            onSubmitEditing={() => void send(text)}
          />
          <Pressable onPress={() => void send(text)} disabled={sending || !text.trim()} style={[styles.send, (!text.trim() || sending) && { opacity: 0.4 }]} accessibilityLabel="Gửi">
            <Icon name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function Bubble({ m, onImage }: { m: Message; onImage: (u: string) => void }) {
  const mine = m.is_mine;
  return (
    <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {m.image_url ? (
          <Pressable onPress={() => onImage(m.image_url!)}>
            <Image source={{ uri: mediaUri(m.image_url) }} style={styles.img} />
          </Pressable>
        ) : null}
        {m.content ? <Text style={[styles.text, mine && { color: '#fff' }]}>{m.content}</Text> : null}
        <View style={styles.meta}>
          <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>{fmtTime(m.created_at)}</Text>
          {mine ? <Icon name={m.is_read ? 'check-all' : 'check'} size={13} color="rgba(255,255,255,0.8)" /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: { alignSelf: 'center', fontSize: 11, color: colors.faint, backgroundColor: colors.line, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginVertical: 6 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.line, borderBottomLeftRadius: 6 },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  time: { fontSize: 10, color: colors.faint },
  img: { width: 200, height: 160, borderRadius: 12, backgroundColor: colors.border },
  bar: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 8, backgroundColor: colors.white },
  quick: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.primaryLight },
  quickText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  input: { flex: 1, minHeight: 42, maxHeight: 110, backgroundColor: colors.line, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
});
