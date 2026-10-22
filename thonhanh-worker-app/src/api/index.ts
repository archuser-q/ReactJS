/** Toàn bộ API mà App Thợ dùng — mỗi hàm ứng với 1 endpoint backend Node.js (/api/worker/...) */
import { http, uploadImage } from './client';
import type {
  AppNotification,
  Availability,
  BankAccount,
  CatalogCategory,
  CatalogService,
  DocType,
  EarningItem,
  EarningSummary,
  HomeData,
  JobDetail,
  JobGroup,
  JobItem,
  LoginResult,
  Message,
  Offer,
  Paginated,
  Performance,
  Period,
  ProvidersConfig,
  Report,
  ReviewsPage,
  User,
  Wallet,
  WalletTx,
  WorkerDocument,
  WorkerMe,
  WorkerSkill,
  Withdrawal,
} from './types';

export * from './types';
export { ApiError, errMsg, getToken, setOnUnauthorized, setToken, uploadImage } from './client';
export type { LocalImage } from './client';

// Mọi API của app thợ nằm dưới /api/worker (backend Node.js của nhóm); riêng tải ảnh dùng chung /api/uploads
const W = '/worker';

export const api = {
  // ---------- Đăng nhập ----------
  login: (identifier: string, password: string) =>
    http.post<LoginResult>(`${W}/auth/login`, { identifier: identifier.trim(), password }),
  register: (data: { full_name: string; email: string; password: string; phone?: string | null }) =>
    http.post<LoginResult>(`${W}/auth/register`, { ...data, email: data.email.trim() }),
  me: async () => (await http.get<{ user: User }>(`${W}/auth/me`)).user,
  providers: () => http.get<ProvidersConfig>(`${W}/auth/providers`),
  google: (token: { id_token?: string; access_token?: string }) => http.post<LoginResult>(`${W}/auth/google`, token),
  facebook: (accessToken: string) => http.post<LoginResult>(`${W}/auth/facebook`, { access_token: accessToken }),
  forgotPassword: (email: string) =>
    http.post<{ message: string; debug_code?: string }>(`${W}/auth/forgot-password`, { email: email.trim() }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    http.post<{ message: string }>(`${W}/auth/reset-password`, { email: email.trim(), code, new_password: newPassword }),
  changePassword: (oldPassword: string | null, newPassword: string) =>
    http.post<{ message: string }>(`${W}/auth/change-password`, { old_password: oldPassword, new_password: newPassword }),

  // ---------- Hồ sơ & xác minh ----------
  workerMe: () => http.get<WorkerMe>(`${W}/me`),
  updateProfile: (data: {
    full_name?: string;
    phone?: string;
    avatar_url?: string | null;
    bio?: string | null;
    experience_years?: number;
    service_radius_km?: number;
  }) => http.patch<WorkerMe>(`${W}/profile`, data),
  /** Chọn nhóm dịch vụ nhận làm; số năm kinh nghiệm lấy theo hồ sơ (1 con số chung) */
  setSkills: (categoryIds: number[]) => http.put<WorkerSkill[]>(`${W}/skills`, { category_ids: categoryIds }),
  addDocument: (docType: DocType, fileUrl: string) =>
    http.post<WorkerDocument>(`${W}/documents`, { doc_type: docType, file_url: fileUrl }),
  deleteDocument: (id: number) => http.del<{ message: string }>(`${W}/documents/${id}`),
  submitVerification: () => http.post<WorkerMe>(`${W}/verification/submit`),
  setBankAccount: (data: { bank_name: string; account_number: string; account_holder: string }) =>
    http.put<BankAccount>(`${W}/bank-account`, data),

  // ---------- Nhận đơn ----------
  home: () => http.get<HomeData>(`${W}/home`),
  setAvailability: (online: boolean, coords?: { latitude: number; longitude: number } | null) =>
    http.patch<{ availability: Availability; location_fresh: boolean }>(`${W}/availability`, { online, ...(coords ?? {}) }),
  updateLocation: (latitude: number, longitude: number) => http.patch<unknown>(`${W}/location`, { latitude, longitude }),
  currentOffer: () => http.get<Offer | null>(`${W}/offers/current`),
  acceptOffer: (offerId: number) => http.post<JobDetail>(`${W}/offers/${offerId}/accept`),
  rejectOffer: (offerId: number, reason?: string | null) => http.post<{ message: string }>(`${W}/offers/${offerId}/reject`, { reason: reason ?? null }),

  // ---------- Đơn của tôi ----------
  jobs: (group: JobGroup, page = 1, pageSize = 20) => http.get<Paginated<JobItem>>(`${W}/orders`, { group, page, pageSize }),
  job: (id: number) => http.get<JobDetail>(`${W}/orders/${id}`),
  advance: (id: number, status: string, safetyConfirmed = false) =>
    http.post<JobDetail>(`${W}/orders/${id}/status`, { status, safety_confirmed: safetyConfirmed }),
  cancelJob: (id: number, reason: string) => http.post<{ id: number; status: string }>(`${W}/orders/${id}/cancel`, { reason }),
  addPhotos: (id: number, kind: 'before' | 'after', urls: string[]) => http.post<JobDetail>(`${W}/orders/${id}/photos`, { kind, urls }),
  deletePhoto: (id: number, photoId: number) => http.del<JobDetail>(`${W}/orders/${id}/photos/${photoId}`),
  createQuote: (id: number, description: string, amount: number) =>
    http.post<JobDetail>(`${W}/orders/${id}/extra-quotes`, { description, amount }),
  cancelQuote: (id: number, quoteId: number) => http.post<JobDetail>(`${W}/orders/${id}/extra-quotes/${quoteId}/cancel`),
  report: (id: number, reason: string, description?: string | null) =>
    http.post<Report>(`${W}/orders/${id}/report`, { reason, description: description || null }),
  reports: (page = 1) => http.get<Paginated<Report>>(`${W}/reports`, { page, pageSize: 20 }),

  // ---------- Thu nhập & ví ----------
  earningsSummary: (period: Period) => http.get<EarningSummary>(`${W}/earnings/summary`, { period }),
  earnings: (page = 1, pageSize = 20) => http.get<Paginated<EarningItem>>(`${W}/earnings`, { page, pageSize }),
  wallet: () => http.get<Wallet>(`${W}/wallet`),
  walletTransactions: (page = 1) => http.get<Paginated<WalletTx>>(`${W}/wallet/transactions`, { page, pageSize: 30 }),
  withdraw: (amount: number) => http.post<Withdrawal>(`${W}/wallet/withdrawals`, { amount }),
  withdrawals: (page = 1) => http.get<Paginated<Withdrawal>>(`${W}/wallet/withdrawals`, { page, pageSize: 20 }),

  // ---------- Đánh giá & hiệu suất ----------
  reviews: (rating: number | null, page = 1) => http.get<ReviewsPage>(`${W}/reviews`, { rating: rating ?? undefined, page, pageSize: 20 }),
  performance: () => http.get<Performance>(`${W}/performance`),

  // ---------- Danh mục dịch vụ ----------
  categories: () => http.get<CatalogCategory[]>(`${W}/catalog/categories`),
  services: () => http.get<CatalogService[]>(`${W}/catalog/services`),

  // ---------- Chat (dùng chung bảng tin nhắn với app khách) ----------
  messages: (orderId: number, beforeId?: number) =>
    http.get<Message[]>(`${W}/orders/${orderId}/messages`, { before_id: beforeId, limit: 50 }),
  sendMessage: (orderId: number, content: string | null, imageUrl?: string | null) =>
    http.post<Message>(`${W}/orders/${orderId}/messages`, { content, image_url: imageUrl ?? null }),
  markMessagesRead: (orderId: number) => http.post<{ updated: number }>(`${W}/orders/${orderId}/messages/read`),

  // ---------- Thông báo ----------
  notifications: (page = 1) => http.get<Paginated<AppNotification>>(`${W}/notifications`, { page, pageSize: 30 }),
  unreadCount: () => http.get<{ unread: number }>(`${W}/notifications/unread-count`),
  markNotificationRead: (id: number) => http.patch<AppNotification>(`${W}/notifications/${id}/read`),
  markAllNotificationsRead: () => http.patch<{ updated: number }>(`${W}/notifications/read-all`),
  registerDevice: (token: string, platform: 'android' | 'ios' | 'web') =>
    http.post<{ message: string }>(`${W}/device-tokens`, { token, platform }),
  removeDevice: (token: string) => http.del<{ message: string }>(`${W}/device-tokens/${encodeURIComponent(token)}`),

  upload: uploadImage,
};

/** Khoá cache cho TanStack Query */
export const qk = {
  me: ['me'] as const,
  home: ['home'] as const,
  offer: ['offer'] as const,
  jobs: (group: JobGroup) => ['jobs', group] as const,
  job: (id: number) => ['job', id] as const,
  messages: (id: number) => ['messages', id] as const,
  earnings: (period: Period) => ['earnings', period] as const,
  earningItems: ['earningItems'] as const,
  wallet: ['wallet'] as const,
  walletTx: ['walletTx'] as const,
  withdrawals: ['withdrawals'] as const,
  reviews: (rating: number | null) => ['reviews', rating] as const,
  performance: ['performance'] as const,
  notifications: ['notifications'] as const,
  unread: ['unread'] as const,
  catalog: ['catalog'] as const,
  reports: ['reports'] as const,
  providers: ['providers'] as const,
};
