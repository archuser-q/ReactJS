/**
 * Quy tắc mật khẩu của tài khoản thợ — khớp src/utils/validate.js (password) của backend.
 * Theo hướng dẫn NIST SP 800-63B: ưu tiên ĐỘ DÀI và chặn mật khẩu quá phổ biến; không bắt chữ hoa /
 * ký tự đặc biệt (dễ khiến người dùng đặt kiểu "Abc@1234" rồi ghi ra giấy). Thêm "có cả chữ và số"
 * để chặn mật khẩu toàn số (ngày sinh, số điện thoại) — kiểu hay gặp nhất ở thợ.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

// Giữ đồng bộ với COMMON_PASSWORDS ở backend (máy chủ vẫn kiểm tra lại)
const COMMON = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', '88888888', '12341234', '87654321',
  'password', 'password1', 'password123', 'matkhau', 'matkhau1', 'matkhau123', 'abc12345', 'abcd1234',
  'qwerty123', 'qwertyui', 'iloveyou', 'admin123', 'thonhanh', 'thonhanh1', 'thonhanh123', '123456aa',
  'a1234567', '1234567a', 'aa123456', '1qaz2wsx',
]);

export const passwordChecks = (s: string) => ({
  length: s.length >= PASSWORD_MIN,
  letterAndDigit: /\p{L}/u.test(s) && /\d/.test(s),
});

/** Câu báo lỗi đầu tiên (null = hợp lệ) */
export function passwordProblem(s: string): string | null {
  const c = passwordChecks(s);
  if (!c.length) return `Mật khẩu tối thiểu ${PASSWORD_MIN} ký tự`;
  if (s.length > PASSWORD_MAX) return `Mật khẩu tối đa ${PASSWORD_MAX} ký tự`;
  if (!c.letterAndDigit) return 'Mật khẩu phải có cả chữ và số';
  if (COMMON.has(s.toLowerCase())) return 'Mật khẩu quá phổ biến, dễ bị đoán. Hãy chọn mật khẩu khác';
  return null;
}
