import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GradientButton } from '../components/GradientButton';
import { Icon } from '../components/Icon';
import { Header, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, errMsg, uploadImage, type LocalImage } from '../api';
import { useAuth } from '../auth/AuthContext';
import { pickImages } from '../utils/pickImage';
import { useApi } from '../hooks/useApi';
import { money, vnSlot } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors, common, op } from '../theme';

const DAY_LABELS = ['Hôm nay', 'Ngày mai', 'Ngày kia'];
const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 07:00 – 21:00 (khung giờ backend nhận lịch hẹn)
const MIN_LEAD_MS = 60 * 60 * 1000; // backend yêu cầu hẹn trước ít nhất 60 phút; cần gấp thì chọn "Ngay bây giờ"
const MAX_PHOTOS = 6;

export default function BookScreen() {
  const { navigate, service } = useNav();
  const { user } = useAuth();
  // Ảnh tình trạng: giữ ảnh gốc để xem trước, tải lên khi bấm đặt
  const [photos, setPhotos] = useState<LocalImage[]>([]);
  const addresses = useApi(() => api.listAddresses(), []);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [pickAddress, setPickAddress] = useState(false);
  const [desc, setDesc] = useState('');
  const [when, setWhen] = useState(0);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mặc định chọn địa chỉ mặc định
  useEffect(() => {
    const list = addresses.data;
    if (list?.length && !list.some((a) => a.id === addressId)) {
      setAddressId((list.find((a) => a.is_default) ?? list[0]).id);
    }
  }, [addresses.data, addressId]);

  const address = addresses.data?.find((a) => a.id === addressId) ?? null;
  const now = Date.now();
  const hourOk = (h: number) => vnSlot(day, h).ts - now >= MIN_LEAD_MS;
  const dayOk = (d: number) => vnSlot(d, HOURS[HOURS.length - 1]).ts - now >= MIN_LEAD_MS;
  const days = DAY_LABELS.map((label, i) => ({ label, i })).filter((d) => dayOk(d.i));

  if (!service) {
    return (
      <Screen>
        <Header title="Đặt dịch vụ" />
        <StateView empty="Bạn chưa chọn dịch vụ" icon="wrench-outline" actionLabel="Chọn dịch vụ" onAction={() => navigate('home')} />
      </Screen>
    );
  }

  const addPhotos = async () => {
    const picked = await pickImages({ max: MAX_PHOTOS - photos.length });
    if (picked.length) setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    // Thợ cần SĐT để liên hệ khi đến; tài khoản Google/Facebook có thể chưa có
    if (!user?.phone) {
      Alert.alert('Cần số điện thoại', 'Vui lòng thêm số điện thoại để thợ liên hệ khi đến.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Thêm ngay', onPress: () => navigate('personalInfo', { returnTo: 'book' }) },
      ]);
      return;
    }
    if (!address) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng thêm địa chỉ để thợ biết nơi đến.');
      return;
    }
    let scheduledAt: string | null = null;
    if (when === 1) {
      if (hour === null || !hourOk(hour)) {
        Alert.alert('Chọn giờ hẹn', 'Vui lòng chọn khung giờ (sau hiện tại ít nhất 60 phút). Cần thợ gấp thì chọn "Ngay bây giờ".');
        return;
      }
      scheduledAt = vnSlot(day, hour).iso;
    }
    setSubmitting(true);
    try {
      // Tải ảnh tình trạng lên trước (POST /api/uploads), rồi gửi URL kèm đơn — thợ xem được trong lời mời
      const imageUrls: string[] = [];
      for (const p of photos) imageUrls.push(await uploadImage(p));
      // Không gửi chế độ ghép: hệ thống tự chọn theo cấu hình của admin
      const order = await api.createOrder({
        service_id: service.id,
        address_id: address.id,
        description: desc.trim() || null,
        scheduled_at: scheduledAt,
        image_urls: imageUrls,
      });
      navigate('match', { orderId: order.id });
    } catch (e) {
      const msg = errMsg(e);
      // Còn đơn đã xong mà chưa thanh toán -> đưa khách tới đơn đó để trả (Thợ Nhanh không nhận tiền mặt)
      const code = /chưa thanh toán đơn (\S+?)\.?(\s|$)/.exec(msg)?.[1];
      if (code) {
        const unpaid = await api
          .listOrders({ group: 'completed', pageSize: 20 })
          .then((r) => r.items.find((x) => x.code === code))
          .catch(() => undefined);
        Alert.alert('Chưa thanh toán đơn trước', msg, [
          { text: 'Để sau', style: 'cancel' },
          ...(unpaid ? [{ text: 'Thanh toán ngay', onPress: () => navigate('track', { orderId: unpaid.id }) }] : []),
        ]);
      } else {
        Alert.alert('Không đặt được dịch vụ', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="Đặt dịch vụ" />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dịch vụ đã chọn */}
          <View style={styles.selected}>
            <View style={[styles.selIcon, { backgroundColor: service.bg }]}>
              <Icon name={service.icon} size={24} color={service.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selTag}>Dịch vụ đã chọn</Text>
              <Text style={styles.selName}>{service.label}</Text>
              {service.description ? <Text style={styles.selDesc} numberOfLines={2}>{service.description}</Text> : null}
            </View>
            <Pressable onPress={() => navigate('home')} hitSlop={8}>
              <Icon name="close" size={18} color={colors.gray400} />
            </Pressable>
          </View>

          {/* Địa chỉ: chọn trong sổ địa chỉ (backend cần toạ độ để tìm thợ gần) */}
          <View>
            <Text style={common.label}>Địa chỉ</Text>
            {addresses.loading ? (
              <View style={styles.addr}>
                <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />
              </View>
            ) : !address ? (
              <Pressable style={styles.addr} onPress={() => navigate('addresses', { returnTo: 'book' })}>
                <Icon name="map-marker-plus-outline" size={18} color={colors.primary} />
                <Text style={[styles.addrInput, { color: colors.primary, fontWeight: '600' }]}>Thêm địa chỉ</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.addr} onPress={() => setPickAddress(!pickAddress)}>
                  <Icon name="map-marker" size={18} color={colors.primary} />
                  <Text style={styles.addrInput} numberOfLines={1}>
                    {address.label ? `${address.label} · ` : ''}{address.address_text}
                  </Text>
                  <Icon name={pickAddress ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray400} />
                </Pressable>
                {pickAddress && (
                  <View style={styles.pickList}>
                    {addresses.data!.map((a) => (
                      <Pressable
                        key={a.id}
                        style={styles.pickRow}
                        onPress={() => {
                          setAddressId(a.id);
                          setPickAddress(false);
                        }}
                      >
                        <Icon
                          name={a.id === addressId ? 'radiobox-marked' : 'radiobox-blank'}
                          size={18}
                          color={a.id === addressId ? colors.primary : colors.gray300}
                        />
                        <View style={{ flex: 1 }}>
                          {a.label ? <Text style={styles.pickLabel}>{a.label}</Text> : null}
                          <Text style={styles.pickText} numberOfLines={2}>{a.address_text}</Text>
                        </View>
                      </Pressable>
                    ))}
                    <Pressable style={styles.pickRow} onPress={() => navigate('addresses', { returnTo: 'book' })}>
                      <Icon name="plus" size={18} color={colors.primary} />
                      <Text style={[styles.pickText, { color: colors.primary, fontWeight: '600' }]}>Quản lý địa chỉ</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Thời gian */}
          <View>
            <Text style={common.label}>Thời gian</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['Ngay bây giờ', 'Đặt lịch hẹn'].map((opt, i) => {
                const on = when === i;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setWhen(i)}
                    style={[styles.timeBtn, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.timeText, on && { color: '#fff' }]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
            {when === 1 && (
              <View style={{ marginTop: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {days.map((d) => {
                    const on = day === d.i;
                    return (
                      <Pressable
                        key={d.i}
                        onPress={() => {
                          setDay(d.i);
                          setHour(null);
                        }}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, on && { color: '#fff' }]}>{d.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.hours}>
                  {HOURS.filter(hourOk).map((h) => {
                    const on = hour === h;
                    return (
                      <Pressable key={h} onPress={() => setHour(h)} style={[styles.chip, on && styles.chipOn]}>
                        <Text style={[styles.chipText, on && { color: '#fff' }]}>{`${h.toString().padStart(2, '0')}:00`}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Mô tả */}
          <View>
            <Text style={common.label}>Mô tả vấn đề</Text>
            <TextInput
              style={common.textarea}
              multiline
              numberOfLines={3}
              maxLength={2000}
              placeholder="Mô tả chi tiết..."
              placeholderTextColor={colors.gray400}
              value={desc}
              onChangeText={setDesc}
              selectionColor={colors.primary}
            />
          </View>

          {/* Ảnh */}
          <View>
            <Text style={common.label}>Ảnh tình trạng ({photos.length}/{MAX_PHOTOS})</Text>
            {photos.length > 0 && (
              <View style={styles.thumbs}>
                {photos.map((p, i) => (
                  <View key={p.uri + i}>
                    <Image source={{ uri: p.uri }} style={styles.thumb} />
                    <Pressable
                      style={styles.thumbX}
                      hitSlop={6}
                      onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Icon name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            {photos.length < MAX_PHOTOS && (
              <Pressable style={styles.photo} onPress={addPhotos}>
                <Icon name="camera-outline" size={24} color={colors.gray400} />
                <Text style={{ fontSize: 12, color: colors.gray400 }}>Chụp / chọn ảnh chỗ hỏng (giúp thợ mang đúng vật tư)</Text>
              </Pressable>
            )}
          </View>

          {/* Giá */}
          <View style={styles.price}>
            <Text style={{ fontSize: 14, color: colors.gray500 }}>Giá ước tính</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              Từ {money(service.base_price)}{service.unit ? ` / ${service.unit}` : ''}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.cta} pointerEvents="box-none">
          <GradientButton title="Tìm thợ phù hợp →" onPress={submit} loading={submitting} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  selected: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16,
    borderWidth: 2, borderColor: op(colors.primary, 0.3), backgroundColor: colors.primaryLight,
  },
  selIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selTag: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.primary },
  selName: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  selDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  pickList: {
    marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.gray200, backgroundColor: '#fff', overflow: 'hidden',
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  pickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  pickText: { fontSize: 13, color: colors.body },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
    borderColor: colors.gray200, backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addr: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.gray50,
    borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.gray200,
  },
  addrInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 12 },
  timeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.gray200,
    alignItems: 'center', backgroundColor: '#fff',
  },
  timeText: { fontSize: 14, fontWeight: '500', color: colors.text },
  photo: {
    paddingVertical: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.gray200,
    borderRadius: 16, alignItems: 'center', gap: 6,
  },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: colors.gray100 },
  thumbX: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.8)', alignItems: 'center', justifyContent: 'center',
  },
  price: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
    borderRadius: 16, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200,
  },
  cta: { position: 'absolute', left: 12, right: 12, bottom: 12 },
});
