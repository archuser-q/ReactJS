# Thợ Nhanh Đối Tác — App Thợ điện

App dành cho thợ điện của nền tảng THỢ NHANH: đăng ký & xác minh hồ sơ, bật/tắt nhận đơn, nhận lời mời từ thuật toán ghép cặp, làm việc tại nhà khách (dẫn đường, vuốt cập nhật tiến độ, **kiểm tra an toàn điện**, ảnh trước/sau, báo giá phát sinh theo bảng giá), nhận tiền qua ví (khách trả MoMo / VNPay, không tiền mặt), theo dõi thu nhập, rút tiền, đánh giá, hạng thợ.

**Expo SDK 57 · React Native 0.86 · React 19 · TypeScript** — chạy Android, iOS và **web** (để demo bằng trình duyệt).

| Thư mục | Nội dung |
|---|---|
| `src/` | Mã nguồn app |
| `docs/THIET_KE_APP_THO.md` | Thiết kế: use case, luồng, máy trạng thái, **thuật toán ghép cặp**, bộ điều phối, ví, CSDL, API, giao diện, kiểm thử, thực nghiệm — dùng cho Chương 3–5 |
| `docs/thuc-nghiem-ghep-cap/` | Kết quả thực nghiệm Greedy vs Hungarian vs tự động (CSV, bảng, biểu đồ) — chạy từ backend: `npm run benchmark` |
| `docs/DE_XUAT_CHINH_SUA.md` | Đề xuất sửa đề cương & nội dung chi tiết |

Backend: **Node.js (Express) của nhóm**, gói `backend-node` — API app thợ `/api/worker` (cổng 3000), tài liệu `docs/WORKER_API.md`, `docs/MATCHING.md` trong gói đó.

## Chạy bằng Docker

Cần chạy **backend trước** (gói `backend-node`: vào thư mục đó, `docker compose up -d --build`, kiểm tra http://localhost:3000/api/health). Sau đó tại thư mục này:

```bash
docker compose up -d --build        # lần đầu 3–5 phút
```
Mở **http://localhost:8082** — trên máy tính app hiện trong khung điện thoại. Tài khoản demo (mật khẩu `12345678`):

| Tài khoản | Dùng để |
|---|---|
| `tho@thonhanh.vn` | Thợ đã duyệt, có sẵn 6 tuần lịch sử (~100 đơn, 4,8 sao, hạng Thợ Vàng) — demo chính |
| `tho2@thonhanh.vn` | Thợ thứ 2 (demo 2 thợ cùng nhận lời mời) |
| `tho.moi@thonhanh.vn` | Thợ vừa gửi hồ sơ, đang chờ admin duyệt (vào app được, chưa bật nhận đơn được) |

App tự gọi API ở `http://<máy đang mở web>:3000/api`. Backend ở máy khác thì đặt `API_URL` (xem `.env.example`) rồi `docker compose up -d`.
Bản 2.0.0 trở đi chỉ chạy với backend Node; backend FastAPI cũ (cổng 8000) không còn dùng — nhớ `docker compose down` bản cũ.
Bản 2.1.0 cần backend cùng đợt (bỏ tiền mặt / nạp ví, `PUT /skills` nhận `category_ids`, trường `review_state`): cập nhật cả 2 gói cùng lúc.

### Kịch bản demo 5 phút (không cần app khách)
Các lệnh `demo:customer` chạy trong thư mục **backend-node** (đóng vai khách hàng, gọi đúng API app khách):

1. Đăng nhập `tho@thonhanh.vn`, cho phép vị trí, **bấm thẻ "Đang tạm nghỉ"** để bật nhận đơn. (Trình duyệt chặn vị trí thì app gợi ý chọn vị trí mô phỏng trên bản đồ.)
2. `docker compose exec api npm run demo:customer -- order` → lời mời hiện ra ngay (bản đồ, số tiền thực nhận, đếm ngược) → **Nhận đơn**.
3. Vuốt *Bắt đầu di chuyển* → *Đã đến nơi* → tick **kiểm tra an toàn điện** → vuốt *Bắt đầu sửa chữa* (chụp ảnh hiện trạng).
4. **Báo giá phát sinh** → chọn mục trong bảng giá (giá cố định, chỉ chọn số lượng) hoặc thêm *mục ngoài bảng giá* → gửi; khách duyệt: `docker compose exec api npm run demo:customer -- quote <mã đơn>` (mã đơn như trên app, VD `TN261019000152`, hoặc số id). Khi chưa duyệt, app ghi rõ "khách đồng ý thì bạn nhận thêm …".
5. Vuốt *Hoàn thành* (chụp ảnh sau). Màn làm việc hiện "Chờ khách thanh toán qua app". Khách trả (MoMo sandbox) và đánh giá:
   `... demo:customer -- pay <mã đơn>` → app thợ báo đã nhận tiền → `... demo:customer -- review <mã đơn> --stars 5`.
6. Tab **Thu nhập**: ví cộng 85% tiền đơn (đã trừ phí 15%); thử *Rút tiền* → lệnh chờ duyệt ở web quản trị (Tài chính → Duyệt rút tiền), admin duyệt xong app báo ngay.
   Tab **Hồ sơ → Hiệu suất làm việc**: điểm tin cậy và 3 thành phần (đánh giá, giữ lời, khiếu nại) vừa được tính lại sau đơn này.
   Không có tiền mặt: khách còn đơn chưa trả thì chưa đặt được đơn mới (lệnh `rush` tự trả giúp).
7. Thuật toán ghép cặp khi đông đơn: `docker compose --profile bots up -d` (thợ ảo) rồi `... demo:customer -- rush --count 12`, xem `docker compose exec api npm run demo:customer -- show <mã đơn>` (đơn nào đi Greedy, đơn nào đi Hungarian).

### Chạy trên điện thoại thật (Expo Go)
Điện thoại và máy tính **cùng Wi-Fi** (không dùng Wi-Fi khách / Wi-Fi trường chặn các máy thấy nhau), điện thoại cài **Expo Go** bản hỗ trợ SDK 57, backend đang chạy.

1. Lấy IP LAN của máy tính: `ipconfig` → mục *Wireless LAN adapter Wi-Fi* → **IPv4 Address** (VD `192.168.1.23`).
2. Kiểm tra mạng: trên trình duyệt điện thoại mở `http://192.168.1.23:3000/api/health` — thấy `{"status":"ok"}` là thông. Không vào được thì xem mục *Tường lửa* bên dưới.
3. Tại thư mục này: `copy .env.example .env` (Linux/macOS: `cp`), sửa dòng `HOST_IP=192.168.1.23`, rồi:
   ```bash
   docker compose --profile dev up -d --build -V worker-dev   # dựng + chạy nền (lần đầu 3–5 phút)
   docker compose --profile dev logs -f worker-dev             # xem log: chờ hiện mã QR (Ctrl+C chỉ thoát xem log, Expo vẫn chạy)
   ```
   Chờ hiện mã QR và dòng `Metro: exp://192.168.1.23:8081`. Chạy nền (`-d`) rồi xem log ổn định hơn chạy `up` trực tiếp trên cmd/PowerShell của Windows (có lúc `up` đứng ở bước *Recreated* mà container không chạy). `--build -V` dựng lại image và thư mục `node_modules` trong container — cần mỗi khi chép bản app mới (có thể thêm thư viện); lần sau chạy lại cùng bản thì bỏ cũng được.
4. Android: mở Expo Go → **Scan QR code**. iPhone: mở app **Camera** quét QR. Lần đầu tải app mất khoảng 1 phút.
5. Đăng nhập `tho@thonhanh.vn` / `12345678`, cho phép vị trí. Đơn demo (`demo:customer -- order`) tự đặt quanh vị trí thật của điện thoại.

Có Node.js 20+ thì thay bước 3 bằng `npm install` rồi `npx expo start` (máy có nhiều card mạng thì đặt trước `set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.23`).

**Tường lửa Windows**: đặt mạng Wi-Fi đang dùng là *Private* (Settings → Network & Internet → Wi-Fi → tên mạng → *Private network*), rồi mở PowerShell **Run as administrator**:
```powershell
New-NetFirewallRule -DisplayName "Tho Nhanh demo" -Direction Inbound -Protocol TCP -LocalPort 3000,8081,8082 -Action Allow -Profile Private
# Demo xong muốn đóng lại: Remove-NetFirewallRule -DisplayName "Tho Nhanh demo"
```

App tự gọi API ở `http://<IP máy tính>:3000/api`; đổi Wi-Fi thì sửa ở màn **Máy chủ** (dòng "Máy chủ: …" cuối màn đăng nhập). Ở backend nên đặt `PUBLIC_BASE_URL=http://<IP máy tính>:3000` để ảnh hiện đúng trên mọi app. Trong Expo Go: đăng nhập Google/Facebook và thông báo đẩy không dùng được (giới hạn của Expo Go) — dùng tài khoản email; lời mời nhận đơn vẫn đến ngay qua kênh realtime (Socket.IO).

Cách nhanh không cần Expo Go: mở `http://192.168.1.23:8082` bằng trình duyệt điện thoại (bản web). Trình duyệt chặn GPS trên địa chỉ `http://` không phải localhost, nên app gợi ý chọn vị trí mô phỏng.

## Giao diện

- Màu: **navy** (vỏ tủ điện) làm chủ đạo, **vàng an toàn** `#FFC21A` là màu nhấn duy nhất cho hành động chính; chữ **Be Vietnam Pro**.
- Nhận diện: họa tiết đường mạch điện rất mờ ở đầu trang màu navy; vùng nội dung để sạch cho dễ đọc ngoài nắng.
- Trang chủ **không có bản đồ** (giống app đối tác bTaskee/Rada, không phải app tài xế): thẻ trạng thái với công tắc bật/tắt nhận đơn → khi có việc thì thẻ việc thay chỗ công tắc ("Bận") → số liệu hôm nay → lịch hẹn sắp tới.
- Màn làm việc: bản đồ nhỏ khi còn di chuyển (chạm để xem toàn màn hình), tự ẩn khi đã đến nơi; thanh tiến độ 5 bước; nút **vuốt để xác nhận** ở đáy để không bấm nhầm khi đang đi đường.
- Đơn hẹn trước chỉ bắt đầu di chuyển được trong 60 phút trước giờ hẹn; báo giá phát sinh chỉ sau khi đã đến nơi.
- Đang có việc vẫn chọn được *Nhận đơn mới khi xong việc này* (giống "nghỉ sau chuyến này" của app tài xế).
- Lời mời: đếm ngược (mặc định 60 giây, admin chỉnh), giá **tạm tính** (công cơ bản theo bảng giá; vật tư / việc làm thêm báo giá sau khi xem tận nơi).
- Bản đồ chỉ hiện vị trí thợ và khách (không vẽ đường chim bay); kéo/chụm được ở mọi màn, nút ⌖ căn lại; ở trang cuộn thì chạm bản đồ là trang tạm ngừng cuộn.
- Ảnh: tối đa 6 ảnh trước + 6 ảnh sau mỗi đơn, thu nhỏ trước khi gửi; bấm ảnh bất kỳ để xem toàn màn hình, chụm 2 ngón để phóng to.
- Giấy tờ đã duyệt: gửi ảnh mới để cập nhật, ảnh cũ vẫn hiệu lực tới khi admin duyệt; đánh giá ≤ 3 sao có nút *Khiếu nại*; số sao hiện ngay ở danh sách đơn đã hoàn thành.
- Ghép đơn mặc định **tự động (hybrid)**: đơn lẻ gửi ngay, nhiều đơn tranh cùng thợ thì giải Hungarian (xem `docs/THIET_KE_APP_THO.md` mục 6.6, 13).

## Màn hình

```
Đăng nhập ─ Đăng ký ─ Quên mật khẩu (mã 6 số qua email) ─ Máy chủ
Hoàn thiện hồ sơ (tự mở sau khi đăng ký, nút X để bỏ qua): Thông tin (SĐT, số năm kinh nghiệm) → Nhóm dịch vụ → Giấy tờ → Gửi duyệt
Tab chính (mọi thợ; chưa duyệt thì không bật nhận đơn được):
├─ Trang chủ    thẻ hồ sơ khi chưa duyệt (nộp giấy tờ / chờ duyệt / bị từ chối kèm lý do),
│               trạng thái nhận đơn (công tắc) hoặc việc đang làm, số liệu hôm nay / 7 ngày, lịch hẹn
├─ Công việc    Đang làm (gồm lịch hẹn) · Hoàn thành · Đã hủy (ghi ai huỷ, gồm cả đơn bạn đã huỷ nhận)  →  Màn làm việc  →  Chat
├─ Thu nhập     Ngày/Tuần/Tháng + biểu đồ, so với cùng kỳ, ví → Lịch sử ví, Rút tiền, Ngân hàng
└─ Hồ sơ        Thẻ đối tác (hạng, đánh giá, số đơn, điểm tin cậy) + tiến độ lên hạng, Thông tin cá nhân, Kỹ năng,
                Giấy tờ, Khu vực nhận việc, Đánh giá, Hiệu suất 30 ngày + giải thích điểm tin cậy, Trợ giúp, Báo cáo sự cố
Toàn cục: Lời mời nhận đơn (hiện đè lên mọi màn: rung, đếm ngược, bản đồ, thu nhập thực nhận) · Thông báo
          · Báo ngay khi admin duyệt / từ chối / bỏ duyệt hồ sơ (không cần thoát app)
Mọi màn có dữ liệu: kéo xuống để tải lại; quay lại màn (bấm ←, đổi tab) cũng tự tải lại.
```

Các nút trên màn làm việc hiện/ẩn theo **cờ hành động server trả về** (`next_action`, `can_quote`, `needs_safety_check`…), nên luật nghiệp vụ chỉ nằm ở backend. Riêng kiểm tra an toàn điện: app chỉ mở nút *Bắt đầu sửa chữa* khi tick đủ 4 mục, và server từ chối nếu thiếu xác nhận, đồng thời lưu thời điểm xác nhận để làm căn cứ khi có sự cố.

## Cấu trúc

```
App.tsx                      Nạp font, Provider: SafeArea, React Query, Overlay (dialog/toast), Auth, Navigation
src/
├─ api/                      client.ts (fetch + token + lỗi), index.ts (toàn bộ endpoint), types.ts
├─ auth/                     AuthContext (token SecureStore/localStorage), SocialButtons (Google/Facebook)
├─ config/env.ts             Địa chỉ API, số tổng đài/email hỗ trợ (tuỳ chọn)
├─ navigation/               RootNavigator (Auth / Onboarding / Tabs + màn con), types
├─ hooks/                    useLocation (gửi vị trí khi nhận đơn/đang làm), usePushRegistration
├─ components/               Text (font), Button, Toggle (công tắc), Brand (họa tiết, thanh trạng thái), LevelBadge, Safety (checklist),
│                            SwipeButton, Overlay, Form, Bits, Charts, Photos, map/ (bản đồ)
├─ screens/                  auth · onboarding · home (Home, OfferCenter) · jobs · earnings · account · common
├─ theme/                    bảng màu, thang chữ, bóng đổ
└─ utils/                    định dạng tiền/ngày giờ VN, trạng thái đơn, bảng giá vật tư tham khảo
public/                      index.html (khung điện thoại trên máy tính), config.js, vendor/ (thư viện bản đồ cho bản web)
scripts/embed-map-assets.js  Đóng gói MapLibre + Leaflet vào app (bản đồ không phụ thuộc CDN)
```

**Bản đồ** (miễn phí, không cần API key): MapLibre GL + nền vector **OpenFreeMap**; máy không có WebGL hoặc không tải được thì tự chuyển sang Leaflet + **OpenStreetMap**. Không dùng CARTO vì từ 08/2026 CARTO bắt buộc API key. Bản đồ chạy trong WebView (điện thoại) / iframe (web).

**Dữ liệu**: TanStack Query + **Socket.IO** (`src/realtime/useRealtime.ts`): server đẩy `offer:new`, `offer:closed`, `order:updated`, `message:new`, `notification:new` vào phòng riêng của thợ, app tải lại đúng phần liên quan. Hỏi server định kỳ chỉ để dự phòng khi mất kết nối (lời mời 15 s khi socket đang nối / 3 s khi mất, chat 4 s, chi tiết đơn 6 s, trang chủ 8 s), tự tải lại khi app quay về foreground.

## Đăng nhập Google / Facebook

Nút có sẵn nhưng chỉ hoạt động khi nhóm đăng ký mã ứng dụng với Google/Meta (miễn phí) và điền vào `.env` của **backend** — không phải build lại app. Hướng dẫn từng bước: `docs/HUONG_DAN_GOOGLE_FACEBOOK.md` trong gói `backend-node`. Trong Expo Go hai nút này không dùng được (giới hạn của Expo Go) — dùng bản web hoặc bản build APK.

## Thông báo đẩy & build APK

- Expo Go (SDK 53+) không nhận push từ xa trên Android → app bỏ qua đăng ký push trong Expo Go; thông báo vẫn có trong app và lời mời vẫn đến ngay qua Socket.IO khi app đang mở.
- Muốn có push, Google/Facebook trên điện thoại…: tạo **development build** bằng EAS:
  ```bash
  npm i -g eas-cli && eas login
  eas build:configure
  eas build -p android --profile development     # hoặc --profile preview để ra file APK cài thẳng
  ```
  rồi đặt `PUSH_ENABLED=true` ở backend.

## Lệnh hữu ích

```bash
npm run typecheck          # kiểm tra TypeScript
npm run build:web          # xuất bản web tĩnh vào dist/
npx expo install --fix     # sửa phiên bản thư viện cho khớp SDK
```

## Gỡ lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Không kết nối được máy chủ" | Backend đã chạy chưa (`docker compose ps` trong thư mục backend-node)? Thử mở http://localhost:3000/api/health; điện thoại thì sửa ở màn Máy chủ (`<IP>:3000`) |
| Đăng nhập báo sai mật khẩu với tài khoản demo | App đang trỏ vào backend FastAPI cũ hoặc CSDL cũ: tắt backend cũ, kiểm tra màn Máy chủ là cổng 3000 |
| `port is already allocated` | Cổng 8082 (app) hoặc 3000 (API) đang bị chương trình khác dùng: tắt chương trình đó, hoặc đổi `WORKER_WEB_PORT` trong `.env` |
| Bật nhận đơn nhưng không có lời mời | Cần hồ sơ đã duyệt; cho phép vị trí; vị trí phải mới hơn 10 phút; đơn phải đúng nhóm dịch vụ & trong bán kính |
| Bấm bật nhận đơn thì báo "chưa gửi hồ sơ" / "đang chờ duyệt" | Đúng thiết kế: thợ chưa được duyệt vẫn dùng app nhưng chưa nhận đơn. Nộp giấy tờ ở Hồ sơ → Giấy tờ xác minh, chờ admin duyệt |
| Bản đồ không hiện đường phố | Cần Internet (máy chủ OpenFreeMap / OpenStreetMap); mạng công ty/trường chặn thì thử mạng khác |
| Expo Go báo *Project is incompatible with this version of Expo Go* | Expo Go trên điện thoại khác phiên bản SDK (app dùng SDK 57). Android: cài đúng bản tại https://expo.dev/go |
| Chạy `up` xong không thấy mã QR (`docker compose --profile dev ps -a` thấy `worker-dev` ở trạng thái *Created*) | Chạy `docker compose --profile dev up -d worker-dev` rồi `docker compose --profile dev logs -f worker-dev` (log có mã QR). Lệnh `up -d` vẫn đứng yên thì khởi động lại Docker Desktop. Hoặc bỏ qua QR: Expo Go → **Enter URL manually** → `exp://<IP máy tính>:8081` (hoặc bấm vào dự án trong mục *Recently opened*) |
| Quét QR xong Expo Go báo *Failed to connect / timed out* | Sai `HOST_IP`, khác Wi-Fi, hoặc tường lửa chặn cổng 8081 (xem mục Tường lửa) |
| Vào được app nhưng báo "Không kết nối được máy chủ" | Backend chưa chạy hoặc tường lửa chặn cổng 3000: thử `http://<IP>:3000/api/health` trên trình duyệt điện thoại |
| Gửi ảnh (chụp / chọn thư viện) báo "Không kết nối được máy chủ" trên điện thoại | Lỗi của bản ≤ 1.2.0 (`fetch` của Expo SDK mới không gửi được tệp `{ uri }`), đã sửa ở 1.3.0: ảnh được thu nhỏ rồi gửi bằng `XMLHttpRequest`. Dùng bản mới và chạy `docker compose --profile dev up --build -V worker-dev` |
| Metro báo *Unable to resolve module …* sau khi cập nhật app | Container còn giữ `node_modules` cũ: chạy lại với `--build -V` (dựng lại image + làm mới `node_modules`) |
| Ảnh không hiện trong app khác của nhóm (app khách, web quản trị) khi mở bằng điện thoại | App thợ tự đổi địa chỉ ảnh `localhost` sang máy chủ đang dùng; app khác thì đặt `PUBLIC_BASE_URL=http://<IP LAN>:3000` trong `.env` của backend |
| Quên mật khẩu không thấy email | Chưa cấu hình SMTP: ngoài production, mã 6 số hiện ngay trên app và trong log API |
