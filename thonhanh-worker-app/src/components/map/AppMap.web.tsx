/** Bản đồ cho bản web: trang bản đồ chạy trong iframe (srcDoc), giao tiếp bằng postMessage */
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { mapHtml } from './mapHtml';
import type { AppMapProps } from './AppMap';
import { colors } from '../../theme';

export type { MapData, MapMarker, MapPadding } from './mapHtml';

export function AppMap({ data, height, style, onPress }: AppMapProps) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => mapHtml(), []);
  const json = JSON.stringify(data);
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (!ref.current || ev.source !== ref.current.contentWindow) return;
      const d = ev.data as { __tnmap?: boolean; payload?: { type: string; lat?: number; lng?: number } };
      if (!d?.__tnmap || !d.payload) return;
      if (d.payload.type === 'ready') setReady(true);
      if (d.payload.type === 'click' && d.payload.lat !== undefined && d.payload.lng !== undefined) {
        pressRef.current?.(d.payload.lat, d.payload.lng);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (ready) ref.current?.contentWindow?.postMessage({ __tnmap_set: true, data: JSON.parse(json) }, '*');
  }, [ready, json]);

  return (
    <View style={[styles.box, height !== undefined && { height }, style]}>
      {createElement('iframe', {
        ref,
        srcDoc: html,
        title: 'Bản đồ',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: colors.mapBg },
});
