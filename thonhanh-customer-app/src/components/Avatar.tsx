import { StyleSheet, Text, View } from 'react-native';

const PALETTE = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#0891B2'];

/** Avatar chữ cái đầu (giống WorkerAvatar trong bản thiết kế) */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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
