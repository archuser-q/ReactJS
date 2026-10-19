/**
 * Ảnh xem toàn màn hình, chụm 2 ngón để phóng to / thu nhỏ, kéo để xem các phần của ảnh.
 * React Native không có sẵn ảnh phóng to được trên Android, nên dùng WebView (đã có trong app cho bản đồ):
 * trình duyệt của máy lo phần phóng to, mượt và giống ứng dụng xem ảnh. Bản web: ZoomImage.web.tsx.
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function ZoomImage({ uri }: { uri: string }) {
  const source = useMemo(() => {
    const m = /^(https?:\/\/[^/]+)\//i.exec(uri);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=6, user-scalable=yes"/>
<style>html,body{margin:0;height:100%;background:#000}body{display:flex;align-items:center;justify-content:center}
img{max-width:100%;max-height:100%;object-fit:contain;-webkit-user-select:none;user-select:none}</style></head>
<body><img src="${esc(uri)}" alt=""/></body></html>`;
    // Cùng gốc với ảnh để không bị chặn "nội dung hỗn hợp" (ảnh http trong trang https)
    return { html, baseUrl: m ? `${m[1]}/` : undefined };
  }, [uri]);
  return (
    <WebView
      source={source}
      originWhitelist={['*']}
      style={styles.web}
      containerStyle={styles.web}
      scalesPageToFit
      setBuiltInZoomControls
      setDisplayZoomControls={false}
      allowFileAccess
      mixedContentMode="always"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#000' },
});
