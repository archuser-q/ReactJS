/** Bản web: ảnh vừa khung (trình duyệt điện thoại tự phóng to bằng 2 ngón). Bản điện thoại: ZoomImage.tsx */
import { Image, StyleSheet } from 'react-native';

export function ZoomImage({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />;
}
