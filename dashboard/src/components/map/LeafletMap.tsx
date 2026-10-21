import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Bản đồ miễn phí OpenStreetMap (cùng nguồn với app thợ), không cần API key
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const HANOI_CENTER: L.LatLngTuple = [21.0285, 105.8542]

type Props = {
  height: number | string
  center?: L.LatLngTuple
  zoom?: number
  /** Gọi 1 lần khi bản đồ sẵn sàng; component cha tự vẽ lớp dữ liệu lên map */
  onReady: (map: L.Map) => void
}

/** Khung bản đồ Leaflet dùng chung (bản đồ giám sát, vết di chuyển của thợ trong chi tiết đơn) */
export default function LeafletMap({ height, center = HANOI_CENTER, zoom = 13, onReady }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const ready = useRef(onReady)
  ready.current = onReady

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { center, zoom, preferCanvas: true })
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map)
    ready.current(map)
    // Drawer / layout đổi kích thước sau khi mount: tính lại khung để không bị ô xám
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      map.remove()
    }
  }, [])

  return <div ref={el} style={{ height, width: '100%', borderRadius: 8, zIndex: 0 }} />
}
