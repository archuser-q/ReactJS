import { useState } from 'react'
import { Alert, App, Flex, Segmented, Typography } from 'antd'
import { usePagedList } from '../../hooks/usePagedList'
import { approveWithdrawal, listWithdrawals, rejectWithdrawal } from '../../api/withdrawals'
import type { Withdrawal, WithdrawalListParams, WithdrawalStatus } from '../../api/withdrawals'
import type { ApiError } from '../../api/client'
import { WITHDRAWAL_STATUS } from '../../constants/withdrawal'
import { formatMoney } from '../../constants/order'
import WithdrawalTable from '../withdrawals/WithdrawalTable'
import RejectWithdrawalModal from '../withdrawals/RejectWithdrawalModal'

type View = WithdrawalStatus | 'all'

/** Duyệt lệnh rút tiền của thợ (API của thành viên B) */
export default function WithdrawalsPanel() {
  const { message } = App.useApp()
  const initial: WithdrawalListParams = { page: 1, pageSize: 10, status: 'pending' }
  const { params, data, loading, reload, updateParams } = usePagedList(listWithdrawals, initial)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null)

  const run = async (w: Withdrawal, action: () => Promise<Withdrawal>, done: string) => {
    setBusyId(w.id)
    try {
      await action()
      message.success(done)
      setRejecting(null)
      reload()
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setBusyId(null)
    }
  }

  const pendingTotal = params.status === 'pending' ? (data?.items ?? []).reduce((s, w) => s + w.amount, 0) : 0

  return (
    <Flex vertical gap={16}>
      <Alert
        type="info"
        showIcon
        title="Thợ yêu cầu rút tiền từ ví trên app thợ"
        description="Số tiền đã bị trừ khỏi ví ngay khi thợ gửi yêu cầu. Duyệt = xác nhận đã chuyển khoản; từ chối = hoàn lại tiền vào ví thợ. Nếu backend đang bật WITHDRAWAL_AUTO_APPROVE=true (mặc định khi demo), lệnh rút được duyệt tự động nên trang này chỉ còn lịch sử."
      />
      <Flex vertical gap={16}>
          <Flex justify="space-between" align="center" wrap gap={12}>
            <Segmented<View>
              value={params.status ?? 'all'}
              onChange={(v) => updateParams({ status: v === 'all' ? undefined : v })}
              options={[
                ...Object.entries(WITHDRAWAL_STATUS).map(([value, s]) => ({ value: value as View, label: s.label })),
                { value: 'all', label: 'Tất cả' },
              ]}
            />
            {pendingTotal > 0 && (
              <Typography.Text>
                Trang này đang chờ chuyển: <Typography.Text strong>{formatMoney(pendingTotal)}</Typography.Text>
              </Typography.Text>
            )}
          </Flex>
          <WithdrawalTable
            data={data}
            loading={loading}
            params={params}
            busyId={busyId}
            onPageChange={updateParams}
            onApprove={(w) => run(w, () => approveWithdrawal(w.id), `Đã duyệt lệnh rút #${w.id}`)}
            onReject={setRejecting}
          />
      </Flex>

      <RejectWithdrawalModal
        withdrawal={rejecting}
        loading={!!rejecting && busyId === rejecting.id}
        onCancel={() => setRejecting(null)}
        onSubmit={(note) => rejecting && run(rejecting, () => rejectWithdrawal(rejecting.id, note), `Đã từ chối lệnh rút #${rejecting.id}, tiền đã hoàn vào ví thợ`)}
      />
    </Flex>
  )
}
