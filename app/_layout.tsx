import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';
import { HistoryProvider } from '../src/context/HistoryContext';
import { AuthProvider } from '../src/context/AuthContext';
import { I18nProvider } from '../src/context/I18nContext';

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <HistoryProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="cafe/[id]"
              options={{
                headerShown: true,
                headerTitle: '咖啡廳詳情',
                headerBackTitle: '返回',
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.text,
              }}
            />
          </Stack>
        </HistoryProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
