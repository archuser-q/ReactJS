import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/Text';
import { Banner } from '../../components/Bits';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Form';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { apiUrl, defaultApiUrl, isOverridden, normalize, setApiOverride } from '../../config/env';
import type { ScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { KEYS, removeItem, setItem } from '../../utils/storage';

/** Đổi địa chỉ máy chủ ngay trong app — tiện khi demo đổi mạng Wi-Fi / IP máy chạy backend */
export default function ServerSettingsScreen({ navigation }: ScreenProps<'ServerSettings'>) {
  const ui = useOverlay();
  const [url, setUrl] = useState(apiUrl());
  const [busy, setBusy] = useState(false);

  const test = async (u: string) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(`${u}/health`, { signal: ctrl.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  };

  const save = async () => {
    const u = normalize(url);
    setBusy(true);
    const ok = await test(u);
    setBusy(false);
    if (!ok) {
      const go = await ui.confirm({
        title: 'Không kết nối được',
        message: `Không gọi được ${u}/health. Vẫn lưu địa chỉ này?`,
        tone: 'warning',
        confirmText: 'Vẫn lưu',
      });
      if (!go) return;
    }
    setApiOverride(u);
    await setItem(KEYS.apiUrl, u);
    ui.toast(ok ? 'Đã kết nối máy chủ' : 'Đã lưu địa chỉ máy chủ');
    navigation.goBack();
  };

  const useDefault = async () => {
    setApiOverride(null);
    await removeItem(KEYS.apiUrl);
    setUrl(defaultApiUrl());
    ui.toast('Đã dùng địa chỉ mặc định');
  };

  return (
    <Screen bg={colors.white}>
      <Header title="Máy chủ" subtitle={isOverridden() ? 'Đang dùng địa chỉ tự nhập' : 'Đang dùng địa chỉ mặc định'} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Banner text="Điện thoại thật cần dùng IP mạng LAN của máy chạy backend, VD 192.168.1.10:3000. Điện thoại và máy tính phải cùng Wi-Fi." />
        <TextField label="Địa chỉ API" icon="server-network" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.1.10:3000/api" />
        <Text style={styles.hint}>Mặc định: {defaultApiUrl()}</Text>
        <Button title="Kiểm tra & lưu" onPress={save} loading={busy} />
        <Button title="Dùng địa chỉ mặc định" variant="outline" onPress={useDefault} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14 },
  hint: { fontSize: 12, color: colors.faint },
});
