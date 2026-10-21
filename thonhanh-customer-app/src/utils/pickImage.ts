import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { LocalImage } from '../api';

/**
 * Chọn ảnh: hỏi "Chụp ảnh" hay "Chọn từ thư viện" rồi trả về danh sách ảnh (rỗng nếu huỷ).
 * Ảnh được thu nhỏ khi tải lên (api/client.ts uploadImage).
 */
export function pickImages({ max = 1 }: { max?: number } = {}): Promise<LocalImage[]> {
  return new Promise((resolve) => {
    const fromCamera = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cần quyền camera', 'Hãy cho phép ứng dụng dùng camera để chụp ảnh.');
        return resolve([]);
      }
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      resolve(r.canceled ? [] : r.assets.map(toLocal));
    };
    const fromLibrary = async () => {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: max > 1,
        selectionLimit: max,
      });
      resolve(r.canceled ? [] : r.assets.slice(0, max).map(toLocal));
    };
    Alert.alert('Thêm ảnh', undefined, [
      { text: 'Chụp ảnh', onPress: () => void fromCamera() },
      { text: 'Chọn từ thư viện', onPress: () => void fromLibrary() },
      { text: 'Huỷ', style: 'cancel', onPress: () => resolve([]) },
    ]);
  });
}

const toLocal = (a: ImagePicker.ImagePickerAsset): LocalImage => ({
  uri: a.uri,
  mimeType: a.mimeType,
  fileName: a.fileName,
  width: a.width,
  height: a.height,
});
