import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import "../global.css"; 

import * as Sentry from '@sentry/react-native';


SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN_RN,
  debug: process.env.EXPO_PUBLIC_APP_ENV === 'debug',
  environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  tracesSampleRate: 1.0,
});

function RootLayoutNav() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* Define your stack screens here later */}
        {/* Example: <Stack.Screen name="(main)" options={{ headerShown: false }} /> */}
        {/* Example: <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayoutNav);