# Thợ Nhanh – App Khách hàng (React Native / Expo)

Frontend **App Khách hàng**, dựng theo bản thiết kế Figma Make và **gắn backend Node.js + Express**
(repo `nodejs`, nhóm API `/api/customer`, chung database PostgreSQL với web quản trị).
Mọi dữ liệu (dịch vụ, đơn, thợ, chat, địa chỉ, thanh toán...) lấy qua API trong `src/api/`;
theo dõi thợ, chat và thông báo cập nhật realtime qua **Socket.IO** (`src/realtime/`).

- Expo SDK 57 · React Native 0.86 · TypeScript
- Không dùng thư viện điều hướng ngoài: một router nhỏ tự viết (giống luồng `useState` của bản thiết kế)

---

## 1. Chuẩn bị (làm 1 lần)

1. Cài **Node.js bản LTS** (https://nodejs.org) – kiểm tra: `node -v`
2. Trên điện thoại cài app **Expo Go** (App Store / Google Play)
3. Điện thoại và máy tính phải **cùng mạng Wi-Fi**

## 2. Chạy backend trước

Trong thư mục backend `nodejs` (cần PostgreSQL + PostGIS):

```bash
npm install
cp .env.example .env              # sửa DATABASE_URL, JWT_SECRET
npm run migrate up                # tạo bảng
npm run seed:dev                  # (dev-tools) dữ liệu mẫu: dịch vụ, 40 thợ quanh Hà Nội, khách demo
npm run dev                       # http://localhost:3000
```

Tài khoản khách demo: **0912345678 / 123456** (hoặc tự đăng ký trong app).
Backend nghe ở `0.0.0.0` nên điện thoại cùng Wi-Fi gọi được.

## 3. Chạy app

Mở terminal tại thư mục project (thư mục có file `package.json`):

```bash
cp .env.example .env        # sửa EXPO_PUBLIC_API_URL = http://<IP máy chạy backend>:3000
npm install
npx expo install --fix
npx expo start -c
```

- Xem IP máy: Windows `ipconfig` (IPv4 Address), Linux/macOS `ip a` / `ifconfig`.
- Đổi `.env` xong phải chạy lại `npx expo start -c`.
- Màn đăng nhập hiện địa chỉ máy chủ đang dùng ở cuối trang để kiểm tra.
- Windows: nếu điện thoại không gọi được backend, mở cổng 3000 trong Windows Firewall.

- `npx expo install --fix` đảm bảo mọi thư viện đúng phiên bản với Expo Go.
- Khi `expo start` chạy sẽ hiện **mã QR** trong terminal:
  - **Android**: mở Expo Go → *Scan QR code* → quét mã.
  - **iPhone**: mở app **Camera** → quét mã → bấm thông báo mở bằng Expo Go.

Lưu code là app tự reload trên điện thoại.

## 4. Test luồng khi chưa có app thợ

Đặt đơn xong, backend chạy thuật toán ghép cặp (Weighted Scoring) và gửi đề xuất cho tối đa 5 thợ phù hợp;
đơn ở trạng thái "Đang tìm thợ". Giả lập thợ bằng script trong thư mục `dev-tools/` của backend (không thuộc phần app khách) (mã đơn xem ở app, dạng `TN261017000012`,
dùng id `12` cũng được):

```bash
npm run simulate -- TN261017000012 accept          # thợ xếp hạng cao nhất nhận đơn
npm run simulate -- TN261017000012 on_the_way
npm run simulate -- TN261017000012 move            # thợ đi thêm 40% quãng đường (chạy vài lần)
npm run simulate -- TN261017000012 msg Em đang tới ạ
npm run simulate -- TN261017000012 arrived
npm run simulate -- TN261017000012 in_progress
npm run simulate -- TN261017000012 quote 50000 Thay van khoá
npm run simulate -- TN261017000012 completed
npm run simulate -- TN261017000012 confirm-cash    # nếu khách chọn tiền mặt
npm run simulate -- TN261017000012 auto            # chạy liền accept → ... → in_progress
```

App cập nhật ngay qua Socket.IO (vẫn hỏi lại server 15 giây/lần phòng khi mất kết nối).
Thanh toán MoMo/VNPay đang là sandbox giả lập: chỉ chạy khi backend để `NODE_ENV` khác `production`.

## 5. Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| Điện thoại không kết nối được | Chạy `npx expo start --tunnel` (lần đầu sẽ hỏi cài `@expo/ngrok`, chọn Yes). Hoặc tắt VPN / kiểm tra cùng Wi-Fi. |
| "Project is incompatible with this version of Expo Go" | Expo Go đã lên SDK mới hơn: `npx expo install expo@latest` rồi `npx expo install --fix`. |
| Lỗi lạ sau khi đổi thư viện | `npx expo start -c` (xóa cache). |
| "Không kết nối được máy chủ" | Kiểm tra `EXPO_PUBLIC_API_URL` đúng IP LAN + cổng 3000, backend đang chạy, cùng Wi-Fi, firewall mở cổng 3000. |
| Đăng nhập báo không phải tài khoản khách | Tài khoản thợ/admin không dùng được app này, đăng ký tài khoản mới. |
| Đặt đơn mãi "Đang tìm thợ", 0 thợ | Chưa có thợ online gần địa chỉ (bán kính theo cấu hình ghép cặp, mặc định 10 km). Chạy `npm run seed:dev` hoặc dùng `simulate ... accept` (tự lấy thợ gần nhất). |
| Ô nhập chữ bị bàn phím che (Android) | Báo lại để chỉnh `KeyboardAvoidingView` trong `src/navigation/CustomerApp.tsx`. |

Muốn xem thử không cần điện thoại: cài Android Studio / Xcode rồi bấm `a` (Android) hoặc `i` (iOS) trong terminal đang chạy Expo.

## 6. Cấu trúc thư mục

```
App.tsx                      Điểm vào (SafeAreaProvider + AuthProvider)
src/
  api/
    client.ts                fetch + token Bearer + timeout + lấy câu lỗi { message } từ backend
    types.ts                 Kiểu dữ liệu khớp response backend Node.js / bảng database
    index.ts                 Mỗi hàm = 1 endpoint (api.createOrder, api.getTracking...)
  realtime/socket.ts         Socket.IO: connectSocket / useSocketEvent (order:updated, message:new...)
  auth/AuthContext.tsx       Đăng nhập/đăng ký/đăng xuất, lưu token bằng expo-secure-store, mở socket
  hooks/
    useApi.ts                useApi (tải + loading/lỗi/làm mới), useInterval (polling dự phòng)
    useCurrentOrder.ts       Tìm đơn đang chạy khi mở tab Theo dõi / Tin nhắn
  utils/format.ts            Ngày giờ (đổi sang giờ VN), tiền, nhãn trạng thái, khoảng cách, icon dịch vụ
  utils/cancel.ts            Hộp chọn lý do hủy đơn
  theme/index.ts             Màu, gradient, shadow (theme xanh lá)
  data/mock.ts               Nội dung tĩnh còn lại: FAQ, thẻ nhận xét nhanh
  navigation/                ScreenName, BACK_MAP, params (orderId, service), shell + thanh tab
  components/                Icon, Avatar, StarRating, PulseDot, Screen/Header, BottomNav,
                             GradientButton, ProfileParts, StateView (đang tải/lỗi/rỗng)
  screens/                   17 màn hình (thêm Đăng nhập, Thông báo)
```

## 7. Danh sách màn hình

| Tab | Màn hình | File |
|---|---|---|
| Trang chủ | Trang chủ | `HomeScreen` |
| | Đặt dịch vụ | `BookScreen` |
| | Thợ phù hợp (ghép cặp) | `MatchScreen` |
| Theo dõi | Theo dõi thợ (bản đồ + tiến trình) | `TrackScreen` |
| Tin nhắn | Chat với thợ | `ChatScreen` |
| Đơn hàng | Lịch sử đơn hàng | `HistoryScreen` |
| | Đánh giá dịch vụ | `ReviewScreen` |
| (trước khi vào app) | Đăng nhập / Đăng ký | `LoginScreen` |
| Trang chủ | Thông báo (bấm chuông) | `NotificationsScreen` |
| Tài khoản | Tài khoản | `ProfileScreen` |
| | Đánh giá của tôi | `ReviewsMineScreen` |
| | Phương thức thanh toán | `PaymentMethodsScreen` |
| | Lịch sử giao dịch | `TransactionsScreen` |
| | Thông tin cá nhân | `PersonalInfoScreen` |
| | Địa chỉ của tôi | `AddressesScreen` |
| | Trung tâm trợ giúp | `HelpCenterScreen` |
| | Liên hệ CSKH | `SupportContactScreen` |

Luồng chính: Trang chủ → chọn dịch vụ → Đặt dịch vụ → Thợ phù hợp → Chọn thợ → Theo dõi → Chat.

## 8. Màn hình nào gọi API nào

Tất cả nằm dưới `/api/customer` (VD `POST /api/customer/orders`), gửi header `Authorization: Bearer <token>`.

| Màn hình | API | Realtime |
|---|---|---|
| Đăng nhập | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | mở socket |
| Trang chủ | `GET /catalog/services`, `GET /orders?group=active\|completed`, `GET /notifications/unread-count` | `order:updated`, `notification:new` |
| Đặt dịch vụ | `GET /addresses`, `POST /orders` | |
| Thợ phù hợp | `GET /orders/{id}`, `GET /workers/{id}`, `GET /orders/{id}/tracking`, `POST /orders/{id}/cancel` | `order:updated`, `worker:location` |
| Theo dõi | `GET /orders/{id}`, `GET .../tracking`, `POST .../quotes/{qid}/approve\|reject`, `POST .../payments`, `POST /payments/{id}/sandbox-confirm`, `POST .../complaints`, `POST .../warranty-claim` | `order:updated`, `worker:location` |
| Chat | `GET/POST /orders/{id}/messages`, `POST .../messages/read` | `message:new` |
| Đánh giá | `POST /orders/{id}/review` | |
| Lịch sử đơn | `GET /orders?page=&pageSize=` | |
| Tài khoản | các API đếm ở trên + `GET /reviews`, `GET /payments` | |
| Thông tin cá nhân | `PATCH /profile` | |
| Địa chỉ | `GET/POST/PATCH/DELETE /addresses` (+ GPS bằng `expo-location`) | |
| Thông báo | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | `notification:new` |

## 9. Ghi chú

- Luồng: Trang chủ → Đặt dịch vụ → Thợ phù hợp (chờ thợ nhận) → Theo dõi → Chat → (hoàn thành) Thanh toán → Đánh giá.
- Bấm đơn trong Lịch sử: đơn chưa có thợ (`pending`/`matching`) mở "Thợ phù hợp", còn lại mở "Theo dõi".
- Giờ hẹn gửi lên dạng `...+07:00`, backend trả ISO có múi giờ; app luôn hiển thị theo giờ Việt Nam.
- Đề xuất cho thợ hết hạn (theo `offer_timeout_seconds` của cấu hình ghép cặp) mà chưa ai nhận thì backend tự gửi tiếp cho nhóm thợ kế tiếp.
- Bảo hành tính từ `warranty_days` của dịch vụ; yêu cầu bảo hành và khiếu nại lưu chung bảng `complaints` (`type = warranty | complaint`) để web quản trị xử lý.
- Bản đồ ở màn Theo dõi vẫn là hình minh hoạ; khoảng cách/ETA tính từ toạ độ thật (Haversine).
- Chưa có: upload ảnh, push FCM, cổng MoMo/VNPay thật, đăng nhập OTP/Google/Facebook.
