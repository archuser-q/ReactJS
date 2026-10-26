import { View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme';

export function StarRating({ value, max = 5, size = 12 }: { value: number; max?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        return (
          <Icon
            key={i}
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.amber400 : colors.gray200}
          />
        );
      })}
    </View>
  );
}
