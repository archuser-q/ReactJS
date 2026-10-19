import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, qk } from '../api';
import { useAuth, useWorkerMe } from '../auth/AuthContext';
import { Icon, type IconName } from '../components/Icon';
import { useOverlay } from '../components/Overlay';
import { useLocationTracker } from '../hooks/useLocation';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { colors, fonts } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ServerSettingsScreen from '../screens/auth/ServerSettingsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import HomeScreen from '../screens/home/HomeScreen';
import { OfferCenter } from '../screens/home/OfferCenter';
import JobsScreen from '../screens/jobs/JobsScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import ChatScreen from '../screens/jobs/ChatScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import { BankAccountScreen, EarningHistoryScreen, TopupScreen, WalletHistoryScreen, WithdrawScreen } from '../screens/earnings/WalletScreens';
import AccountScreen from '../screens/account/AccountScreen';
import PersonalInfoScreen from '../screens/account/PersonalInfoScreen';
import SkillsScreen from '../screens/account/SkillsScreen';
import DocumentsScreen from '../screens/account/DocumentsScreen';
import ServiceAreaScreen from '../screens/account/ServiceAreaScreen';
import { PerformanceScreen, ReviewsScreen } from '../screens/account/ReviewsPerformance';
import { ChangePasswordScreen, HelpScreen, ReportIssueScreen, ReportsScreen } from '../screens/account/SupportScreens';
import NotificationsScreen from '../screens/common/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TABS: Record<keyof TabParamList, { label: string; icon: IconName; iconOn: IconName }> = {
  Home: { label: 'Trang chủ', icon: 'home-outline', iconOn: 'home' },
  Jobs: { label: 'Công việc', icon: 'clipboard-text-outline', iconOn: 'clipboard-text' },
  Earnings: { label: 'Thu nhập', icon: 'wallet-outline', iconOn: 'wallet' },
  Account: { label: 'Hồ sơ', icon: 'account-circle-outline', iconOn: 'account-circle' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const home = useQuery({ queryKey: qk.home, queryFn: api.home, refetchInterval: 15000 });
  const activeJobs = (home.data?.active_job ? 1 : 0) + (home.data?.upcoming.length ?? 0);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontFamily: fonts['700'] },
        // Tự tính chiều cao + chừa thanh điều hướng của hệ thống (Android tràn viền / iPhone có thanh Home)
        tabBarStyle: {
          borderTopColor: colors.line,
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.tabIcon, focused && { backgroundColor: colors.voltSoft }]}>
            <Icon name={focused ? TABS[route.name].iconOn : TABS[route.name].icon} size={22} color={color} />
          </View>
        ),
        tabBarLabel: TABS[route.name].label,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ tabBarBadge: activeJobs || undefined, tabBarBadgeStyle: { backgroundColor: colors.dangerMid, fontSize: 10 } }}
      />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

/** Chạy nền khi thợ đã được duyệt: gửi vị trí, đăng ký push */
function WorkerRuntime() {
  const home = useQuery({ queryKey: qk.home, queryFn: api.home, refetchInterval: 15000 });
  const d = home.data;
  const tracking = !!d && (d.availability !== 'offline' || (!!d.active_job && ['on_the_way', 'arrived', 'in_progress'].includes(d.active_job.status)));
  useLocationTracker(tracking);
  usePushRegistration(true);
  return null;
}

function Splash({ text }: { text?: string }) {
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <View style={styles.logo}>
        <Icon name="lightning-bolt" size={38} color={colors.navy} />
      </View>
      <ActivityIndicator color={colors.volt} />
      {text ? <Text style={styles.splashText}>{text}</Text> : null}
    </View>
  );
}

export default function RootNavigator() {
  const { status } = useAuth();
  const me = useWorkerMe();
  const ui = useOverlay();
  const verification = me.data?.profile.verification_status;
  const approved = verification === 'approved';
  const prev = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prev.current && prev.current !== 'approved' && verification === 'approved') {
      void ui.alert('Hồ sơ đã được duyệt 🎉', 'Chào mừng bạn trở thành đối tác Thợ Nhanh! Bật nhận đơn ở Trang chủ để bắt đầu nhận việc.', 'success');
    }
    prev.current = verification;
  }, [verification, ui]);

  if (status === 'booting') return <Splash />;
  if (status === 'authed' && !me.data) {
    return me.isError ? <Splash text="Không tải được hồ sơ, đang thử lại..." /> : <Splash />;
  }

  return (
    <OfferCenter enabled={status === 'authed' && approved}>
      {status === 'authed' && approved ? <WorkerRuntime /> : null}
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {status === 'guest' ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} />
          </>
        ) : !approved ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="Skills" component={SkillsScreen} />
            <Stack.Screen name="ServiceArea" component={ServiceAreaScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="Skills" component={SkillsScreen} />
            <Stack.Screen name="ServiceArea" component={ServiceAreaScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
            <Stack.Screen name="Performance" component={PerformanceScreen} />
            <Stack.Screen name="BankAccount" component={BankAccountScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="Topup" component={TopupScreen} />
            <Stack.Screen name="WalletHistory" component={WalletHistoryScreen} />
            <Stack.Screen name="EarningHistory" component={EarningHistoryScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </OfferCenter>
  );
}

const styles = StyleSheet.create({
  tabIcon: { width: 46, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.navy },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.volt, alignItems: 'center', justifyContent: 'center' },
  splashText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
