import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { storageService } from "../services/storageService";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  isDark: false,
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    storageService.getPreferences().then((prefs) => {
      const saved = (prefs.themeMode as ThemeMode) ?? "system";
      setModeState(saved);
      setColorScheme(saved === "system" ? "system" : saved);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    setColorScheme(newMode === "system" ? "system" : newMode);
    await storageService.savePreferences({ themeMode: newMode });
  }, [setColorScheme]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
