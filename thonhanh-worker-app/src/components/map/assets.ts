/**
 * Thư viện bản đồ cho WebView trên điện thoại: nhúng thẳng vào HTML (không phụ thuộc CDN).
 * Bản web dùng assets.web.ts (tải file tĩnh /vendor/*, trình duyệt tự cache) để gói JS web không phình to.
 */
import { LEAFLET_CSS, LEAFLET_JS, MAPLIBRE_CSS, MAPLIBRE_JS } from './mapVendor';

const safe = (js: string) => js.replace(/<\/script/gi, '<\\/script');

export const MAP_HEAD = [
  `<style>${MAPLIBRE_CSS}</style>`,
  `<style>${LEAFLET_CSS}</style>`,
  `<script>${safe(MAPLIBRE_JS)}</script>`,
  `<script>${safe(LEAFLET_JS)}</script>`,
].join('\n');
