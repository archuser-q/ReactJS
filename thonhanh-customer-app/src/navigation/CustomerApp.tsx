import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../auth/AuthContext';
import type { UIService } from '../utils/format';
import { BACK_MAP, NavContext, type NavParams, type ScreenName } from './NavigationContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BookScreen from '../screens/BookScreen';
import MatchScreen from '../screens/MatchScreen';
import TrackScreen from '../screens/TrackScreen';
import ChatScreen from '../screens/ChatScreen';
import ReviewScreen from '../screens/ReviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReviewsMineScreen from '../screens/ReviewsMineScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import AddressesScreen from '../screens/AddressesScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import SupportContactScreen from '../screens/SupportContactScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const SCREENS: Record<ScreenName, ComponentType> = {
  home: HomeScreen,
  book: BookScreen,
  match: MatchScreen,
  track: TrackScreen,
  chat: ChatScreen,
  review: ReviewScreen,
  history: HistoryScreen,
  profile: ProfileScreen,
  reviewsMine: ReviewsMineScreen,
  payment: PaymentMethodsScreen,
  transactions: TransactionsScreen,
  personalInfo: PersonalInfoScreen,
  addresses: AddressesScreen,
  help: HelpCenterScreen,
  support: SupportContactScreen,
  notifications: NotificationsScreen,
};

/** Các tab ở thanh dưới tự chọn đơn đang chạy, không giữ đơn cũ */
const TAB_SCREENS: ScreenName[] = ['home', 'history', 'track', 'chat', 'profile'];

function LoggedInApp() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [service, setService] = useState<UIService | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [backOverride, setBackOverride] = useState<{ from: ScreenName; to: ScreenName } | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const navigate = useCallback((s: ScreenName, params?: NavParams) => {
    if (params?.service) setService(params.service);
    if (params && 'orderId' in params) setOrderId(params.orderId ?? null);
    setBackOverride(params?.returnTo ? { from: s, to: params.returnTo } : null);
    setScreen(s);
  }, []);

  const goBack = useCallback(() => {
    const prev = backOverride?.from === screen ? backOverride.to : BACK_MAP[screen];
    if (prev) {
      setBackOverride(null);
      setScreen(prev);
    }
  }, [screen, backOverride]);

  // Bấm tab dưới (không truyền orderId) -> màn tự tìm đơn đang chạy
  const navigateTab = useCallback(
    (s: ScreenName) => {
      if (TAB_SCREENS.includes(s) && s !== screen) setOrderId(null);
      navigate(s);
    },
    [navigate, screen],
  );

  // Nút Back vật lý của Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (BACK_MAP[screen] || backOverride?.from === screen) {
        goBack();
        return true;
      }
      return false; // đang ở Trang chủ -> thoát app
    });
    return () => sub.remove();
  }, [screen, goBack, backOverride]);

  // Ẩn thanh tab khi bàn phím mở
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const b = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const value = useMemo(
    () => ({ screen, service, orderId, navigate, goBack }),
    [screen, service, orderId, navigate, goBack],
  );
  const Current = SCREENS[screen];

  return (
    <NavContext.Provider value={value}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior="padding">
        <View style={{ flex: 1 }}>
          <Current />
        </View>
        {!keyboardOpen && <BottomNav onTab={navigateTab} />}
      </KeyboardAvoidingView>
    </NavContext.Provider>
  );
}

export default function CustomerApp() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!user) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior="padding">
        <LoginScreen />
      </KeyboardAvoidingView>
    );
  }
  // key = user.id: đổi tài khoản thì reset toàn bộ state điều hướng
  return <LoggedInApp key={user.id} />;
}
