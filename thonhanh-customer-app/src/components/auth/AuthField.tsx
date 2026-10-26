import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { colors, common } from '../../theme';

/** Ô nhập dùng chung cho các màn đăng nhập / đăng ký / quên & đổi mật khẩu */
export function AuthField({ label, icon, secure, ...props }: TextInputProps & { label: string; icon: IconName; secure?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <Text style={common.label}>{label}</Text>
      <View style={styles.field}>
        <Icon name={icon} size={18} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.gray400}
          selectionColor={colors.primary}
          autoCapitalize="none"
          secureTextEntry={secure && !show}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setShow(!show)} hitSlop={8}>
            <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray400} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AuthError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.error}>
      <Icon name="alert-circle-outline" size={16} color={colors.red500} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.gray50,
    borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.gray200,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 12 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12,
    borderRadius: 12, backgroundColor: colors.red50,
  },
  errorText: { flex: 1, fontSize: 12, color: colors.red600, lineHeight: 17 },
});
