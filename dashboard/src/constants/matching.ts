import type { MatchingMode, WeightKey } from '../api/matching'

export const MODES: { value: MatchingMode; label: string; color: string; help: string }[] = [
  { value: 'auto', label: 'Tự động', color: 'purple', help: 'Mỗi vài giây hệ thống tự chọn: đơn không tranh thợ với đơn nào gửi ngay cho top-k thợ (như tức thời); nhóm đơn cùng cần 1 nhóm thợ thì ghép tối ưu bằng Hungarian (như theo lô). Khuyến nghị.' },
  { value: 'instant', label: 'Tức thời', color: 'blue', help: 'Mỗi đơn gửi ngay cho k thợ điểm cao nhất (Greedy); hết thời gian chờ thì gửi đợt tiếp theo.' },
  { value: 'batch', label: 'Theo lô', color: 'gold', help: 'Gom đơn trong cửa sổ lô rồi ghép tối ưu toàn cục bằng Hungarian, mỗi đơn mời đúng 1 thợ.' },
]

export const WEIGHTS: { key: WeightKey; label: string; short: string; help: string }[] = [
  { key: 'w_distance', label: 'Khoảng cách', short: 'KC', help: 'Thợ càng gần khách điểm càng cao' },
  { key: 'w_trust', label: 'Điểm tin cậy', short: 'TC', help: 'Lấy từ thuật toán Trust Score' },
  { key: 'w_skill', label: 'Phù hợp kỹ năng', short: 'KN', help: 'Số năm kinh nghiệm ở đúng danh mục dịch vụ' },
  { key: 'w_acceptance', label: 'Tỉ lệ nhận đơn', short: 'NĐ', help: 'Thợ hay nhận đơn được ưu tiên hơn thợ hay từ chối' },
  { key: 'w_workload', label: 'Khối lượng việc', short: 'KL', help: 'Thợ ít việc trong ngày được ưu tiên để chia đều đơn' },
]

export const CRITERIA_OF: Record<WeightKey, 'distance' | 'trust' | 'skill' | 'acceptance' | 'workload'> = {
  w_distance: 'distance',
  w_trust: 'trust',
  w_skill: 'skill',
  w_acceptance: 'acceptance',
  w_workload: 'workload',
}

export const HANOI_DISTRICTS = [
  { name: 'Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
  { name: 'Ba Đình', lat: 21.0341, lng: 105.8146 },
  { name: 'Cầu Giấy', lat: 21.0362, lng: 105.7906 },
  { name: 'Đống Đa', lat: 21.0181, lng: 105.8292 },
  { name: 'Thanh Xuân', lat: 20.9946, lng: 105.8099 },
  { name: 'Hai Bà Trưng', lat: 21.0059, lng: 105.8573 },
  { name: 'Hoàng Mai', lat: 20.9745, lng: 105.8635 },
  { name: 'Tây Hồ', lat: 21.0705, lng: 105.8188 },
  { name: 'Long Biên', lat: 21.0367, lng: 105.8946 },
]