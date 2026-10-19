/** Bản đồ trên điện thoại (react-native-webview). Bản web: AppMap.web.tsx */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { mapHtml, type MapData } from './mapHtml';
import { colors } from '../../theme';

export type { MapData, MapMarker, MapPadding } from './mapHtml';

export type AppMapProps = {
  data: MapData;
  height?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: (lat: number, lng: number) => void;
  /**
   * Bản đồ nằm trong trang cuộn được: báo lúc ngón tay đang chạm bản đồ để trang tạm khóa cuộn,
   * nhờ vậy kéo/chụm 2 ngón chỉ di chuyển, phóng to bản đồ chứ không cuộn cả trang.
   */
  onTouchActive?: (active: boolean) => void;
};

export function AppMap({ data, height, style, onPress, onTouchActive }: AppMapProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  // Giữ nguyên object source giữa các lần render để WebView không nạp lại trang (~1,3 MB) mỗi khi màn hình cập nhật
  const source = useMemo(() => ({ html: mapHtml(), baseUrl: 'https://thonhanh.app/' }), []);
  const json = JSON.stringify(data);

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.__setData && window.__setData(${json}); true;`);
  }, [ready, json]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { type: string; lat?: number; lng?: number };
      if (m.type === 'ready') setReady(true);
      if (m.type === 'click' && m.lat !== undefined && m.lng !== undefined) onPress?.(m.lat, m.lng);
    } catch {
      // bỏ qua
    }
  };

  return (
    <View
      style={[styles.box, height !== undefined && { height }, style]}
      onTouchStart={onTouchActive ? () => onTouchActive(true) : undefined}
      onTouchEnd={onTouchActive ? () => onTouchActive(false) : undefined}
      onTouchCancel={onTouchActive ? () => onTouchActive(false) : undefined}
    >
      <WebView
        ref={ref}
        originWhitelist={['*']}
        // Có địa chỉ gốc https -> trình duyệt gửi Referer, đúng chính sách của máy chủ bản đồ OpenStreetMap
        source={source}
        applicationNameForUserAgent="ThoNhanhDoiTac/1.0"
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        // Không cho WebView tự phóng to cả trang HTML: chụm 2 ngón chỉ do bản đồ xử lý
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        // Android: WebView giữ cử chỉ, không để trang cuộn bên ngoài giành lấy
        nestedScrollEnabled={!!onTouchActive}
        overScrollMode="never"
        style={{ backgroundColor: colors.mapBg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: colors.mapBg },
});
