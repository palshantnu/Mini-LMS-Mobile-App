import "../global.css";
import React, { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../store/authStore";
import { useBookmarkStore } from "../store/bookmarkStore";
import { notificationService } from "../services/notificationService";
import { storageService } from "../services/storageService";
import { analyticsService } from "../services/analyticsService";
import { crashReporter } from "../services/crashReporter";
import { securityService } from "../services/securityService";
import { registerAuthExpiredHandler } from "../services/api";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OfflineBanner } from "../components/OfflineBanner";
import { ThemeProvider } from "../context/ThemeContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const initializeBookmarks = useBookmarkStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    registerAuthExpiredHandler(logout);
  }, [logout]);

  useEffect(() => {
    crashReporter.setupGlobalHandler();

    const bootstrap = async () => {
      try {
        analyticsService.startNewSession();
        analyticsService.track("app_open");

        const [, , securityResult] = await Promise.all([
          initialize(),
          initializeBookmarks(),
          securityService.runChecks(),
        ]);

        if (!securityResult.isSecure && securityService.isProductionBuild()) {
          crashReporter.captureMessage("Security warning on startup", {
            warnings: securityResult.warnings.join(", "),
          });
        }

        await notificationService.requestPermissions();
      } catch (err) {
        crashReporter.captureException(err as Error, { context: "bootstrap" });
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    bootstrap();
  }, [initialize, initializeBookmarks]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          await storageService.updateLastActive();
          await notificationService.scheduleInactivityReminder();
        } else if (nextState === "active") {
          await storageService.updateLastActive();
          await notificationService.cancelInactivityReminder();
          analyticsService.track("app_open");
        }
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const receivedSub = notificationService.addNotificationReceivedListener(
      (_notification) => {
        analyticsService.track("notification_received");
      }
    );
    const responseSub = notificationService.addNotificationResponseReceivedListener(
      (_response) => {}
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  if (!isInitialized) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GestureHandlerRootView className="flex-1">
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="course/[id]"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="course/webview"
              options={{ headerShown: false, animation: "slide_from_bottom" }}
            />
          </Stack>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
