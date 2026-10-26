import { Alert } from 'react-native';

/** Lý do huỷ nhanh (backend bắt buộc gửi lý do) */
const CANCEL_REASONS = ['Đổi ý, không cần nữa', 'Chờ lâu quá', 'Đặt nhầm dịch vụ'];

export function confirmCancel(onReason: (reason: string) => void) {
  Alert.alert('Hủy đơn?', 'Chọn lý do hủy', [
    ...CANCEL_REASONS.map((r) => ({ text: r, onPress: () => onReason(r) })),
    { text: 'Không hủy', style: 'cancel' as const },
  ]);
}
