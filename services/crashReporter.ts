import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

interface CrashReport {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, string | number | boolean>;
  platform: string;
  appVersion: string;
  timestamp: string;
  handled: boolean;
}

const REPORTS_KEY = "crash_reports";
const MAX_REPORTS = 50;

async function saveReport(report: CrashReport): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const reports: CrashReport[] = raw ? (JSON.parse(raw) as CrashReport[]) : [];
    reports.unshift(report);
    if (reports.length > MAX_REPORTS) reports.length = MAX_REPORTS;
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // storage may be unavailable during a crash — swallow silently
  }
}

function buildReport(
  error: Error | string,
  context?: Record<string, string | number | boolean>,
  handled = true
): CrashReport {
  const err = typeof error === "string" ? new Error(error) : error;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message: err.message,
    stack: err.stack,
    context,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? "unknown",
    timestamp: new Date().toISOString(),
    handled,
  };
}

export const crashReporter = {
  captureException(
    error: Error | string,
    context?: Record<string, string | number | boolean>
  ): void {
    const report = buildReport(error, context, true);
    saveReport(report);
  },

  captureMessage(
    message: string,
    context?: Record<string, string | number | boolean>
  ): void {
    const report = buildReport(new Error(message), context, true);
    saveReport(report);
  },

  async getReports(): Promise<CrashReport[]> {
    try {
      const raw = await AsyncStorage.getItem(REPORTS_KEY);
      return raw ? (JSON.parse(raw) as CrashReport[]) : [];
    } catch {
      return [];
    }
  },

  async clearReports(): Promise<void> {
    await AsyncStorage.removeItem(REPORTS_KEY);
  },

  setupGlobalHandler(): void {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      const report = buildReport(error, { isFatal: isFatal ?? false }, false);
      saveReport(report);
      originalHandler(error, isFatal);
    });
  },
};
