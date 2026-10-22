// Kiểu dữ liệu khớp với response của backend Node.js (src/services/customer/*.service.js)
// và bảng trong migrations/1792036223715_init-schema.sql.
// Thời gian dạng ISO có múi giờ, VD "2026-10-17T05:22:45.480Z" — hiển thị đổi sang giờ VN (utils/format).

export type User = {
  id: number;
  phone: string | null;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  role: 'customer' | 'worker' | 'admin';
  status: 'active' | 'locked' | 'deleted';
  created_at: string;
};

export type AuthResult = { token: string; user: User; is_new?: boolean };

/** Cấu hình đăng nhập Google / Facebook do backend trả (null = máy chủ chưa bật) */
export type ProvidersConfig = {
  google: { web_client_id: string | null; android_client_id: string | null; ios_client_id: string | null } | null;
  facebook: { app_id: string } | null;
  password_reset_by_email: boolean;
  smtp_configured: boolean;
};

/** Danh sách có phân trang — giống bên dashboard: { items, total, page, pageSize } */
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

export type CatalogService = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  base_price: number;
  unit: string;
  warranty_days: number;
};

export type CatalogCategory = {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  service_count: number;
};

export type Address = {
  id: number;
  label: string | null;
  address_text: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
};

/** Trùng enum order_status trong database */
export type OrderStatus =
  | 'pending'
  | 'matching'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type OrderGroup = 'active' | 'completed' | 'cancelled';

/** Hạng thợ theo số đơn hoàn thành + điểm đánh giá (chỉ để hiển thị) */
export type WorkerLevel = { key: 'dong' | 'bac' | 'vang' | 'kim_cuong'; name: string; completed: number };

export type WorkerBrief = {
  id: number;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  rating_avg: number; // 0..5
  rating_count: number;
  trust_score: number; // 0..1
  total_jobs: number;
  experience_years: number;
  /** Chỉ có ở chi tiết đơn */
  level?: WorkerLevel;
  has_certificate?: boolean;
};

export type OrderItem = {
  id: number;
  code: string;
  status: OrderStatus;
  service_id: number;
  service_name: string;
  category_name: string;
  address_text: string;
  lat: number;
  lng: number;
  description: string | null;
  image_urls: string[];
  scheduled_at: string | null;
  /** Chế độ ghép thực tế hệ thống đã dùng (khách không chọn) */
  matching_mode: 'instant' | 'batch';
  estimated_price: number;
  extra_amount: number;
  final_price: number | null;
  total_amount: number;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  warranty_until: string | null;
  /** Lúc thợ xác nhận kiểm tra an toàn điện trước khi sửa */
  safety_checked_at: string | null;
  has_review: boolean;
  worker: WorkerBrief | null;
};

export type ExtraQuote = {
  id: number;
  description: string;
  amount: number;
  image_urls: string[];
  /** cancelled = thợ đã rút lại báo giá */
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at: string | null;
};

/** Ảnh trước / sau khi sửa do thợ chụp */
export type OrderPhoto = { id: number; kind: 'before' | 'after'; url: string; created_at: string };

/** Tiến độ tìm thợ của bộ điều phối (khi đơn đang ở trạng thái matching) */
export type SearchingInfo = {
  mode: 'instant' | 'batch' | 'auto';
  rounds: number;
  offers_sent: number;
  last_candidates: number | null;
  deadline_at: string;
  last_attempt_at: string | null;
};

/** Thợ Nhanh không nhận tiền mặt: chỉ MoMo / VNPay (sandbox). 'cash' chỉ còn ở dữ liệu cũ */
export type PaymentMethod = 'momo' | 'vnpay' | 'cash';

export type Payment = {
  id: number;
  order_id?: number;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  provider_txn_id: string | null;
  created_at: string;
  paid_at: string | null;
};

export type Review = { id: number; rating: number; comment: string | null; created_at: string };

export type Warranty = {
  until: string;
  active: boolean;
  claim_status: 'open' | 'processing' | 'resolved' | 'rejected' | null;
};

export type OrderDetail = OrderItem & {
  offers: { total: number; waiting: number };
  searching: SearchingInfo | null;
  photos: OrderPhoto[];
  history: { from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; created_at: string }[];
  extra_quotes: ExtraQuote[];
  payments: Payment[];
  review: Review | null;
  warranty: Warranty | null;
  can_cancel: boolean;
  can_pay: boolean;
  can_review: boolean;
  can_claim_warranty: boolean;
  can_complain: boolean;
};

export type Tracking = {
  order_id: number;
  status: OrderStatus;
  destination_lat: number;
  destination_lng: number;
  worker_lat: number | null;
  worker_lng: number | null;
  location_updated_at: string | null;
};

export type Message = {
  id: number;
  order_id: number;
  sender_id: number;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
};

export type WorkerPublic = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  experience_years: number;
  rating_avg: number;
  rating_count: number;
  trust_score: number;
  total_jobs: number;
  verified: boolean;
  has_certificate: boolean;
  level: WorkerLevel;
  skills: string[];
  recent_reviews: { rating: number; comment: string | null; customer_name: string; created_at: string }[];
};

export type MyReview = {
  id: number;
  order_id: number;
  order_code: string;
  worker_id: number;
  worker_name: string;
  service_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type MyPayment = Payment & { order_id: number; order_code: string; service_name: string };

export type Complaint = {
  id: number;
  order_id: number;
  type: 'complaint' | 'warranty';
  title: string;
  content: string;
  status: 'open' | 'processing' | 'resolved' | 'rejected';
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type AppNotification = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  data: { order_id?: number; [k: string]: unknown } | null;
  is_read: boolean;
  created_at: string;
};

/** Sự kiện realtime server đẩy về (src/realtime/socket.js ở backend) */
export type OrderUpdatedEvent = { order_id: number; status: OrderStatus };
export type WorkerLocationEvent = { order_id: number; lat: number; lng: number; updated_at: string };
