import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import * as ImagePicker from 'expo-image-picker';
import { api, errMsg, type LocalImage } from '../api';
import { Icon } from './Icon';
import { mediaUri } from '../config/env';
import { useOverlay } from './Overlay';
import { colors, radius } from '../theme';

/** Số ảnh tối đa mỗi loại (trước/sau) của 1 đơn, khớp MAX_PHOTOS_PER_KIND của backend */
export const MAX_PICK = 6;

type PickOpts = { multiple?: boolean; title?: string; /** số ảnh còn được thêm */ limit?: number };

/** Hỏi chụp ảnh hay chọn từ thư viện, rồi trả về ảnh đã chọn (chưa tải lên) */
export function usePickImage() {
  const ui = useOverlay();
  return async (opts: PickOpts = {}): Promise<LocalImage[]> => {
    const limit = Math.max(1, Math.min(MAX_PICK, opts.limit ?? MAX_PICK));
    const how = await ui.choose({
      title: opts.title ?? 'Thêm ảnh',
      choices: ['Chụp ảnh mới', 'Chọn từ thư viện'],
      confirmText: 'Tiếp tục',
    });
    if (!how) return [];
    try {
      let res: ImagePicker.ImagePickerResult;
      if (how === 'Chụp ảnh mới') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          await ui.alert('Chưa có quyền camera', 'Vào Cài đặt điện thoại để cho phép Thợ Nhanh dùng camera.', 'warning');
          return [];
        }
        res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.6,
          allowsMultipleSelection: !!opts.multiple && limit > 1,
          selectionLimit: opts.multiple ? limit : 1,
        });
      }
      if (res.canceled) return [];
      if (opts.multiple && res.assets.length > limit) ui.toast(`Chỉ thêm được ${limit} ảnh nữa, đã lấy ${limit} ảnh đầu`);
      return res.assets.slice(0, opts.multiple ? limit : 1).map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName, file: a.file ?? null, width: a.width, height: a.height }));
    } catch (e) {
      ui.toast(errMsg(e), 'error');
      return [];
    }
  };
}

/** Chọn + tải ảnh lên, trả về URL */
export function useUploadImages() {
  const pick = usePickImage();
  const ui = useOverlay();
  const [uploading, setUploading] = useState(false);
  const run = async (opts: PickOpts = {}): Promise<string[]> => {
    const imgs = await pick(opts);
    if (!imgs.length) return [];
    setUploading(true);
    const urls: string[] = [];
    let lastError: unknown = null;
    try {
      // Gửi lần lượt; ảnh nào lỗi thì bỏ qua, vẫn giữ các ảnh đã gửi được
      for (const img of imgs) {
        try {
          urls.push(await api.upload(img));
        } catch (e) {
          lastError = e;
        }
      }
    } finally {
      setUploading(false);
    }
    if (lastError) {
      const msg = errMsg(lastError);
      if (urls.length) ui.toast(`${imgs.length - urls.length}/${imgs.length} ảnh chưa gửi được: ${msg}`, 'error');
      else void ui.alert('Chưa gửi được ảnh', msg, 'danger');
    }
    return urls;
  };
  return { run, uploading };
}

/** Lưới ảnh nhỏ: bấm để phóng to, có nút xóa và ô thêm ảnh */
export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  adding,
  max = 6,
  size = 76,
  emptyText,
}: {
  photos: { id?: number; url: string }[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  adding?: boolean;
  max?: number;
  size?: number;
  emptyText?: string;
}) {
  const ui = useOverlay();
  return (
    <View style={styles.grid}>
      {photos.map((p, i) => (
        <Pressable key={p.id ?? p.url} onPress={() => ui.viewImage(p.url)} style={{ width: size, height: size }}>
          <Image source={{ uri: mediaUri(p.url) }} style={[styles.img, { width: size, height: size }]} />
          {onRemove ? (
            <Pressable onPress={() => onRemove(i)} hitSlop={8} style={styles.remove}>
              <Icon name="close" size={13} color="#fff" />
            </Pressable>
          ) : null}
        </Pressable>
      ))}
      {onAdd && photos.length < max ? (
        <Pressable onPress={onAdd} disabled={adding} style={[styles.add, { width: size, height: size }]}>
          {adding ? <ActivityIndicator color={colors.primary} /> : <Icon name="camera-plus-outline" size={24} color={colors.primary} />}
          {!adding ? <Text style={styles.addText}>Thêm ảnh</Text> : null}
        </Pressable>
      ) : null}
      {!photos.length && !onAdd && emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  img: { borderRadius: radius.md, backgroundColor: colors.line },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.dangerMid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  add: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  empty: { fontSize: 13, color: colors.faint },
});
