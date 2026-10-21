/** Toàn bộ API mà app khách hàng dùng — mỗi hàm ứng với 1 endpoint backend (/api/customer/...) */
import { http } from './client';
import type {
  Address,
  AppNotification,
  AuthResult,
  CatalogCategory,
  CatalogService,
  Complaint,
  ExtraQuote,
  Message,
  MyPayment,
  MyReview,
  OrderDetail,
  ProvidersConfig,
  OrderGroup,
  OrderItem,
  Paginated,
  Payment,
  PaymentMethod,
  Review,
  Tracking,
  User,
  WorkerPublic,
} from './types';

export * from './types';
export { ApiError, errMsg, getToken, pingServer, setOnUnauthorized, setToken, uploadImage, type LocalImage } from './client';

type Page = { page?: number; pageSize?: number };

export const api = {
  // Auth
  /** identifier = email hoặc số điện thoại */
  login: (identifier: string, password: string) => http.post<AuthResult>('/auth/login', { identifier, password }),
  register: (data: { full_name: string; email: string; phone: string; password: string }) =>
    http.post<AuthResult>('/auth/register', data),
  me: () => http.get<{ user: User; has_password: boolean }>('/auth/me'),
  providers: () => http.get<ProvidersConfig>('/auth/providers'),
  google: (tokens: { id_token?: string; access_token?: string }) => http.post<AuthResult>('/auth/google', tokens),
  facebook: (accessToken: string) => http.post<AuthResult>('/auth/facebook', { access_token: accessToken }),
  forgotPassword: (email: string) => http.post<{ message: string; debug_code?: string }>('/auth/forgot-password', { email }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    http.post<{ message: string }>('/auth/reset-password', { email, code, new_password: newPassword }),
  changePassword: (oldPassword: string | null, newPassword: string) =>
    http.post<{ message: string }>('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
  registerDevice: (token: string, platform: 'android' | 'ios') => http.post<{ message: string }>('/device-tokens', { token, platform }),
  removeDevice: (token: string) => http.del<{ message: string }>(`/device-tokens/${encodeURIComponent(token)}`),

  // Hồ sơ, địa chỉ
  updateProfile: async (data: { full_name?: string; email?: string | null; phone?: string | null; avatar_url?: string | null }) =>
    (await http.patch<{ user: User }>('/profile', data)).user,
  listAddresses: () => http.get<Address[]>('/addresses'),
  createAddress: (data: { label?: string | null; address_text: string; lat: number; lng: number; is_default?: boolean }) =>
    http.post<Address>('/addresses', data),
  updateAddress: (
    id: number,
    data: { label?: string | null; address_text?: string; lat?: number; lng?: number; is_default?: boolean },
  ) => http.patch<Address>(`/addresses/${id}`, data),
  deleteAddress: (id: number) => http.del<{ message: string }>(`/addresses/${id}`),

  // Danh mục dịch vụ
  listCategories: () => http.get<CatalogCategory[]>('/catalog/categories'),
  listServices: (q?: { category_id?: number; search?: string }) => http.get<CatalogService[]>('/catalog/services', q),

  // Đơn hàng
  createOrder: (data: {
    service_id: number;
    address_id: number;
    description?: string | null;
    scheduled_at?: string | null;
    /** URL ảnh tình trạng đã tải lên qua uploadImage (tối đa 6) */
    image_urls?: string[];
  }) => http.post<OrderDetail>('/orders', data),
  listOrders: (q: { group?: OrderGroup } & Page = {}) => http.get<Paginated<OrderItem>>('/orders', q),
  getOrder: (id: number) => http.get<OrderDetail>(`/orders/${id}`),
  cancelOrder: (id: number, reason: string) => http.post<{ id: number; status: string }>(`/orders/${id}/cancel`, { reason }),
  getTracking: (id: number) => http.get<Tracking>(`/orders/${id}/tracking`),
  respondQuote: (orderId: number, quoteId: number, approve: boolean) =>
    http.post<ExtraQuote & { total_amount: number }>(`/orders/${orderId}/quotes/${quoteId}/${approve ? 'approve' : 'reject'}`),
  getWorker: (id: number) => http.get<WorkerPublic>(`/workers/${id}`),

  // Chat
  listMessages: (orderId: number, q?: { before_id?: number; limit?: number }) =>
    http.get<Message[]>(`/orders/${orderId}/messages`, q),
  sendMessage: (orderId: number, data: { content?: string | null; image_url?: string | null }) =>
    http.post<Message>(`/orders/${orderId}/messages`, data),
  markMessagesRead: (orderId: number) => http.post<{ updated: number }>(`/orders/${orderId}/messages/read`),

  // Thanh toán (MoMo/VNPay đang là sandbox giả lập)
  createPayment: (orderId: number, method: PaymentMethod) =>
    http.post<Payment & { pay_url: string | null }>(`/orders/${orderId}/payments`, { method }),
  sandboxConfirm: (paymentId: number) => http.post<Payment>(`/payments/${paymentId}/sandbox-confirm`),
  listMyPayments: (q: Page = {}) => http.get<Paginated<MyPayment>>('/payments', q),

  // Đánh giá, khiếu nại, bảo hành
  createReview: (orderId: number, rating: number, comment: string | null) =>
    http.post<Review>(`/orders/${orderId}/review`, { rating, comment }),
  listMyReviews: (q: Page = {}) => http.get<Paginated<MyReview>>('/reviews', q),
  createComplaint: (orderId: number, title: string, content: string) =>
    http.post<Complaint>(`/orders/${orderId}/complaints`, { title, content }),
  claimWarranty: (orderId: number, content: string) => http.post<Complaint>(`/orders/${orderId}/warranty-claim`, { content }),
  listMyComplaints: () => http.get<Complaint[]>('/complaints'),

  // Thông báo
  listNotifications: (q: { unread_only?: boolean } & Page = {}) =>
    http.get<Paginated<AppNotification>>('/notifications', q),
  unreadCount: () => http.get<{ unread: number }>('/notifications/unread-count'),
  markNotificationRead: (id: number) => http.patch<AppNotification>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => http.patch<{ updated: number }>('/notifications/read-all'),
};
