import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Header, Screen } from '../components/Screen';
import { Icon } from '../components/Icon';
import { StateView } from '../components/StateView';
import { api, errMsg, uploadImage, type Message, type OrderDetail, type OrderUpdatedEvent } from '../api';
import { mediaUri } from '../config/env';
import { pickImages } from '../utils/pickImage';
import { useAuth } from '../auth/AuthContext';
import { useSocketEvent } from '../realtime/socket';
import { useInterval } from '../hooks/useApi';
import { useCurrentOrderId } from '../hooks/useCurrentOrder';
import { ORDER_STATUS, fmtDate, fmtTime } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors, shadowSm } from '../theme';

// Tin nhắn mới đến qua Socket.IO; hỏi lại server định kỳ để phòng mất kết nối
const POLL_MS = 15000;
const CHAT_OPEN = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];

export default function ChatScreen() {
  const { goBack, navigate, orderId: navOrderId } = useNav();
  const { user } = useAuth();
  const myId = user?.id;
  const cur = useCurrentOrderId(navOrderId, true);
  const orderId = cur.orderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!orderId) return;
    const list = await api.listMessages(orderId, { limit: 100 });
    setMessages((prev) =>
      prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id ? prev : list,
    );
    // Có tin chưa đọc của thợ -> đánh dấu đã đọc
    if (list.some((m) => m.sender_id !== myId && !m.is_read)) void api.markMessagesRead(orderId).catch(() => {});
  }, [orderId, myId]);

  /** Thêm tin (bỏ qua nếu đã có — tin mình gửi có thể về qua socket trước khi API trả lời) */
  const addMessage = useCallback((m: Message) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([api.getOrder(orderId), loadMessages()])
      .then(([o]) => alive && setOrder(o))
      .catch((e) => alive && setError(errMsg(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orderId, loadMessages]);

  useInterval(() => {
    loadMessages().catch(() => {});
  }, POLL_MS, !!order);

  useSocketEvent<Message>(
    'message:new',
    (m) => {
      if (m.order_id !== orderId) return;
      addMessage(m);
      if (m.sender_id !== myId) void api.markMessagesRead(m.order_id).catch(() => {});
    },
    !!orderId,
  );
  // Đơn đổi trạng thái (VD hoàn thành) -> cập nhật đầu trang chat
  useSocketEvent<OrderUpdatedEvent>(
    'order:updated',
    (e) => {
      if (e.order_id === orderId) api.getOrder(e.order_id).then(setOrder).catch(() => {});
    },
    !!orderId,
  );
  useSocketEvent('connect', () => void loadMessages().catch(() => {}), !!orderId);

  if (cur.resolving || loading) {
    return (
      <Screen>
        <Header title="Tin nhắn" />
        <StateView loading />
      </Screen>
    );
  }
  if (!orderId || !order || !order.worker) {
    return (
      <Screen>
        <Header title="Tin nhắn" />
        <StateView
          error={cur.error ?? error}
          onRetry={() => (cur.error ? cur.retry() : navigate('chat', { orderId }))}
          empty="Chưa có cuộc trò chuyện nào. Bạn có thể nhắn tin khi thợ đã nhận đơn."
          icon="message-text-outline"
          actionLabel="Về trang chủ"
          onAction={() => navigate('home')}
        />
      </Screen>
    );
  }

  const worker = order.worker;
  const open = CHAT_OPEN.includes(order.status);

  const send = async () => {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const m = await api.sendMessage(order.id, { content: text });
      addMessage(m);
      setMsg('');
    } catch (e) {
      Alert.alert('Không gửi được', errMsg(e));
    } finally {
      setSending(false);
    }
  };

  // Gửi ảnh: chụp / chọn -> tải lên POST /api/uploads -> gửi image_url (app thợ hiển thị được)
  const sendImage = async () => {
    if (sending) return;
    const [img] = await pickImages({ max: 1 });
    if (!img) return;
    setSending(true);
    try {
      const url = await uploadImage(img);
      addMessage(await api.sendMessage(order.id, { image_url: url }));
    } catch (e) {
      Alert.alert('Không gửi được ảnh', errMsg(e));
    } finally {
      setSending(false);
    }
  };

  // Hiện ngày khi sang ngày mới
  let lastDay = '';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.back} hitSlop={8}>
          <Icon name="arrow-left" size={16} color={colors.text} />
        </Pressable>
        <Avatar name={worker.full_name} size={36} uri={worker.avatar_url} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{worker.full_name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, !open && { backgroundColor: colors.gray300 }]} />
            <Text style={[styles.status, !open && { color: colors.gray400 }]} numberOfLines={1}>
              {order.code} · {ORDER_STATUS[order.status].label}
            </Text>
          </View>
        </View>
        <Pressable style={styles.phone} onPress={() => Linking.openURL(`tel:${worker.phone}`)}>
          <Icon name="phone-outline" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Text style={styles.empty}>Hãy gửi lời chào tới thợ {worker.full_name} 👋</Text>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          const day = fmtDate(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <View key={m.id} style={{ gap: 12 }}>
              {showDay && <Text style={styles.day}>{day}</Text>}
              <View style={[styles.msgRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                {!mine && <Avatar name={worker.full_name} size={28} uri={worker.avatar_url} />}
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                      : { backgroundColor: colors.gray100, borderBottomLeftRadius: 4 },
                  ]}
                >
                  {m.image_url ? (
                    <Pressable onPress={() => setViewing(m.image_url)}>
                      <Image source={{ uri: mediaUri(m.image_url) }} style={styles.msgImg} />
                    </Pressable>
                  ) : null}
                  {m.content ? <Text style={[styles.text, { color: mine ? '#fff' : colors.text }]}>{m.content}</Text> : null}
                  <Text
                    style={[
                      styles.time,
                      { color: mine ? 'rgba(255,255,255,0.6)' : colors.gray400, textAlign: mine ? 'right' : 'left' },
                    ]}
                  >
                    {fmtTime(m.created_at)}
                    {mine && m.is_read ? ' · Đã xem' : ''}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {open ? (
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.gray400}
              value={msg}
              onChangeText={setMsg}
              onSubmitEditing={send}
              returnKeyType="send"
              maxLength={2000}
              selectionColor={colors.primary}
            />
            <Pressable onPress={sendImage} hitSlop={8} disabled={sending}>
              <Icon name="camera-outline" size={18} color={colors.gray400} />
            </Pressable>
          </View>
          <Pressable onPress={send} style={[styles.send, sending && { opacity: 0.6 }]}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={16} color="#fff" />}
          </Pressable>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <Text style={[styles.empty, { flex: 1, paddingVertical: 4 }]}>Cuộc trò chuyện đã đóng</Text>
        </View>
      )}

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewing(null)}>
          {viewing ? <Image source={{ uri: mediaUri(viewing) }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  msgImg: { width: 200, height: 200, borderRadius: 12, backgroundColor: colors.gray200, marginBottom: 4 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  back: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald500 },
  status: { fontSize: 12, color: colors.emerald600 },
  phone: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  text: { fontSize: 12, lineHeight: 18 },
  time: { fontSize: 10, marginTop: 4 },
  empty: { fontSize: 12, color: colors.gray400, textAlign: 'center', paddingVertical: 12 },
  day: { fontSize: 11, color: colors.gray400, textAlign: 'center' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.gray100,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gray100,
    borderRadius: 999, paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 },
  send: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadowSm, elevation: 3,
  },
});
