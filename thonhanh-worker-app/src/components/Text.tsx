/**
 * Text / TextInput dùng chung cho toàn app: luôn dùng font Be Vietnam Pro đúng độ đậm.
 * (Với font tự nạp, mỗi độ đậm là 1 họ chữ riêng — fontWeight của React Native không tự đổi file font,
 *  nên ở đây đọc fontWeight trong style rồi chọn đúng họ chữ.)
 */
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

type Weight = keyof typeof fonts;

function weightOf(style: TextProps['style'], fallback: Weight): Weight {
  const w = (StyleSheet.flatten(style) as TextStyle | undefined)?.fontWeight;
  if (w === undefined || w === null) return fallback;
  if (w === 'bold') return '700';
  if (w === 'normal') return '400';
  const n = Number(w);
  if (Number.isNaN(n)) return fallback;
  if (n >= 800) return '800';
  if (n >= 700) return '700';
  if (n >= 600) return '600';
  if (n >= 500) return '500';
  return '400';
}

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  const w = weightOf(style, '400');
  // Tôn trọng cỡ chữ lớn của máy nhưng giới hạn 130% để bố cục (số tiền, nút) không vỡ khung
  return <RNText ref={ref} maxFontSizeMultiplier={1.3} {...rest} style={[styles.base, style, { fontFamily: fonts[w], fontWeight: 'normal' }]} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...rest }, ref) {
  const w = weightOf(style, '500');
  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={colors.faint}
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[styles.base, style, { fontFamily: fonts[w], fontWeight: 'normal' }]}
    />
  );
});

const styles = StyleSheet.create({
  base: { color: colors.text },
});
