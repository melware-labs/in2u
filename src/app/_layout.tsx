import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Decide qué grupo de rutas mostrar según el estado de auth:
 * sin sesión -> login; con sesión pero sin pareja vinculada -> onboarding;
 * con sesión y pareja -> tabs. `Stack.Protected` (expo-router) hace el
 * redirect solo, sin manejar navegación a mano.
 */
function RootNavigator() {
  const { session, couple, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !couple}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !!couple}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}
