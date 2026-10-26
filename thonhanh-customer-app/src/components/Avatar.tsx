import { Image, StyleSheet, Text, View } from 'react-native';
import { mediaUri } from '../config/env';

const PALETTE = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#0891B2'];

/** Avatar: ảnh đại diện nếu có, không thì chữ cái đầu (giống WorkerAvatar trong bản thiết kế) */
export function Avatar({ name, size = 40, uri }: { name: string; size?: number; uri?: string | null }) {
  if (uri) {
    return <Image source={{ uri: mediaUri(uri) }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }} />;
  }
  const initials = name
    .split(' ')
    .slice(-2)
    .map((n) => n[0])
    .join('');
  const color = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
