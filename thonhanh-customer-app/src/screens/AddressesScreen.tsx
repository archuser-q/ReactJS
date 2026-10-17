import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { Icon } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, errMsg, type Address } from '../api';
import { useApi } from '../hooks/useApi';
import { colors, common } from '../theme';

const LABEL_OPTIONS = ['Nhà riêng', 'Công ty', 'Khác'];

/** Ghép kết quả reverse geocode thành 1 dòng địa chỉ */
function joinAddress(a: Location.LocationGeocodedAddress): string {
  const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
  return [street || a.name, a.district, a.subregion, a.city ?? a.region]
    .filter((x, i, arr) => x && arr.indexOf(x) === i)
    .join(', ');
}

export default function AddressesScreen() {
  const q = useApi(() => api.listAddresses(), []);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState(LABEL_OPTIONS[0]);
  const [line, setLine] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setAdding(false);
    setLine('');
    setCoords(null);
    setLabel(LABEL_OPTIONS[0]);
  };

  // Backend cần toạ độ để tìm thợ gần -> lấy từ GPS của điện thoại
  const locate = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Cần quyền vị trí', 'Hãy cho phép ứng dụng truy cập vị trí để lưu địa chỉ.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      if (!line.trim()) {
        const geo = await Location.reverseGeocodeAsync(c).catch(() => []);
        if (geo[0]) setLine(joinAddress(geo[0]));
      }
    } catch (e) {
      Alert.alert('Không lấy được vị trí', errMsg(e));
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (line.trim().length < 3) return Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ cụ thể');
    if (!coords) return Alert.alert('Thiếu vị trí', 'Bấm "Lấy vị trí hiện tại" để thợ tìm được đến bạn');
    setSaving(true);
    try {
      await api.createAddress({ label, address_text: line.trim(), lat: coords.latitude, lng: coords.longitude });
      resetForm();
      await q.reload(true);
    } catch (e) {
      Alert.alert('Không lưu được', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await q.reload(true);
    } catch (e) {
      Alert.alert('Không thực hiện được', errMsg(e));
    }
  };

  const openMenu = (a: Address) =>
    Alert.alert(a.label ?? 'Địa chỉ', a.address_text, [
      ...(!a.is_default
        ? [{ text: 'Đặt làm mặc định', onPress: () => run(() => api.updateAddress(a.id, { is_default: true })) }]
        : []),
      { text: 'Xóa', style: 'destructive' as const, onPress: () => run(() => api.deleteAddress(a.id)) },
      { text: 'Đóng', style: 'cancel' as const },
    ]);

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Địa chỉ của tôi" />
      {!q.data ? (
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {q.data.length === 0 && !adding && (
            <Text style={styles.hint}>Chưa có địa chỉ nào. Thêm địa chỉ để đặt thợ nhanh hơn.</Text>
          )}
          {q.data.map((a) => (
            <Pressable key={a.id} style={styles.card} onPress={() => openMenu(a)}>
              <Icon name="map-marker" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.label}>{a.label ?? 'Địa chỉ'}</Text>
                  {a.is_default && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Mặc định</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.address}>{a.address_text}</Text>
              </View>
              <Icon name="dots-vertical" size={18} color={colors.gray300} />
            </Pressable>
          ))}

          {adding ? (
            <View style={[styles.card, { flexDirection: 'column', gap: 12 }]}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {LABEL_OPTIONS.map((l) => {
                  const on = label === l;
                  return (
                    <Pressable key={l} onPress={() => setLabel(l)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && { color: '#fff' }]}>{l}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={[common.textarea, { minHeight: 64 }]}
                multiline
                placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                placeholderTextColor={colors.gray400}
                value={line}
                onChangeText={setLine}
                maxLength={255}
                selectionColor={colors.primary}
              />
              <Pressable onPress={locate} style={styles.locate} disabled={locating}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name={coords ? 'crosshairs-gps' : 'crosshairs'} size={18} color={colors.primary} />
                )}
                <Text style={styles.add}>{coords ? 'Đã lấy vị trí · Lấy lại' : 'Lấy vị trí hiện tại'}</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={resetForm} style={[styles.btn, { backgroundColor: colors.gray100 }]}>
                  <Text style={[styles.btnText, { color: colors.text }]}>Hủy</Text>
                </Pressable>
                <Pressable onPress={save} disabled={saving} style={[styles.btn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu địa chỉ</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={common.dashedBtn} onPress={() => setAdding(true)}>
              <Icon name="plus" size={18} color={colors.primary} />
              <Text style={styles.add}>Thêm địa chỉ mới</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  card: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray100, padding: 14,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  address: { fontSize: 12, color: colors.gray500, marginTop: 4, lineHeight: 18 },
  add: { fontSize: 14, fontWeight: '500', color: colors.primary },
  hint: { fontSize: 12, color: colors.gray400, textAlign: 'center', paddingVertical: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
    borderColor: colors.gray200, backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.gray500 },
  locate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10,
    borderRadius: 12, backgroundColor: colors.primaryLight,
  },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
