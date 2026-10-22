/** Bản web: iframe bản đồ tải thư viện từ /vendor (copy sẵn trong public/vendor bởi scripts/embed-map-assets.js) */
export const MAP_HEAD = [
  '<link rel="stylesheet" href="/vendor/maplibre-gl.css"/>',
  '<link rel="stylesheet" href="/vendor/leaflet.css"/>',
  '<script src="/vendor/maplibre-gl.js"></script>',
  '<script src="/vendor/leaflet.js"></script>',
].join('\n');
