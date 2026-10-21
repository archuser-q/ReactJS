// ── Nội dung tĩnh (không lấy từ backend) ────────────────────────────────────
// Dữ liệu động (dịch vụ, đơn, thợ, chat, địa chỉ...) đã chuyển sang gọi API: xem src/api/

export const REVIEW_TAGS = [
  'Đến đúng giờ',
  'Tay nghề tốt',
  'Giá hợp lý',
  'Thân thiện',
  'Gọn gàng',
  'Báo giá minh bạch',
];

export const FAQS = [
  {
    q: 'Làm sao để đặt thợ điện?',
    a: 'Vào Trang chủ, chọn dịch vụ, chọn địa chỉ đã lưu, chụp ảnh chỗ hỏng (nếu có) và chọn thời gian rồi bấm "Tìm thợ phù hợp". Hệ thống tự mời thợ phù hợp nhất ở gần, thợ nhận đơn là bạn thấy ngay.',
  },
  {
    q: 'Đặt lịch hẹn được giờ nào?',
    a: 'Lịch hẹn cần cách hiện tại ít nhất 60 phút, trong khung 7:00 – 21:00. Sự cố điện cần xử lý gấp thì chọn "Ngay bây giờ".',
  },
  {
    q: 'Thợ có kiểm tra an toàn điện không?',
    a: 'Có. Trước khi sửa, thợ phải xác nhận trên app đã ngắt nguồn, thử điện và mang đồ bảo hộ. Bạn xem được thời điểm xác nhận và ảnh trước / sau khi sửa trong màn Theo dõi đơn.',
  },
  {
    q: 'Tôi có thể hủy đơn đã đặt không?',
    a: 'Bạn hủy được khi đơn đang tìm thợ hoặc thợ vừa nhận đơn. Khi thợ đã trên đường hoặc đang làm, vui lòng liên hệ CSKH.',
  },
  {
    q: 'Thanh toán bằng cách nào?',
    a: 'Sau khi đơn hoàn thành, bạn chọn trả tiền mặt cho thợ hoặc thanh toán qua MoMo / VNPay ngay trong màn Theo dõi đơn.',
  },
  {
    q: 'Thợ báo thêm chi phí phát sinh thì sao?',
    a: 'Mọi chi phí phát sinh đều hiện trong màn Theo dõi đơn để bạn Đồng ý hoặc Từ chối. Chỉ khoản bạn đồng ý mới được cộng vào hóa đơn.',
  },
  {
    q: 'Nếu thợ làm không đạt yêu cầu thì sao?',
    a: 'Đơn hoàn thành có phiếu bảo hành. Trong thời hạn bảo hành, mở đơn ở Lịch sử và bấm "Yêu cầu bảo hành"; ngoài ra bạn có thể gửi khiếu nại cho CSKH.',
  },
];
