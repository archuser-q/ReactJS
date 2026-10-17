import { createContext, useContext } from 'react';
import type { UIService } from '../utils/format';

export type ScreenName =
  | 'home'
  | 'book'
  | 'match'
  | 'track'
  | 'chat'
  | 'review'
  | 'history'
  | 'profile'
  | 'reviewsMine'
  | 'payment'
  | 'transactions'
  | 'personalInfo'
  | 'addresses'
  | 'help'
  | 'support'
  | 'notifications';

/** Nút "Quay lại" (và nút back của Android) sẽ đi về màn hình này – giống luồng trong bản thiết kế */
export const BACK_MAP: Partial<Record<ScreenName, ScreenName>> = {
  book: 'home',
  match: 'home',
  track: 'home',
  chat: 'track',
  review: 'track',
  history: 'home',
  profile: 'home',
  reviewsMine: 'profile',
  payment: 'profile',
  transactions: 'profile',
  personalInfo: 'profile',
  addresses: 'profile',
  help: 'profile',
  support: 'profile',
  notifications: 'home',
};

export type NavParams = {
  service?: UIService;
  /** Đơn đang xem ở các màn Thợ phù hợp / Theo dõi / Chat / Đánh giá */
  orderId?: number | null;
  /** Ghi đè màn quay lại (VD: từ Đặt dịch vụ mở Địa chỉ thì Back về lại Đặt dịch vụ) */
  returnTo?: ScreenName;
};

type NavContextValue = {
  screen: ScreenName;
  service: UIService | null;
  orderId: number | null;
  navigate: (screen: ScreenName, params?: NavParams) => void;
  goBack: () => void;
};

export const NavContext = createContext<NavContextValue | null>(null);

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav phải được dùng bên trong <CustomerApp>');
  return ctx;
}
