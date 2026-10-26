import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Quay lại một màn hình (bấm ←, đổi tab) thì tải lại dữ liệu của màn đó, để thấy ngay thay đổi
 * (VD admin vừa duyệt hồ sơ, khách vừa thanh toán) mà không phải thoát ra vào lại.
 * Lần hiện đầu tiên bỏ qua vì TanStack Query đã tự tải khi màn được dựng.
 */
export function useRefetchOnFocus(...refetchers: Array<() => unknown>) {
  const first = useRef(true);
  const latest = useRef(refetchers);
  latest.current = refetchers;
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      for (const r of latest.current) void r();
    }, []),
  );
}
