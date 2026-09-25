import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/theme';
import { LoadingState } from '@/components/ui';
import { useAppColors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { resolvedScheme } = useTheme();
  const colors = useAppColors();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <NavigationThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="product-form"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="sales" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});