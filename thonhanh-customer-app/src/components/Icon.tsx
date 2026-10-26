import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Wrapper icon duy nhất của app – đổi thư viện icon chỉ cần sửa file này */
export function Icon({ name, size = 18, color = colors.text, style }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}
