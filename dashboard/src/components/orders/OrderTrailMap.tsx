import { useCallback } from 'react'
import L from 'leaflet'
import { Card, Typography } from 'antd'
import type { OrderDetail } from '../../api/orders'
import LeafletMap from '../map/LeafletMap'
import { formatDateTime } from '../../constants/order'

/** Vị trí đơn + vết di chuyển của thợ (app thợ gửi khi đang làm đơn) — phục vụ xử lý tranh chấp */
export default function OrderTrailMap({ data }: { data: OrderDetail }) {
  const { order, trail } = data

  const onReady = useCallback(
    (map: L.Map) => {
      const dest: L.LatLngTuple = [order.lat, order.lng]
      L.circleMarker(dest, { radius: 9, color: '#d4380d', weight: 4, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip('Địa chỉ khách')
        .addTo(map)
      if (trail.length) {
        const pts = trail.map((p) => [p.lat, p.lng] as L.LatLngTuple)
        L.polyline(pts, { color: '#1677ff', weight: 4, opacity: 0.8 }).addTo(map)
        L.circleMarker(pts[0], { radius: 6, color: '#fff', weight: 2, fillColor: '#8c8c8c', fillOpacity: 1 })
          .bindTooltip(`Bắt đầu ${formatDateTime(trail[0].recorded_at)}`)
          .addTo(map)
        L.circleMarker(pts[pts.length - 1], { radius: 7, color: '#fff', weight: 2, fillColor: '#1677ff', fillOpacity: 1 })
          .bindTooltip(`Vị trí cuối ${formatDateTime(trail[trail.length - 1].recorded_at)}`)
          .addTo(map)
        map.fitBounds(L.latLngBounds([...pts, dest]), { padding: [24, 24], maxZoom: 16 })
      } else {
        map.setView(dest, 15)
      }
    },
    [order.lat, order.lng, trail],
  )

  return (
    <Card size="small" title="Bản đồ & vết di chuyển của thợ">
      <LeafletMap key={`${order.id}-${trail.length}`} height={260} onReady={onReady} />
      <Typography.Text type="secondary">
        {trail.length
          ? `${trail.length} điểm vị trí từ ${formatDateTime(trail[0].recorded_at)} đến ${formatDateTime(trail[trail.length - 1].recorded_at)}`
          : 'Chưa có vết di chuyển (thợ chưa xuất phát hoặc app thợ chưa gửi vị trí).'}
      </Typography.Text>
    </Card>
  )
}
