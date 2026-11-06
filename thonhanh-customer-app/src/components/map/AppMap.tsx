/** Bản đồ trong app khách (react-native-webview) — dùng chung mã bản đồ với app thợ (MapLibre + OpenFreeMap, dự phòng Leaflet + OpenStreetMap) */
import { useEffect, useMemo, useRef, useState, type ComponentType, type RefAttributes } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import RNWebView, { type WebViewMessageEvent } from 'react-native-webview';
import type { AndroidWebViewProps, IOSWebViewProps } from 'react-native-webview/lib/WebViewTypes';
import { mapHtml, type MapData } from './mapHtml';
import { colors } from '../../theme';

export type { MapData, MapMarker, MapPadding } from './mapHtml';

/**
 * react-native-webview 14: kiểu chung của gói là bản "nền tảng không hỗ trợ" (bản thật nằm ở WebView.android/.ios),
 * TypeScript không biết chọn theo nền tảng nên ép về đúng kiểu props của Android/iOS và phần ref app dùng.
 */
type WebViewHandle = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as ComponentType<IOSWebViewProps & AndroidWebViewProps & RefAttributes<WebViewHandle>>;

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
  const ref = useRef<WebViewHandle>(null);
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
        applicationNameForUserAgent="ThoNhanhKhachHang/1.0"
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
