# THỢ NHANH — Web quản trị

React 19 + Vite + TanStack Router + Ant Design 6. Gọi backend Node dùng chung của nhóm qua `/api/admin/...` (cookie httpOnly).

## Chạy

Cần backend chạy trước (repo nodejs: `docker compose up -d --build`, cổng 3000).

```bash
npm install
npm run dev          # http://localhost:5173 — Vite proxy /api, /media sang http://localhost:3000
```

Đổi địa chỉ backend: tạo `.env` từ `.env.example`, sửa `VITE_PROXY_TARGET`.

Docker (nginx, cũng proxy `/api` sang backend):

```bash
docker compose up -d --build      # http://localhost:5173
# backend ở máy khác: API_UPSTREAM=http://192.168.1.10:3000 docker compose up -d --build
```

Đăng nhập: `admin@thonhanh.vn` / `12345678`.

Kiểm tra trước khi đẩy code: `npm run typecheck && npm run lint && npm run build`.

## Các trang

| Trang | Việc |
|---|---|
| Tổng quan | số liệu + **việc cần xử lý** (hồ sơ thợ, rút tiền, báo cáo sự cố, đơn chờ lâu) |
| Bản đồ giám sát | đơn đang chạy + vị trí thợ (app thợ gửi lên), tự cập nhật 5 giây, bấm để xem chi tiết |
| Thợ | **hàng chờ duyệt** theo thời gian gửi hồ sơ; **duyệt / từ chối từng giấy tờ** kèm lý do (app thợ hiện lý do dưới đúng giấy) |
| Đơn hàng | chi tiết có ảnh trước/sau của thợ, lịch sử lời mời của bộ ghép cặp, vết di chuyển của thợ |
| Rút tiền | duyệt / từ chối lệnh rút của thợ (từ chối thì tiền hoàn về ví). Cần backend đặt `WITHDRAWAL_AUTO_APPROVE=false`, nếu không lệnh rút được duyệt tự động |
| Khiếu nại | tách **khiếu nại của khách** và **báo cáo sự cố của thợ**; xử lý xong tự báo cho người gửi |
| Ghép cặp | bộ trọng số + chế độ ghép (Tự động / Tức thời / Theo lô, k), **trạng thái bộ điều phối** và đổi nhanh chế độ |

Chuông trên header: việc cần xử lý + thông báo gửi cho admin (VD thợ vừa gửi hồ sơ).

API bổ sung phía backend: `docs/ADMIN_API.md` trong repo nodejs.
