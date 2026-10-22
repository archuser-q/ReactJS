import { getItem, setItem } from './storage';

/**
 * Màn "Hoàn thiện hồ sơ" tự mở sau khi đăng ký / đăng nhập nếu thợ chưa gửi hồ sơ.
 * Thợ bấm X (bỏ qua) thì máy này không tự mở nữa với tài khoản đó; vẫn vào lại được từ
 * thẻ ở Trang chủ hoặc Hồ sơ → Giấy tờ xác minh.
 */
const key = (userId: number) => `thonhanh_onboarding_skipped_${userId}`;

export async function isOnboardingSkipped(userId: number): Promise<boolean> {
  return (await getItem(key(userId))) === '1';
}

export async function markOnboardingSkipped(userId: number): Promise<void> {
  await setItem(key(userId), '1');
}
