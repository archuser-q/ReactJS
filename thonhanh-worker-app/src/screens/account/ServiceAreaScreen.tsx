import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Banner, Card } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Form';
import { AppMap } from '../../components/map/AppMap';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import { getCoords, getDemoLocation, setDemoLocation, type Coords } from '../../hooks/useLocation';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { timeAgo } from '../../utils/format';

const RADII = [3, 5, 8, 10, 15, 20];
const HOAN_KIEM = { latitude: 21.0285, longitude: 105.8542 };

export default function ServiceAreaScreen({ navigation }: ScreenProps<'ServiceArea'>) {
  const me = useWorkerMe();
  const qc = useQueryClient();
  const ui = useOverlay();
  const [radius, setRadius] = useState(10);
  const [pos, setPos] = useState<Coords | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [onMap, setOnMap] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!me.data) return;
    setRadius(Math.round(me.data.profile.service_radius_km));
    const loc = me.data.profile.location;
    if (loc) setPos({ latitude: loc.latitude, longitude: loc.longitude });
  }, [me.data]);

  if (!me.data) {
    return (
      <Screen>
        <Header title="Khu vực nhận việc" />
        <StateView loading={me.isLoading} error={me.error ? errMsg(me.error) : null} />
      </Screen>
    );
  }

  const center = pos ?? getDemoLocation() ?? HOAN_KIEM;
  const dirty = radius !== Math.round(me.data.profile.service_radius_km); // vị trí được lưu ngay khi cập nhật, nút Lưu chỉ cho bán kính

  const locate = async () => {
    setLocating(true);
    try {
      const c = await getCoords();
      setPos(c);
      await api.updateLocation(c.latitude, c.longitude);
      ui.toast('Đã cập nhật vị trí');
    } catch (e) {
      void ui.alert('Không lấy được vị trí', isWeb ? `${errMsg(e)}\n\nBản web: bạn có thể bấm lên bản đồ để chọn vị trí mô phỏng.` : errMsg(e), 'warning');
    } finally {
      setLocating(false);
    }
  };

  const pickOnMap = async (lat: number, lng: number) => {
    if (!isWeb) return;
    const c = { latitude: lat, longitude: lng };
    setDemoLocation(c);
    setPos(c);
    try {
      await api.updateLocation(lat, lng);
      ui.toast('Đã đặt vị trí mô phỏng (bản web)', 'info');
    } catch (e) {
      ui.toast(errMsg(e), 'error');
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      qc.setQueryData(qk.me, await api.updateProfile({ service_radius_km: radius }));
      ui.toast(`Bán kính nhận việc: ${radius} km`);
      navigation.goBack();
    } catch (e) {
      void ui.alert('Chưa lưu được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Khu vực nhận việc" subtitle="Bán kính tính từ vị trí hiện tại của bạn" />
      <ScrollView contentContainerStyle={styles.body} scrollEnabled={!onMap}>
        <AppMap
          height={300}
          style={{ borderRadius: 20 }}
          onPress={pickOnMap}
          onTouchActive={setOnMap}
          data={{
            markers: [{ id: 'me', lat: center.latitude, lng: center.longitude, kind: 'worker' }],
            circle: { lat: center.latitude, lng: center.longitude, radiusKm: radius },
            fit: true,
            fitKey: `${radius}-${center.latitude.toFixed(4)}-${center.longitude.toFixed(4)}`,
          }}
        />
        <Card style={{ gap: 12 }}>
          <Text style={styles.label}>Bán kính nhận việc tối đa</Text>
          <View style={styles.chips}>
            {RADII.map((r) => (
              <Chip key={r} label={`${r} km`} selected={radius === r} onPress={() => setRadius(r)} />
            ))}
          </View>
          <Text style={styles.hint}>
            Bạn chỉ nhận đơn trong vòng {radius} km. Hệ thống còn ưu tiên thợ ở gần khách hơn (tiêu chí khoảng cách trong thuật toán ghép đơn).
          </Text>
        </Card>
        <Card style={{ gap: 8 }}>
          <Text style={styles.label}>Vị trí hiện tại</Text>
          <Text style={styles.hint}>
            {me.data.profile.location?.updated_at ? `Cập nhật ${timeAgo(me.data.profile.location.updated_at)}` : 'Chưa có vị trí'}
            {isWeb && getDemoLocation() ? ' · đang dùng vị trí mô phỏng' : ''}
          </Text>
          <Button title="Cập nhật vị trí của tôi" icon="crosshairs-gps" variant="secondary" onPress={locate} loading={locating} />
          {isWeb ? <Banner text="Bản web để demo: bấm vào bản đồ để đặt vị trí mô phỏng nếu trình duyệt không lấy được GPS." /> : null}
        </Card>
        <Button title={dirty ? `Lưu bán kính ${radius} km` : 'Chưa đổi bán kính'} onPress={save} loading={busy} disabled={!dirty} size="lg" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '800', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 19 },
});
