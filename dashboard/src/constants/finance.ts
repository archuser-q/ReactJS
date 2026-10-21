import type { TxnType } from '../api/finance'

export const TXN_TYPE: Record<TxnType, { label: string; color: string; help: string }> = {
  earning: { label: 'Thu nhập đơn', color: 'green', help: 'Khách trả online (MoMo/VNPay): cộng tiền đơn trừ hoa hồng vào ví thợ' },
  commission: { label: 'Trừ hoa hồng', color: 'orange', help: 'Khách trả tiền mặt cho thợ: trừ hoa hồng nền tảng khỏi ví' },
  topup: { label: 'Nạp ví', color: 'blue', help: 'Thợ nạp tiền vào ví để bù hoa hồng đơn tiền mặt' },
  withdraw: { label: 'Rút tiền', color: 'purple', help: 'Thợ rút tiền về tài khoản ngân hàng' },
  refund: { label: 'Hoàn tiền', color: 'cyan', help: 'Lệnh rút bị từ chối, tiền được hoàn vào ví' },
  adjustment: { label: 'Điều chỉnh', color: 'default', help: 'Điều chỉnh thủ công' },
}

/** yyyy-mm-dd theo giờ máy (admin ở VN) cho bộ lọc ngày */
export const toDay = (d: { format: (f: string) => string } | null | undefined) => (d ? d.format('YYYY-MM-DD') : undefined)
