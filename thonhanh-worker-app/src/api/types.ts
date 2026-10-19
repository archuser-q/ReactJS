// Kiểu dữ liệu khớp API backend Node.js (/api/worker/..., src/services/worker/*.js).
// Giờ trả về dạng ISO 8601 có múi giờ (VD "2026-10-19T02:56:16.139Z"); app tự đổi sang giờ Việt Nam để hiển thị.

export type Role = 'customer' | 'worker' | 'admin';

export type User = {
  id: number;
  phone: string | null;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  status: string;
  created_at: string;
};

/** Danh sách phân trang theo quy ước chung của nhóm */
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

export type LoginResult = { token: string; user: User; is_new?: boolean };

export type ProvidersConfig = {
  google: { web_client_id: string | null; android_client_id: string | null; ios_client_id: string | null } | null;
  facebook: { app_id: string } | null;
  password_reset_by_email: boolean;
  smtp_configured: boolean;
};

// ---------- Hồ sơ ----------

export type DocType = 'id_card_front' | 'id_card_back' | 'portrait' | 'certificate';
export type DocStatus = 'pending' | 'approved' | 'rejected';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type Availability = 'online' | 'busy' | 'offline';

export type WorkerDocument = {
  id: number;
  doc_type: DocType;
  file_url: string;
  status: DocStatus;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  /** Chỉ có khi vừa gửi: câu thông báo của máy chủ */
  message?: string;
};

/** Kỹ năng = nhóm dịch vụ (danh mục) thợ nhận làm + số năm kinh nghiệm (tiêu chí "kỹ năng" của ghép cặp) */
export type WorkerSkill = {
  category_id: number;
  category_name: string;
  years: number;
  service_count: number;
};

export type BankAccount = { bank_name: string; account_number: string; account_holder: string; updated_at: string };

export type Onboarding = {
  verification_status: VerificationStatus;
  submitted_at: string | null;
  has_phone: boolean;
  has_skills: boolean;
  documents: Record<DocType, DocStatus | null>;
  reject_reasons: string[];
  missing: string[];
  can_submit: boolean;
};

export type GeoPoint = { latitude: number; longitude: number; updated_at: string | null };

export type WorkerMe = {
  user: User;
  profile: {
    bio: string | null;
    experience_years: number;
    service_radius_km: number;
    availability: Availability;
    verification_status: VerificationStatus;
    verification_note: string | null;
    submitted_at: string | null;
    trust_score: number;
    rating_avg: number | null;
    rating_count: number;
    total_jobs: number;
    acceptance_rate: number;
    cancel_rate: number;
    wallet_balance: number;
    location: GeoPoint | null;
    level: WorkerLevel;
  };
  skills: WorkerSkill[];
  documents: WorkerDocument[];
  bank_account: BankAccount | null;
  onboarding: Onboarding;
  settings: {
    commission_rate: number;
    min_withdrawal: number;
    wallet_debt_limit: number;
    location_max_age_minutes: number;
  };
};

// ---------- Đơn ----------

export type OrderStatus = 'pending' | 'matching' | 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export type Offer = {
  id: number;
  order_id: number;
  code: string;
  status: string;
  round: number;
  mode: 'instant' | 'batch';
  offered_at: string;
  expires_at: string;
  expires_in_seconds: number;
  timeout_seconds: number;
  match_score: number;
  distance_km: number | null;
  service_id: number;
  service_name: string;
  category_name: string;
  description: string | null;
  image_urls: string[];
  address_text: string;
  latitude: number;
  longitude: number;
  scheduled_at: string | null;
  estimated_price: number;
  estimated_earning: number;
  commission_rate: number;
  customer_name: string;
};

export type JobItem = {
  id: number;
  code: string;
  status: OrderStatus;
  service_id: number;
  service_name: string;
  category_name: string;
  address_text: string;
  latitude: number;
  longitude: number;
  scheduled_at: string | null;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  estimated_price: number;
  extra_amount: number;
  final_price: number | null;
  total_amount: number;
  customer_id: number;
  customer_name: string;
  paid: boolean;
  payment_method: 'cash' | 'momo' | 'vnpay' | null;
  net_earning: number | null;
  unread_messages: number;
  /** Số sao khách đánh giá (đơn đã hoàn thành) */
  rating: number | null;
};

export type JobPhoto = { id: number; kind: 'before' | 'after'; url: string; created_at: string };
export type JobQuote = {
  id: number;
  description: string;
  amount: number;
  image_urls: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at: string | null;
};
export type JobPayment = {
  id: number;
  amount: number;
  method: 'cash' | 'momo' | 'vnpay';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transaction_code: string | null;
  created_at: string;
  paid_at: string | null;
};

export type JobHistory = { from_status: OrderStatus | null; status: OrderStatus; note: string | null; created_at: string };

export type JobDetail = JobItem & {
  description: string | null;
  image_urls: string[];
  cancel_reason: string | null;
  customer: { id: number; full_name: string; phone: string | null; avatar_url: string | null };
  distance_km: number | null;
  history: JobHistory[];
  photos: JobPhoto[];
  extra_quotes: JobQuote[];
  payments: JobPayment[];
  review: { rating: number; comment: string | null; image_urls: string[]; created_at: string } | null;
  warranty: { terms: string; start_date: string; end_date: string; status: 'active' | 'expired'; claim_status: string | null } | null;
  earning: { gross_amount: number; commission_amount: number; net_amount: number } | null;
  estimated_earning: number;
  next_status: OrderStatus | null;
  next_action: string | null;
  can_cancel: boolean;
  cancel_requeues: boolean;
  can_quote: boolean;
  can_add_photos: boolean;
  can_confirm_cash: boolean;
  /** Khách đã chọn "trả tiền mặt" trên app khách, chờ thợ xác nhận */
  customer_chose_cash: boolean;
  can_chat: boolean;
  can_report: boolean;
  needs_after_photo: boolean;
  needs_safety_check: boolean;
  safety_checked_at: string | null;
  /** Đơn hẹn trước còn xa giờ hẹn: lúc sớm nhất được bắt đầu di chuyển (null = đi được ngay) */
  start_available_at: string | null;
  has_pending_quote: boolean;
  amount_to_collect: number | null;
};

export type JobGroup = 'active' | 'completed' | 'cancelled' | 'history';

export type IncomeStats = { completed: number; net_income: number; gross_income: number };

export type HomeData = {
  availability: Availability;
  verification_status: VerificationStatus;
  can_go_online: boolean;
  blockers: string[];
  location_fresh: boolean;
  today: IncomeStats;
  week: IncomeStats;
  rating_avg: number | null;
  rating_count: number;
  trust_score: number;
  wallet_balance: number;
  wallet_restricted: boolean;
  current_offer: Offer | null;
  active_job: JobItem | null;
  upcoming: JobItem[];
  unread_notifications: number;
  /** Chế độ ghép của hệ thống (admin đặt): instant | batch | auto */
  matching_mode: 'instant' | 'batch' | 'auto';
  location: GeoPoint | null;
  service_radius_km: number;
  level: WorkerLevel;
};

export type WorkerLevel = {
  key: 'dong' | 'bac' | 'vang' | 'kim_cuong';
  name: string;
  completed: number;
  next_name: string | null;
  next_jobs: number | null;
  next_rating: number | null;
  progress: number;
};

// ---------- Thu nhập, ví ----------

export type Period = 'today' | 'week' | 'month';

export type EarningSummary = {
  period: Period;
  label: string;
  start: string;
  end: string;
  totals: {
    orders: number;
    gross: number;
    commission: number;
    net: number;
    cash_collected: number;
    online_received: number;
    avg_net_per_order: number;
  };
  previous_net: number;
  change_percent: number | null;
  chart: { key: string; label: string; net: number; orders: number }[];
  unpaid_orders: number;
  unpaid_amount: number;
};

export type EarningItem = {
  order_id: number;
  code: string;
  service_name: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  payment_method: string | null;
  created_at: string;
};

/** Loại biến động ví — theo enum wallet_txn_type của CSDL nhóm */
export type WalletTxType = 'earning' | 'commission' | 'withdraw' | 'refund' | 'topup' | 'adjustment';

export type WalletTx = {
  id: number;
  type: WalletTxType;
  amount: number;
  balance_after: number;
  note: string | null;
  order_id: number | null;
  withdrawal_id: number | null;
  created_at: string;
};

export type Wallet = {
  balance: number;
  available_for_withdrawal: number;
  debt_limit: number;
  restricted: boolean;
  min_withdrawal: number;
  pending_withdrawal: number;
  bank_account: BankAccount | null;
  recent: WalletTx[];
  /** Môi trường thử nghiệm: cho nạp tiền sandbox */
  topup_enabled: boolean;
};

export type Withdrawal = {
  id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'pending' | 'completed' | 'rejected';
  transaction_code: string | null;
  note: string | null;
  created_at: string;
  processed_at: string | null;
};

// ---------- Đánh giá, hiệu suất ----------

export type Review = {
  id: number;
  order_id: number;
  code: string;
  rating: number;
  comment: string | null;
  image_urls: string[];
  customer_name: string;
  service_name: string;
  created_at: string;
};

export type ReviewsPage = Paginated<Review> & {
  summary: { rating_avg: number | null; rating_count: number; distribution: Record<string, number> };
};

export type Performance = {
  period_days: number;
  offers_received: number;
  offers_accepted: number;
  offers_rejected: number;
  offers_expired: number;
  acceptance_rate: number | null;
  /** Tỷ lệ nhận đơn bộ ghép cặp đang dùng để chấm điểm (đã làm mượt) */
  matching_acceptance_rate: number;
  jobs_completed: number;
  jobs_cancelled_by_worker: number;
  completion_rate: number | null;
  rating_avg: number | null;
  rating_count: number;
  trust_score: number;
  total_completed: number;
  total_net: number;
};

// ---------- Khác ----------

export type CatalogCategory = {
  id: number;
  name: string;
  icon_url: string | null;
  description: string | null;
  sort_order: number;
  service_count: number;
};

export type CatalogService = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  base_price: number;
  unit: string | null;
  warranty_days: number;
};

export type Message = {
  id: number;
  order_id: number;
  sender_id: number;
  is_mine: boolean;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
};

export type AppNotification = {
  id: number;
  title: string;
  body: string | null;
  /** order | offer | quote | chat | payment | review | complaint | warranty | worker_verification */
  type: string;
  data: { order_id?: number; offer_id?: number; quote_id?: number; withdrawal_id?: number; kind?: string } | null;
  is_read: boolean;
  created_at: string;
};

export type Report = {
  id: number;
  order_id: number;
  code: string;
  reason: string;
  description: string | null;
  status: 'open' | 'processing' | 'resolved' | 'rejected';
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
};
