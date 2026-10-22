/**
 * Kiểm tra mật khẩu giống backend (`password()` trong src/utils/validate.js, dùng chung với app thợ):
 * 8–72 ký tự, có cả chữ và số, không nằm trong danh sách mật khẩu quá phổ biến.
 * Trả về câu báo lỗi, hoặc null nếu hợp lệ. Backend vẫn kiểm tra lại.
 */
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', '88888888', '12341234', '87654321',
  'password', 'password1', 'password123', 'matkhau', 'matkhau1', 'matkhau123', 'abc12345', 'abcd1234',
  'qwerty123', 'qwertyui', 'iloveyou', 'admin123', 'thonhanh', 'thonhanh1', 'thonhanh123', '123456aa',
  'a1234567', '1234567a', 'aa123456', '1qaz2wsx',
]);

/** Từng điều kiện để hiện danh sách tick xanh khi gõ (giống app thợ) */
export const passwordChecks = (s: string) => ({
  length: s.length >= 8,
  letterAndDigit: /\p{L}/u.test(s) && /\d/.test(s),
});

export const PASSWORD_HINT = 'Tối thiểu 8 ký tự, có chữ và số';

export function passwordError(pw: string, label = 'Mật khẩu'): string | null {
  if (pw.length < 8) return `${label} tối thiểu 8 ký tự`;
  if (pw.length > 72) return `${label} tối đa 72 ký tự`;
  if (!/\p{L}/u.test(pw) || !/\d/.test(pw)) return `${label} phải có cả chữ và số`;
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return `${label} quá phổ biến, dễ bị đoán. Hãy chọn mật khẩu khác`;
  return null;
}
