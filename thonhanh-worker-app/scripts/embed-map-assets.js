/**
 * Đóng gói thư viện bản đồ vào app để KHÔNG phụ thuộc CDN (chỉ ảnh/dữ liệu nền bản đồ cần Internet):
 *   - MapLibre GL 5 (bản đồ vector, nền OpenFreeMap — miễn phí, không cần API key)
 *   - Leaflet 1.9 (dự phòng: máy không có WebGL hoặc không tải được OpenFreeMap -> nền OpenStreetMap)
 *
 * Ghi ra:
 *   src/components/map/mapVendor.ts   chuỗi JS/CSS nhúng thẳng vào WebView (Android/iOS)
 *   public/vendor/*                   file tĩnh cho bản web (iframe tải bằng <script src>, trình duyệt tự cache)
 *
 * Chạy lại khi đổi phiên bản:
 *   npm i --no-save maplibre-gl@5.24.0 leaflet@1.9.4 && node scripts/embed-map-assets.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ml = path.dirname(require.resolve('maplibre-gl/package.json', { paths: [root, process.cwd()] }));
const lf = path.dirname(require.resolve('leaflet/package.json', { paths: [root, process.cwd()] }));
const mlVersion = require(path.join(ml, 'package.json')).version;
const lfVersion = require(path.join(lf, 'package.json')).version;

const files = {
  MAPLIBRE_JS: fs.readFileSync(path.join(ml, 'dist/maplibre-gl.js'), 'utf8'),
  MAPLIBRE_CSS: fs.readFileSync(path.join(ml, 'dist/maplibre-gl.css'), 'utf8'),
  LEAFLET_JS: fs.readFileSync(path.join(lf, 'dist/leaflet.js'), 'utf8'),
  LEAFLET_CSS: fs.readFileSync(path.join(lf, 'dist/leaflet.css'), 'utf8'),
};

const header = `/* eslint-disable */
// File sinh tự động bởi scripts/embed-map-assets.js — KHÔNG sửa tay.
// MapLibre GL JS ${mlVersion} (BSD-3-Clause, © MapLibre contributors) · Leaflet ${lfVersion} (BSD-2-Clause, © Volodymyr Agafonkin)
`;
const body = Object.entries(files)
  .map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`)
  .join('\n');
fs.writeFileSync(path.join(root, 'src/components/map/mapVendor.ts'), `${header}${body}\n`);

const vendor = path.join(root, 'public/vendor');
fs.mkdirSync(vendor, { recursive: true });
fs.writeFileSync(path.join(vendor, 'maplibre-gl.js'), files.MAPLIBRE_JS);
fs.writeFileSync(path.join(vendor, 'maplibre-gl.css'), files.MAPLIBRE_CSS);
fs.writeFileSync(path.join(vendor, 'leaflet.js'), files.LEAFLET_JS);
fs.writeFileSync(path.join(vendor, 'leaflet.css'), files.LEAFLET_CSS);
fs.writeFileSync(
  path.join(vendor, 'LICENSES.txt'),
  `MapLibre GL JS ${mlVersion} — BSD-3-Clause\n${fs.readFileSync(path.join(ml, 'LICENSE.txt'), 'utf8')}\n\nLeaflet ${lfVersion} — BSD-2-Clause\n${fs.readFileSync(path.join(lf, 'LICENSE'), 'utf8')}\n`,
);
console.log(`MapLibre ${mlVersion} + Leaflet ${lfVersion} -> mapVendor.ts & public/vendor`);
