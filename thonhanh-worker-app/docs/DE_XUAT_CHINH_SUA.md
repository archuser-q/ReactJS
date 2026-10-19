# Đề xuất chỉnh sửa Đề cương & Nội dung chi tiết

Đề cương (`decuong.docx`) và nội dung chi tiết (`noidung.docx`) được viết trước khi nhóm chốt lại phạm vi. Dưới đây là các chỗ **nên sửa** để khớp với hệ thống đã xây dựng, kèm lý do. Câu đề xuất viết sẵn để nhóm chép vào.

Ký hiệu: ✏️ sửa câu chữ · ➕ bổ sung · ➖ bỏ.

---

## A. Đề cương

### Mục 1 – Lý do chọn đề tài
✏️ Giữ phần bối cảnh chung, nhưng nói rõ phạm vi **sửa chữa điện dân dụng**:
> "…nhu cầu sửa chữa, bảo trì **hệ thống điện** tại nhà (mất điện, chập cháy, nhảy aptomat, lắp đặt đèn, ổ cắm, tủ điện…) ngày càng tăng và mang tính khẩn cấp, an toàn cao…"

Lý do: nhóm đã chốt chỉ làm thợ điện; danh mục, dữ liệu mẫu, giấy tờ xác minh ("chứng chỉ nghề điện") đều theo hướng này. Tính khẩn cấp của sự cố điện cũng là lý do hợp lý cho chế độ ghép **tức thời**.

### Mục 2 – Mục tiêu cụ thể
✏️ App Khách hàng:
> "đăng ký/đăng nhập **bằng email, Google, Facebook**, tạo yêu cầu sửa chữa, đặt lịch, **theo dõi quá trình hệ thống tìm và ghép thợ, xem hồ sơ thợ được ghép**, theo dõi thợ trên bản đồ, chat, thanh toán, đánh giá, lịch sử đơn hàng, bảo hành, khiếu nại và thông báo đẩy."

Lý do: thay "xem danh sách thợ được đề xuất" vì hệ thống **gửi lời mời cho thợ** (giống Grab/bTaskee) — thuật toán ghép cặp mới thật sự quyết định. Nếu để khách tự chọn trong danh sách thì thuật toán chỉ còn là "sắp xếp danh sách", và chế độ theo lô (Hungarian) không có ý nghĩa.

✏️ App Thợ:
> "đăng ký và xác minh hồ sơ (CCCD, ảnh chân dung, chứng chỉ nghề điện), bật/tắt nhận việc, nhận lời mời đơn theo thuật toán ghép cặp, chỉ đường, cập nhật trạng thái đơn, chụp ảnh trước/sau, báo giá phát sinh, chat với khách, quản lý lịch làm việc và khu vực nhận việc, quản lý thu nhập và ví (rút tiền mô phỏng), xem đánh giá và hiệu suất."

✏️ Web Quản trị: thêm "**duyệt từng giấy tờ của thợ**, cấu hình **chế độ ghép cặp và tham số** (trọng số, bán kính, số lời mời mỗi đợt, thời gian chờ, cửa sổ lô), duyệt yêu cầu rút tiền".

### Mục 3 – Phạm vi
✏️ Chức năng: chuyển "rút tiền ngân hàng" từ mở rộng sang **đã làm (mô phỏng)**.

✏️ Dữ liệu thực nghiệm: tách rõ cho từng thuật toán:
> "Geospatial indexing: 1.000/10.000/100.000 thợ. Ghép cặp: bài toán gán tĩnh n = 10…200 đơn/thợ mỗi lượt và mô phỏng vận hành 120 phút với 3 mức tải (0,5 / 1,5 / 3 đơn/phút). Trust score: …"

Lý do: Hungarian O(n³) chạy theo **từng lượt lô** (vài chục đơn chờ cùng lúc), không chạy trên 100.000 thợ; đo ở quy mô 100.000 không phản ánh đúng cách dùng.

### Mục 4 – Công nghệ
✏️ Thay các dòng:

| Cũ | Mới |
|---|---|
| framework cross-platform (React Native/Flutter) | **React Native (Expo SDK 57, TypeScript)**, chạy Android/iOS và bản web để demo |
| RESTful API kết hợp kênh realtime (WebSocket) | **RESTful API Node.js (Express 5)**, kênh realtime **Socket.IO** (lời mời, trạng thái đơn, tin nhắn, vị trí thợ) + **thông báo đẩy (Expo Push)**; truy vấn định kỳ chỉ làm dự phòng khi mất kết nối |
| PostgreSQL | **PostgreSQL 16 + PostGIS** |
| SDK bản đồ (Google Maps/Mapbox), SMS OTP, đăng nhập Google/Facebook | Bản đồ **MapLibre GL + OpenFreeMap** (vector, miễn phí, không cần API key), dự phòng **Leaflet + OpenStreetMap**; đăng nhập **Email + mật khẩu / Google / Facebook**, quên mật khẩu qua email. **Bỏ SMS OTP** (tốn phí) |
| — | ➕ **Docker / Docker Compose**: mỗi thành phần là 1 image, chạy toàn hệ thống bằng `docker compose up` |

### Mục 5 – Kết cấu đồ án
➕ Chương 3: "Thiết kế máy trạng thái đơn hàng và vòng đời lời mời (offer)"; "Thiết kế bộ điều phối (dispatcher) chạy nền".

✏️ Chương 5, ý so sánh 2 chế độ ghép cặp:
> "So sánh hiệu quả các chế độ ghép cặp (tức thời – Greedy, theo lô – Hungarian, tự động – hệ thống tự chọn cho từng nhóm đơn) trên dữ liệu mô phỏng: (1) bài toán gán tĩnh — tổng điểm phù hợp, số đơn ghép được, thời gian chạy theo kích thước; (2) mô phỏng vận hành ở 3 mức tải — tỷ lệ ghép, thời gian chờ ghép (trung bình, trung vị, P90), thời gian thợ tới nơi, điểm phù hợp trung bình, quãng đường thợ di chuyển, số lời mời mỗi đơn; phân tích độ nhạy theo tỷ lệ thợ không phản hồi."

### Mục 6 – Tài liệu tham khảo
➕ Bổ sung:
- H. W. Kuhn (1955), *The Hungarian method for the assignment problem*, Naval Research Logistics Quarterly 2.
- J. Munkres (1957), *Algorithms for the Assignment and Transportation Problems*, Journal of SIAM 5(1).
- MapLibre GL JS — https://maplibre.org ; OpenFreeMap — https://openfreemap.org ; Leaflet — https://leafletjs.com ; OpenStreetMap — https://www.openstreetmap.org
- Expo / React Native — https://docs.expo.dev ; Express — https://expressjs.com ; Socket.IO — https://socket.io ; PostGIS — https://postgis.net
- Grab, "New commission deduction for cashless bookings" (mô hình trừ hoa hồng vào ví đối tác): https://www.grab.com/my/blog/driver/car/new-commission-deduction-for-cashless-bookings
- Urban Company, "12-point program to improve partner earnings and livelihood" (chỉ số, quyền lợi đối tác): https://www.urbancompany.com/blog/urban-company-announces-12-point-program-to-improve-partner-earnings-and-livelihood

---

## B. Nội dung chi tiết (`noidung.docx`)

### 5.1. App Khách hàng
- ✏️ "Đăng ký/đăng nhập bằng SMS OTP, Google/Facebook" → "**Đăng ký/đăng nhập bằng email + mật khẩu, Google, Facebook**; quên mật khẩu qua mã gửi email".
- ✏️ "Xem danh sách thợ do thuật toán ghép cặp đề xuất (kèm đánh giá, khoảng cách, giá)" → "**Theo dõi trạng thái tìm thợ; khi có thợ nhận, xem hồ sơ thợ** (đánh giá, số đơn đã làm, khoảng cách, chứng chỉ)".
- ➕ "Duyệt/từ chối báo giá phát sinh của thợ", "Xem ảnh trước/sau khi sửa".

### 5.2. App Thợ/Kỹ thuật viên
- ✏️ "Đăng ký & xác minh hồ sơ (CCCD, chứng chỉ nghề — admin duyệt)" → "Đăng ký & xác minh hồ sơ: **CCCD 2 mặt + ảnh chân dung (bắt buộc), chứng chỉ nghề điện (khuyến khích)**; admin duyệt **từng giấy tờ**, bị từ chối thì thấy lý do và tải lại."
- ✏️ "Nhận thông báo đơn phù hợp" → "**Nhận lời mời đơn** (đếm ngược, khoảng cách, thu nhập thực nhận dự kiến), chấp nhận/bỏ qua."
- ✏️ "Cập nhật trạng thái đơn: đang di chuyển → đang sửa → hoàn thành" → "**đang di chuyển → đã đến nơi → đang sửa → hoàn thành**" (bước "đã đến nơi" để khách biết thợ đã tới cửa).
- ✏️ "Chụp ảnh trước/sau": ghi rõ "ảnh sau là **bắt buộc** để hoàn thành đơn".
- ➕ "Hủy đơn đã nhận có lý do — nếu chưa đến nơi, hệ thống tự tìm thợ khác cho khách."
- ➕ "Khu vực & bán kính nhận việc", "Xác nhận đã thu tiền mặt", "Ví thợ: hoa hồng, nạp tiền, rút tiền (mô phỏng)", "Hiệu suất 30 ngày: tỷ lệ nhận, tỷ lệ hoàn thành, đánh giá".
- ➕ "**Kiểm tra an toàn điện bắt buộc** trước khi bắt đầu sửa (ngắt nguồn, thử điện, đồ bảo hộ, báo khách), hệ thống lưu thời điểm xác nhận" — điểm riêng của nghề điện, nên đưa vào mục tiêu App Thợ.
- ➕ "Hạng thợ (Đồng/Bạc/Vàng/Kim cương)", "Báo giá nhanh theo bảng giá vật tư tham khảo".
- ✏️ Nếu đề cương có "lịch làm việc / khung giờ làm việc của thợ" thì **bỏ**: thợ chỉ bật/tắt nhận đơn; đơn hẹn trước ghi rõ giờ hẹn trong lời mời để thợ tự quyết, hệ thống chặn trùng lịch (lý do ở THIET_KE_APP_THO.md, mục 11c).
- ✏️ Bỏ dấu ⭐ ở "Rút tiền về tài khoản ngân hàng (mô phỏng)" (đã làm). "Thư viện tài liệu kỹ thuật" giữ ⭐ (chưa làm).

### 5.3. Web Quản trị
- ✏️ "Cấu hình trọng số thuật toán matching (ưu tiên khoảng cách/đánh giá/giá)" → "Cấu hình **chế độ ghép cặp (tức thời / theo lô)** và tham số: 4 trọng số, bán kính tìm, số lời mời mỗi đợt, thời gian chờ thợ phản hồi, cửa sổ lô; mô phỏng xếp hạng thợ cho 1 vị trí."
- ➕ "Duyệt yêu cầu rút tiền của thợ."

### 6.1. Thuật toán ghép cặp — sửa các tiêu chí cho khớp hệ thống

Văn bản hiện tại liệt kê: khoảng cách, rating trung bình, tỷ lệ hoàn thành, tải công việc. Hệ thống (và web quản trị của nhóm) dùng:

| Tiêu chí | Công thức | Ghi chú |
|---|---|---|
| Khoảng cách | $1 - d/R$ | như cũ |
| **Điểm tin cậy (trust score)** | lấy từ thuật toán của thành viên A | ✏️ thay "rating trung bình": trust score đã là rating được làm mượt Bayesian + trọng số thời gian, nên dùng trực tiếp — **3 thuật toán của 3 thành viên kết nối với nhau**, điểm cộng khi bảo vệ |
| **Mức giá** | $\mathrm{clamp}(2 - r)$, $r$ = TB giá chốt / giá gốc 90 ngày | ➕ khớp với ý "ưu tiên … giá" ở mục cấu hình trọng số của web quản trị |
| Tải công việc | $1 - \min(k,3)/3$ | như cũ |

"Tỷ lệ hoàn thành đơn" đề xuất **gộp vào trust score** — web quản trị của nhóm cũng đã mô tả trust score "tính từ đánh giá, tỷ lệ hoàn thành và khiếu nại", nên chỉ cần thành viên A cài đúng như vậy và sửa câu chữ ở mục 6.1/6.3 cho thống nhất. Lý do không đưa thẳng vào hàm điểm: thợ mới có tỷ lệ 0/0 cần làm mượt giống rating — chính là việc trust score đang làm. App thợ đã hiển thị tỷ lệ nhận đơn / hoàn thành 30 ngày (`GET /worker/performance`), A có thể tái sử dụng cách tính.

✏️ Câu "Thợ điểm cao nhất được ưu tiên gợi ý/nhận thông báo trước" → "Hệ thống gửi **lời mời theo đợt** cho k thợ điểm cao nhất (k do admin cấu hình); hết thời gian chờ mà không ai nhận thì mời k thợ tiếp theo, không mời lại thợ đã từ chối."

➕ Chế độ theo lô, bổ sung 2 ý kỹ thuật:
- "Cặp đơn–thợ không hợp lệ (ngoài bán kính, không có kỹ năng, trùng lịch…) được gán chi phí lớn $\mathrm{BIG} = \min(n,m)+1$, đảm bảo lời giải **ghép được nhiều đơn nhất**, rồi mới tối đa tổng điểm."
- "Thuật toán Hungarian được tự cài đặt (thế vị + đường tăng ngắn nhất), kiểm chứng với vét cạn trên 300 ma trận ngẫu nhiên."

➕ Kết luận thực nghiệm (để đưa vào phần "Giá trị học thuật"):
> "Kết quả mô phỏng cho thấy khi ít đơn, hai chế độ tương đương và chế độ tức thời phản hồi nhanh hơn; khi đông đơn, chế độ theo lô giảm ~40% thời gian chờ trung bình, tăng 4–12% điểm phù hợp và giảm 15–38% quãng đường thợ di chuyển. Do đó hệ thống cho phép admin chuyển chế độ theo khung giờ."

### 6.2. Geospatial (thành viên C) — lưu ý nhỏ
Backend hiện dùng PostGIS (`ST_DWithin` + GiST). Nội dung chi tiết yêu cầu **tự cài đặt** lưới ô/geohash. Đề xuất C giữ PostGIS làm "đối chứng" và cài thêm phiên bản lưới ô tự viết để benchmark 3 cách: quét toàn bảng / lưới ô tự viết / PostGIS GiST. (Schema cũ thiếu index GiST — đã bổ sung ở migration 002, C nên kiểm tra lại số liệu benchmark.)

---

## C. Những chỗ khác nên cân nhắc

1. **Trạng thái `matched`** trong schema không dùng tới; nên ghi trong báo cáo là "đã ghép, chờ thợ xác nhận" được biểu diễn bằng bảng `order_offers` thay vì 1 trạng thái của đơn.
2. **Khách không chọn chế độ ghép**: trường `matching_mode` khách gửi lên được giữ để tương thích nhưng hệ thống sẽ ghi đè theo cấu hình admin.
3. **Số điện thoại khách**: đăng ký bằng email/Google thì có thể chưa có SĐT → thợ không gọi được. Đề xuất app khách hỏi SĐT liên hệ trước lần đặt đơn đầu tiên (xem `TICH_HOP_CHO_NHOM.md`).
4. **Bảo mật dữ liệu cá nhân**: trong `dashboard/src/components/matching/` (cả nhánh main và feature của repo React) có 1 file PDF hồ sơ cá nhân (CV) của một thành viên — nên xoá khỏi repo (và khỏi lịch sử git) trước khi nộp/công khai.
