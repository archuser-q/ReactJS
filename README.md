# THỢ NHANH — Giao diện (3 app)

Nền tảng kết nối khách hàng với **thợ điện**. Repo này chứa 3 phần giao diện; cả 3 dùng chung **1 backend Node.js** (repo `nodejs`, cổng 3000) và 1 CSDL PostgreSQL/PostGIS.

| Thư mục | Phần | Công nghệ | API gọi tới | Phụ trách |
|---|---|---|---|---|
| `dashboard/` | Web quản trị | React 19 + Vite + TanStack Router + Ant Design | `/api/admin/...` (cookie) | thành viên nhóm |
| `thonhanh-customer-app/` | App khách hàng | Expo SDK 57 (React Native) | `/api/customer/...` (Bearer JWT) | thành viên nhóm |
| `thonhanh-worker-app/` | App thợ (+ thuật toán ghép cặp, điểm tin cậy ở backend) | Expo SDK 57 (React Native, chạy được cả bản web) | `/api/worker/...` (Bearer JWT) | thành viên B |

```
 App khách ──┐                                   ┌── Socket.IO (cùng cổng 3000): lời mời, trạng thái đơn,
 App thợ   ──┼──> Backend Node.js :3000 ──> PostgreSQL + PostGIS     vị trí thợ, chat, thông báo — đẩy ngay
 Web admin ──┘    (repo nodejs)                                      tới app liên quan, không phải tải lại
```

Đọc code: mỗi thư mục có `README.md` riêng (cấu trúc, màn hình, lỗi thường gặp). Bản đồ toàn hệ thống (luồng nào đi qua file nào ở cả backend lẫn 3 app): `docs/KIEN_TRUC.md` trong repo `nodejs`. Quy tắc khi sửa code: `CLAUDE.md` trong repo `nodejs`.

## Chạy cả hệ thống trên 1 máy

1. **Backend** (repo `nodejs`): `docker compose up -d --build`, kiểm tra http://localhost:3000/api/health ra `{"status":"ok"}`. Lần đầu tự tạo bảng và nạp dữ liệu demo.
2. **Web quản trị**: trong `dashboard/`, `npm install` rồi `npm run dev` → http://localhost:5173 (đăng nhập `admin@thonhanh.vn`).
3. **App thợ**: trong `thonhanh-worker-app/`, `docker compose up -d --build` → bản web http://localhost:8082 (đăng nhập `tho@thonhanh.vn`). Điện thoại thật (Expo Go): xem README của app thợ.
4. **App khách**: trong `thonhanh-customer-app/`, `npm install` rồi `npx expo start --port 8083`, quét QR bằng Expo Go (đăng nhập `khach@thonhanh.vn`). Dùng cổng 8083 để không trùng cổng 8081 của app thợ khi chạy chung 1 máy.

Mật khẩu mọi tài khoản demo: `12345678`.

**Nhiều máy trong cùng Wi-Fi** (VD backend + app khách ở máy bạn A, app thợ ở máy bạn B): app trên máy B vẫn nối được nếu trỏ tới IP LAN của máy A. App thợ và app khách: màn Đăng nhập → "Máy chủ … · Đổi" → `<IP máy A>:3000`. Web quản trị: `VITE_PROXY_TARGET=http://<IP máy A>:3000`. Máy A cần mở cổng 3000 trong tường lửa (chỉ mạng *Private*) và đặt `PUBLIC_BASE_URL=http://<IP máy A>:3000` ở backend để ảnh hiện đúng.

## Kịch bản demo đủ 3 phần (khoảng 5 phút)

1. **App thợ**: đăng nhập `tho@thonhanh.vn`, cho phép vị trí, bật nhận đơn.
2. **App khách**: đăng nhập `khach@thonhanh.vn`, chọn dịch vụ, đặt "Ngay bây giờ" → app thợ hiện lời mời toàn màn hình (khoảng cách, thời gian tới nơi, tiền thực nhận, đếm ngược) → thợ bấm **Nhận đơn**.
3. App khách thấy thợ đang tới trên bản đồ. Thợ vuốt *Bắt đầu di chuyển* → *Đã đến nơi* → tick kiểm tra an toàn điện → *Bắt đầu sửa chữa* → (tuỳ chọn) báo giá phát sinh, khách duyệt → *Hoàn thành* kèm ảnh sau.
4. **App khách** trả tiền (MoMo / VNPay sandbox) → app thợ báo "+… vào ví" ngay → khách đánh giá → điểm tin cậy của thợ được tính lại (app thợ: Hồ sơ → Hiệu suất làm việc).
5. **App thợ**: Thu nhập → Rút tiền → **Web quản trị**: Tài chính → Duyệt rút tiền → app thợ báo đã duyệt.
6. **Web quản trị**: Bản đồ giám sát (đơn + vị trí thợ), Đơn hàng (lịch sử lời mời của bộ ghép cặp), Ghép cặp (đổi chế độ / trọng số), Thợ (duyệt hồ sơ theo từng giấy tờ: đăng ký 1 thợ mới trên app thợ để thử).

Không có đủ người cầm máy: backend có thợ ảo (`docker compose --profile bots up -d`) và khách giả lập (`docker compose exec api npm run demo:customer -- order`), xem README của backend.

## Kiểm tra trước khi đẩy code

| Thư mục | Lệnh |
|---|---|
| `dashboard/` | `npm run typecheck && npm run lint && npm run build` |
| `thonhanh-worker-app/` | `npm run typecheck` |
| `thonhanh-customer-app/` | `npx tsc --noEmit` |

Backend: `npm test` (42 bài, cần PostgreSQL + PostGIS). Không đưa `node_modules`, `.env`, `dist/` lên git.
