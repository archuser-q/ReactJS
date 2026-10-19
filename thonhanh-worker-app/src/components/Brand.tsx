/**
 * Chi tiết nhận diện thương hiệu dùng tiết chế (chỉ ở đầu trang màu navy):
 * - CircuitPattern: họa tiết đường mạch điện rất mờ, dồn về bên phải để không đè lên chữ
 * - FocusStatusBar: chữ/biểu tượng trên thanh trạng thái màu trắng khi màn đang hiện có nền tối
 */
import { useIsFocused } from '@react-navigation/native';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const LINE = 'rgba(255,255,255,0.10)';
const NODE = 'rgba(255,255,255,0.16)';

export function CircuitPattern({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[styles.box, { opacity }]}>
      <Svg width={360} height={170} viewBox="0 0 360 170">
        <Path
          d="M360 34 H304 L290 48 H236 M360 66 H322 L308 80 H272 V104 M360 112 H334 L314 132 H254 M240 14 V48 M300 170 V146 L314 132 M190 156 H218 L232 142 H262 M150 0 V18 L164 32 H206"
          stroke={LINE}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
        />
        <Rect x={264} y={6} width={30} height={20} rx={4} stroke={LINE} strokeWidth={2} fill="none" />
        <Path d="M272 6 V0 M286 6 V0 M272 26 V32 M286 26 V32" stroke={LINE} strokeWidth={2} />
        <Circle cx={236} cy={48} r={4} fill={NODE} />
        <Circle cx={272} cy={104} r={4} fill={NODE} />
        <Circle cx={254} cy={132} r={4} fill={NODE} />
        <Circle cx={240} cy={14} r={3.5} fill={NODE} />
        <Circle cx={190} cy={156} r={3.5} fill={NODE} />
        <Circle cx={206} cy={32} r={3.5} fill={NODE} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', top: 0, right: 0, width: 360, height: 170 },
});

/** Đặt kiểu thanh trạng thái chỉ khi màn đang hiện (expo-status-bar xếp chồng: màn rời đi thì trả lại kiểu cũ) */
export function FocusStatusBar({ style }: { style: StatusBarStyle }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} /> : null;
}
