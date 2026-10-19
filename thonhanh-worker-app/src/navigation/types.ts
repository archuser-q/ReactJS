import { createNavigationContainerRef, type NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Jobs: { group?: 'active' | 'completed' | 'cancelled' } | undefined;
  Earnings: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  // Chưa đăng nhập
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  ServerSettings: undefined;
  // Chưa được duyệt
  Onboarding: undefined;
  // Đã duyệt
  Main: NavigatorScreenParams<TabParamList> | undefined;
  JobDetail: { orderId: number };
  Chat: { orderId: number; customerName?: string; customerPhone?: string | null };
  Notifications: undefined;
  PersonalInfo: undefined;
  Skills: undefined;
  ServiceArea: undefined;
  Documents: undefined;
  Reviews: undefined;
  Performance: undefined;
  BankAccount: undefined;
  Withdraw: undefined;
  Topup: undefined;
  WalletHistory: undefined;
  EarningHistory: undefined;
  Help: undefined;
  ReportIssue: { orderId?: number; type?: string } | undefined;
  Reports: undefined;
  ChangePassword: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

/** Điều hướng từ bất kỳ màn nào (kể cả màn trong tab) tới các màn của stack gốc */
export function useRootNav(): RootNav {
  return useNavigation<RootNav>();
}
