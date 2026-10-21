# Thợ Nhanh – App Khách hàng (React Native / Expo) · v2.0

Frontend **App Khách hàng**, dựng theo bản thiết kế Figma Make, nối với **backend Node.js chung của nhóm**
(repo `nodejs`, nhóm API `/api/customer`) và **đồng bộ với App Thợ v2** (thành viên B): cùng CSDL, cùng bộ điều phối
ghép cặp, cùng kênh realtime Socket.IO, cùng API tải ảnh và bộ bản đồ.

- Expo SDK 57 · React Native 0.86 · TypeScript
- Phạm vi: **dịch vụ thợ điện** (Sửa chữa điện · Lắp đặt thiết bị điện · Đồ điện gia dụng · Đi dây & tủ điện)
- Đăng nhập email / SĐT + mật khẩu, Google, Facebook; quên mật khẩu qua mã email; đổi mật khẩu
- Đặt đơn có **ảnh tình trạng**, giờ hẹn ≥ 60 phút (7:00–21:00); hệ thống tự ghép thợ (khách không chọn chế độ)
- Theo dõi thợ trên **bản đồ thật** (MapLibre + OpenFreeMap, dự phòng Leaflet + OpenStreetMap, miễn phí, không cần API key)
- Xem tiến độ tìm thợ, hạng thợ, chứng chỉ, kiểm tra an toàn điện, **ảnh trước / sau khi sửa**; chat có ảnh; thông báo đẩy (bản build)

---

## 1. Chuẩn bị (làm 1 lần)

1. Cài **Node.js bản LTS** – kiểm tra: `node -v`
2. Trên điện thoại cài app **Expo Go**
3. Điện thoại và máy tính **cùng mạng Wi-Fi**

## 2. Chạy backend trước

Trong thư mục backend `nodejs` (xem `CLAUDE.md` của repo đó):

```bash
docker compose up -d --build          # cách nhanh nhất: API + PostgreSQL/PostGIS + dữ liệu demo
docker compose --profile bots up -d   # (tuỳ chọn) thợ ảo tự nhận và làm đơn khi chưa có app thợ trong tay
```

Không dùng Docker:

```bash
npm install
cp .env.example .env                  # sửa DATABASE_URL
npm run migrate up
npm run seed:demo
npm run dev                           # hoặc: node src/server.js
npm run bots                          # (tuỳ chọn, terminal khác) thợ ảo
```

Tài khoản khách demo: **khach@thonhanh.vn / 12345678** (SĐT 0912000001). Thợ demo để mở app thợ: `tho@thonhanh.vn / 12345678`.

## 3. Chạy app

```bash
npm install
npx expo install --fix
npx expo start -c
```

Quét mã QR bằng Expo Go (Android) hoặc Camera (iPhone).

**Địa chỉ máy chủ:** app tự dùng IP của máy đang chạy Expo, cổng 3000 — không cần sửa `.env` khi đổi Wi-Fi.
Nếu backend chạy ở máy khác: ở màn Đăng nhập bấm **"Máy chủ … · Đổi"**, nhập `IP:3000`, bấm "Kiểm tra & lưu"
(hoặc đặt `EXPO_PUBLIC_API_URL` trong `.env`, xem `.env.example`).

## 4. Thử luồng đầy đủ với app thợ

1. Đăng nhập app khách bằng tài khoản demo, chọn dịch vụ, chụp ảnh chỗ hỏng, bấm **Tìm thợ phù hợp**.
2. Thợ nhận đơn bằng một trong các cách:
   - mở **app thợ** (repo ReactJS, thư mục `thonhanh-worker-app`), đăng nhập `tho@thonhanh.vn`, bật nhận đơn;
   - hoặc bật **thợ ảo**: `docker compose --profile bots up -d` / `npm run bots`.
3. App khách tự cập nhật qua Socket.IO: thợ nhận đơn → đang tới (vị trí trên bản đồ) → đã đến → kiểm tra an toàn → đang sửa
   (báo giá phát sinh để duyệt, ảnh trước/sau) → hoàn thành → thanh toán → đánh giá.

Đóng vai khách bằng script (không cần điện thoại): `npm run demo:customer -- order` trong thư mục backend.

## 5. Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| "Không kết nối được máy chủ" | Backend đang chạy? Cùng Wi-Fi? Windows: mở cổng 3000 trong Firewall (`New-NetFirewallRule -DisplayName "Node 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow`, PowerShell quyền Admin). Hoặc đổi địa chỉ ở màn Đăng nhập. |
| iPhone vẫn không gọi được backend | Cài đặt → Expo Go → bật **Mạng cục bộ**. |
| `EADDRINUSE :3000` khi chạy backend | Đang có server khác giữ cổng: `npx kill-port 3000` rồi chạy lại. |
| Đặt đơn báo cần số điện thoại | Tài khoản Google/Facebook chưa có SĐT: Tài khoản → Thông tin cá nhân → thêm SĐT. |
| Đơn mãi "Đang tìm thợ" rồi tự huỷ | Chưa có thợ đang bật nhận đơn gần đó: mở app thợ và bật nhận đơn, hoặc bật thợ ảo. Đơn đặt ngay chờ tối đa 15 phút (`DISPATCH_MAX_WAIT_MINUTES`). |
| Nút Google / Facebook báo "chưa bật" | Expo Go không nhận kết quả đăng nhập Google/Facebook; cần development build và cấu hình `GOOGLE_*` / `FACEBOOK_*` ở backend. Dùng email để demo. |
| Không nhận thông báo đẩy | Expo Go không hỗ trợ push (SDK 53+). Thông báo vẫn đến qua Socket.IO khi app đang mở. Push cần development build + `PUSH_ENABLED=true`. |
| "Project is incompatible with this version of Expo Go" | `npx expo install expo@latest` rồi `npx expo install --fix`. |

## 6. Cấu trúc thư mục

```
App.tsx                      Điểm vào (SafeAreaProvider + AuthProvider)
src/
  config/env.ts              Địa chỉ máy chủ (tự nhận / .env / nhập trong app), sửa URL ảnh /media
  api/
    client.ts                fetch + token Bearer + timeout, tải ảnh (thu nhỏ + POST /api/uploads)
    types.ts                 Kiểu dữ liệu khớp response backend
    index.ts                 Mỗi hàm = 1 endpoint /api/customer/...
  realtime/socket.ts         Socket.IO: order:updated, worker:location, message:new, notification:new
  auth/AuthContext.tsx       Đăng nhập (email/SĐT, Google, Facebook), lưu token, mở socket
  components/
    auth/                    Ô nhập, nút Google/Facebook
    map/                     Bản đồ (WebView + MapLibre/Leaflet), dùng chung mã với app thợ
    ...                      Icon, Avatar (ảnh/chữ cái), StateView, Screen, BottomNav...
  hooks/                     useApi, useCurrentOrder, usePushRegistration
  utils/                     format (giờ VN, tiền, trạng thái, icon dịch vụ điện), pickImage, cancel
  screens/                   18 màn hình (thêm Đổi mật khẩu)
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
| (trước khi vào app) | Đăng nhập / Đăng ký / Quên mật khẩu / Máy chủ | `LoginScreen` |
| Trang chủ | Thông báo (bấm chuông) | `NotificationsScreen` |
| Tài khoản | Tài khoản | `ProfileScreen` |
| | Đánh giá của tôi | `ReviewsMineScreen` |
| | Phương thức thanh toán | `PaymentMethodsScreen` |
| | Lịch sử giao dịch | `TransactionsScreen` |
| | Thông tin cá nhân (ảnh đại diện, SĐT) | `PersonalInfoScreen` |
| | Đổi / đặt mật khẩu | `ChangePasswordScreen` |
| | Địa chỉ của tôi | `AddressesScreen` |
| | Trung tâm trợ giúp | `HelpCenterScreen` |
| | Liên hệ CSKH | `SupportContactScreen` |

Luồng chính: Trang chủ → chọn dịch vụ → Đặt dịch vụ → Thợ phù hợp → Chọn thợ → Theo dõi → Chat.

## 8. Màn hình nào gọi API nào

Tất cả nằm dưới `/api/customer` (trừ tải ảnh `POST /api/uploads`), gửi header `Authorization: Bearer <token>`.
Chi tiết từng API: `docs/CUSTOMER_API.md` ở repo backend.

| Màn hình | API | Realtime |
|---|---|---|
| Đăng nhập | `POST /auth/login`, `/auth/register`, `/auth/google`, `/auth/facebook`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/providers`, `/auth/me` | mở socket |
| Trang chủ | `GET /catalog/services`, `GET /orders?group=active\|completed`, `GET /notifications/unread-count` | `order:updated`, `notification:new` |
| Đặt dịch vụ | `GET /addresses`, `POST /api/uploads`, `POST /orders` | |
| Thợ phù hợp | `GET /orders/{id}` (trường `searching`), `GET /workers/{id}`, `GET /orders/{id}/tracking`, `POST /orders/{id}/cancel` | `order:updated`, `worker:location` |
| Theo dõi | `GET /orders/{id}` (ảnh, an toàn điện), `GET .../tracking`, `POST .../quotes/{qid}/approve\|reject`, `POST .../payments`, `POST /payments/{id}/sandbox-confirm`, `POST .../complaints`, `POST .../warranty-claim` | `order:updated`, `worker:location` |
| Chat | `GET/POST /orders/{id}/messages` (chữ / ảnh), `POST .../messages/read`, `POST /api/uploads` | `message:new` |
| Đánh giá | `POST /orders/{id}/review` | |
| Lịch sử đơn | `GET /orders?page=&pageSize=` | |
| Tài khoản | `GET /reviews`, `GET /payments`, `DELETE /device-tokens/{token}` (đăng xuất) | |
| Thông tin cá nhân | `PATCH /profile`, `POST /api/uploads` | |
| Đổi mật khẩu | `POST /auth/change-password` | |
| Địa chỉ | `GET/POST/PATCH/DELETE /addresses` (+ GPS bằng `expo-location`) | |
| Thông báo | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | `notification:new` |
| (nền) | `POST /device-tokens` | |

## 9. Ghi chú

- Luồng: Trang chủ → Đặt dịch vụ → Thợ phù hợp (hệ thống mời thợ theo đợt) → Theo dõi → Chat → Thanh toán → Đánh giá.
- Thợ huỷ khi chưa tới nơi: đơn tự quay lại tìm thợ khác, app khách hiện lại "Đang tìm thợ".
- Giờ hẹn gửi lên dạng `...+07:00`, backend trả ISO có múi giờ; app luôn hiển thị theo giờ Việt Nam.
- Bảo hành hiện tạo yêu cầu cho admin xử lý; luồng "tạo đơn bảo hành 0đ cho thợ cũ" đang chờ nhóm chốt (đề xuất ở `docs/CUSTOMER_API.md`).
- Thư viện bản đồ được nhúng trong `src/components/map/mapVendor.ts` (sinh từ script của app thợ, giấy phép ở `LICENSES-map.txt`).
