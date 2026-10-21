import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import L from 'leaflet'
import { App, Badge, Card, Checkbox, Col, Flex, Row, Space, Statistic, Switch, Table, Tabs, Tag, Typography } from 'antd'
import { getMapData } from '../../api/monitor'
import type { MapData, MapOrder, MapWorker } from '../../api/monitor'
import type { ApiError } from '../../api/client'
import LeafletMap from '../../components/map/LeafletMap'
import SelectionCard from '../../components/monitor/SelectionCard'
import OrderDetailDrawer from '../../components/orders/OrderDetailDrawer'
import WorkerDetailDrawer from '../../components/workers/WorkerDetailDrawer'
import { ORDER_GROUP, WORKER_STATE, ago, groupOf, workerStateOf } from '../../constants/monitor'
import type { OrderGroup, WorkerState } from '../../constants/monitor'
import { ORDER_STATUS } from '../../constants/order'

export const Route = createFileRoute('/_admin/monitor')({
  component: MonitorPage,
})

const REFRESH_MS = 5000
const ORDER_GROUPS = Object.keys(ORDER_GROUP) as OrderGroup[]
const WORKER_STATES = Object.keys(WORKER_STATE) as WorkerState[]

type Selected = { type: 'order' | 'worker'; id: string } | null

/** Nhãn khi rê chuột: dùng textContent để tên người dùng không bị hiểu là HTML */
const label = (text: string) => {
  const el = document.createElement('div')
  el.textContent = text
  return el
}

function MonitorPage() {
  const { message } = App.useApp()
  const [data, setData] = useState<MapData>()
  const [auto, setAuto] = useState(true)
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>(ORDER_GROUPS)
  const [workerStates, setWorkerStates] = useState<WorkerState[]>(WORKER_STATES)
  const [selected, setSelected] = useState<Selected>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [workerId, setWorkerId] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const fitted = useRef(false)

  const load = useCallback(async () => {
    try {
      setData(await getMapData())
    } catch (e) {
      message.error((e as ApiError).message)
    }
  }, [message])

  useEffect(() => {
    load()
    if (!auto) return
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [auto, load])

  const orders = useMemo(() => (data?.orders ?? []).filter((o) => orderGroups.includes(groupOf(o.status))), [data, orderGroups])
  const workers = useMemo(
    () => (data?.workers ?? []).filter((w) => workerStates.includes(workerStateOf(w))),
    [data, workerStates],
  )

  const onReady = useCallback((map: L.Map) => {
    mapRef.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [])

  // Vẽ lại các lớp mỗi lần có dữ liệu mới / đổi bộ lọc / đổi lựa chọn
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer || !data) return
    layer.clearLayers()

    const byId = new Map(data.workers.map((w) => [w.id, w]))
    const isSel = (type: 'order' | 'worker', id: string) => selected?.type === type && selected.id === id

    // Đường nối thợ -> đơn đang phụ trách
    for (const o of orders) {
      const w = o.worker_id ? byId.get(o.worker_id) : undefined
      if (!w) continue
      L.polyline(
        [
          [w.lat, w.lng],
          [o.lat, o.lng],
        ],
        { color: ORDER_GROUP[groupOf(o.status)].color, weight: 2, dashArray: '6 6', opacity: 0.7 },
      ).addTo(layer)
    }

    for (const o of orders) {
      const sel = isSel('order', o.id)
      L.circleMarker([o.lat, o.lng], {
        radius: sel ? 12 : 9,
        color: ORDER_GROUP[groupOf(o.status)].color,
        weight: sel ? 5 : 4,
        fillColor: '#fff',
        fillOpacity: 1,
      })
        .bindTooltip(label(`${o.code} · ${ORDER_STATUS[o.status].label} · ${o.service_name}`))
        .on('click', () => setSelected({ type: 'order', id: o.id }))
        .addTo(layer)
    }

    for (const w of workers) {
      const st = workerStateOf(w)
      const sel = isSel('worker', w.id)
      if (sel) {
        L.circle([w.lat, w.lng], { radius: w.service_radius_km * 1000, color: WORKER_STATE[st].color, weight: 1, fillOpacity: 0.05 }).addTo(layer)
      }
      L.circleMarker([w.lat, w.lng], {
        radius: sel ? 9 : 6,
        color: '#fff',
        weight: 2,
        fillColor: WORKER_STATE[st].color,
        fillOpacity: 1,
      })
        .bindTooltip(label(`Thợ ${w.full_name} · ${WORKER_STATE[st].label}`))
        .on('click', () => setSelected({ type: 'worker', id: w.id }))
        .addTo(layer)
    }

    // Lần đầu có dữ liệu: thu phóng vừa tất cả điểm
    if (!fitted.current) {
      const pts: L.LatLngTuple[] = [...data.orders.map((o) => [o.lat, o.lng] as L.LatLngTuple), ...data.workers.map((w) => [w.lat, w.lng] as L.LatLngTuple)]
      if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 })
      fitted.current = true
    }
  }, [data, orders, workers, selected])

  const focus = (type: 'order' | 'worker', item: MapOrder | MapWorker) => {
    setSelected({ type, id: item.id })
    mapRef.current?.flyTo([item.lat, item.lng], Math.max(mapRef.current.getZoom(), 15), { duration: 0.5 })
  }

  const selOrder = selected?.type === 'order' ? data?.orders.find((o) => o.id === selected.id) : undefined
  const selWorker = selected?.type === 'worker' ? data?.workers.find((w) => w.id === selected.id) : undefined
  const count = (g: OrderGroup) => data?.orders.filter((o) => groupOf(o.status) === g).length ?? 0
  const countW = (s: WorkerState) => data?.workers.filter((w) => workerStateOf(w) === s).length ?? 0

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Bản đồ giám sát
        </Typography.Title>
        <Space>
          <Typography.Text type="secondary">{data ? `Cập nhật ${ago(data.generated_at)}` : 'Đang tải...'}</Typography.Text>
          <Switch checked={auto} onChange={setAuto} checkedChildren="Tự cập nhật" unCheckedChildren="Tạm dừng" />
        </Space>
      </Flex>

      <Row gutter={[16, 16]}>
        {ORDER_GROUPS.map((g) => (
          <Col key={g} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={<Badge color={ORDER_GROUP[g].color} text={`Đơn ${ORDER_GROUP[g].label.toLowerCase()}`} />} value={count(g)} />
            </Card>
          </Col>
        ))}
        {WORKER_STATES.map((s) => (
          <Col key={s} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={<Badge color={WORKER_STATE[s].color} text={`Thợ ${WORKER_STATE[s].label.toLowerCase()}`} />} value={countW(s)} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card size="small" styles={{ body: { padding: 8 } }}>
            <Flex vertical gap={8}>
              <Flex gap={16} wrap>
                <Checkbox.Group<OrderGroup>
                  value={orderGroups}
                  onChange={setOrderGroups}
                  options={ORDER_GROUPS.map((g) => ({ value: g, label: <Badge color={ORDER_GROUP[g].color} text={`Đơn: ${ORDER_GROUP[g].label.toLowerCase()}`} /> }))}
                />
                <Checkbox.Group<WorkerState>
                  value={workerStates}
                  onChange={setWorkerStates}
                  options={WORKER_STATES.map((s) => ({ value: s, label: <Badge color={WORKER_STATE[s].color} text={`Thợ ${WORKER_STATE[s].label.toLowerCase()}`} /> }))}
                />
              </Flex>
              <LeafletMap height="calc(100vh - 330px)" onReady={onReady} />
              <Typography.Text type="secondary">
                Vòng tròn rỗng = đơn hàng, chấm đặc = thợ (vị trí do app thợ gửi lên); chấm nằm trong vòng = thợ đang ở nơi sửa. Nét đứt nối thợ với đơn đang phụ trách. Bấm vào thợ để xem bán kính nhận việc.
              </Typography.Text>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Flex vertical gap={16}>
            <SelectionCard
              order={selOrder}
              worker={selWorker}
              onClose={() => setSelected(null)}
              onOpenOrder={setOrderId}
              onOpenWorker={setWorkerId}
            />
            <Card size="small" styles={{ body: { paddingTop: 0 } }}>
              <Tabs
                items={[
                  {
                    key: 'orders',
                    label: `Đơn đang chạy (${orders.length})`,
                    children: (
                      <Table<MapOrder>
                        rowKey="id"
                        size="small"
                        showHeader={false}
                        pagination={false}
                        dataSource={orders}
                        scroll={{ y: 'calc(100vh - 460px)' }}
                        locale={{ emptyText: 'Không có đơn nào đang chạy' }}
                        onRow={(o) => ({ onClick: () => focus('order', o), style: { cursor: 'pointer' } })}
                        rowClassName={(o) => (selected?.type === 'order' && selected.id === o.id ? 'ant-table-row-selected' : '')}
                        columns={[
                          {
                            key: 'o',
                            render: (_, o) => (
                              <Flex vertical>
                                <Space size={4}>
                                  <Typography.Text strong>{o.code}</Typography.Text>
                                  <Tag color={ORDER_STATUS[o.status].color}>{ORDER_STATUS[o.status].label}</Tag>
                                </Space>
                                <Typography.Text type="secondary">
                                  {o.service_name} · {o.worker_name ?? 'chưa có thợ'} · {ago(o.created_at)}
                                </Typography.Text>
                              </Flex>
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'workers',
                    label: `Thợ (${workers.length})`,
                    children: (
                      <Table<MapWorker>
                        rowKey="id"
                        size="small"
                        showHeader={false}
                        pagination={false}
                        dataSource={workers}
                        scroll={{ y: 'calc(100vh - 460px)' }}
                        locale={{ emptyText: 'Không có thợ nào có vị trí' }}
                        onRow={(w) => ({ onClick: () => focus('worker', w), style: { cursor: 'pointer' } })}
                        rowClassName={(w) => (selected?.type === 'worker' && selected.id === w.id ? 'ant-table-row-selected' : '')}
                        columns={[
                          {
                            key: 'w',
                            render: (_, w) => {
                              const st = WORKER_STATE[workerStateOf(w)]
                              return (
                                <Flex vertical>
                                  <Badge color={st.color} text={<Typography.Text strong>{w.full_name}</Typography.Text>} />
                                  <Typography.Text type="secondary">
                                    {st.label}
                                    {w.current_order_code ? ` · ${w.current_order_code}` : ''} · vị trí {ago(w.location_updated_at)}
                                  </Typography.Text>
                                </Flex>
                              )
                            },
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Flex>
        </Col>
      </Row>

      <OrderDetailDrawer orderId={orderId} onClose={() => setOrderId(null)} onChanged={load} />
      <WorkerDetailDrawer workerId={workerId} onClose={() => setWorkerId(null)} onChanged={load} />
    </Flex>
  )
}
