import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Divider, Empty, Flex, Popover, Space, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import type { FileRouteTypes } from '../../routeTree.gen'
import { getPending } from '../../api/dashboard'
import type { PendingCounts } from '../../api/dashboard'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications'
import type { AdminNotification } from '../../api/notifications'
import { formatMoney } from '../../constants/order'
import { ago } from '../../constants/monitor'

const REFRESH_MS = 30_000

type Todo = { key: string; label: string; count: number; to: FileRouteTypes['to'] }

/** Chuông trên header: việc cần xử lý (đếm từ CSDL) + thông báo gửi cho admin (VD hồ sơ thợ chờ duyệt) */
export default function NotificationBell() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingCounts>()
  const [notes, setNotes] = useState<AdminNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, n] = await Promise.all([getPending(), listNotifications({ pageSize: 8 })])
      setPending(p)
      setNotes(n.items)
      setUnread(n.unread)
    } catch {
      // lỗi mạng tạm thời: giữ dữ liệu cũ, lần sau thử lại
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const todos: Todo[] = pending
    ? ([
        { key: 'w', label: 'Hồ sơ thợ cần duyệt', count: pending.workers_to_review, to: '/workers' },
        {
          key: 'wd',
          label: `Lệnh rút tiền chờ duyệt${pending.withdrawals_pending ? ` (${formatMoney(pending.withdrawals_pending_amount)})` : ''}`,
          count: pending.withdrawals_pending,
          to: '/withdrawals',
        },
        { key: 'c', label: 'Khiếu nại của khách', count: pending.complaints_open, to: '/complaints' },
        { key: 'r', label: 'Báo cáo sự cố của thợ', count: pending.reports_open, to: '/complaints' },
        { key: 'm', label: 'Đơn chờ thợ quá 5 phút', count: pending.orders_waiting_long, to: '/monitor' },
      ] as Todo[]).filter((t) => t.count > 0)
    : []
  const total = todos.reduce((s, t) => s + t.count, 0) + unread

  const go = (to: FileRouteTypes['to']) => {
    setOpen(false)
    navigate({ to })
  }

  const openNote = async (n: AdminNotification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id).catch(() => undefined)
      load()
    }
    if (n.type === 'worker_verification') go('/workers')
  }

  const content = (
    <Flex vertical style={{ width: 340 }}>
      <Typography.Text strong>Việc cần xử lý</Typography.Text>
      {todos.length === 0 ? (
        <Typography.Text type="secondary">Không có việc tồn đọng</Typography.Text>
      ) : (
        <Flex vertical>
          {todos.map((t) => (
            <Button key={t.key} type="text" block onClick={() => go(t.to)} style={{ justifyContent: 'space-between', paddingInline: 4 }}>
              <span>{t.label}</span>
              <Badge count={t.count} />
            </Button>
          ))}
        </Flex>
      )}
      <Divider style={{ margin: '8px 0' }} />
      <Flex justify="space-between" align="center">
        <Typography.Text strong>Thông báo</Typography.Text>
        {unread > 0 && (
          <Button size="small" type="link" onClick={() => markAllNotificationsRead().then(load)}>
            Đánh dấu đã đọc
          </Button>
        )}
      </Flex>
      {notes.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
      ) : (
        <Flex vertical gap={4} style={{ maxHeight: 280, overflow: 'auto' }}>
          {notes.map((n) => (
            <Button
              key={n.id}
              type="text"
              block
              onClick={() => openNote(n)}
              style={{ height: 'auto', paddingInline: 4, justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }}
            >
              <Flex vertical>
                <Space size={6}>
                  {!n.is_read && <Badge status="processing" />}
                  <Typography.Text strong={!n.is_read}>{n.title}</Typography.Text>
                </Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {n.body ? `${n.body} · ` : ''}
                  {ago(n.created_at)}
                </Typography.Text>
              </Flex>
            </Button>
          ))}
        </Flex>
      )}
    </Flex>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={open} onOpenChange={(v) => { setOpen(v); if (v) load() }}>
      <Badge count={total} size="small" overflowCount={99}>
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  )
}
