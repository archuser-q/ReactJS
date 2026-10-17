import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import CustomerApp from './src/navigation/CustomerApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CustomerApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
