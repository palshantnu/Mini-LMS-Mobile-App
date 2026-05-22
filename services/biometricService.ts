import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "biometric_auth_enabled";
const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  async authenticate(reason = "Verify your identity to continue"): Promise<boolean> {
    const available = await biometricService.isAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });

    return result.success;
  },

  async isEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === "true";
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
  },

  async saveCredentials(username: string, password: string): Promise<void> {
    const data = JSON.stringify({ username, password });
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, data);
  },

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  async clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  },

  getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "Face ID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "Fingerprint";
    }
    return "Biometric";
  },
};
