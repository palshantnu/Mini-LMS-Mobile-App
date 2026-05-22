import * as Device from "expo-device";
import { Platform } from "react-native";

export interface SecurityCheckResult {
  isSecure: boolean;
  warnings: string[];
}

export const securityService = {
  async runChecks(): Promise<SecurityCheckResult> {
    const warnings: string[] = [];

    // Emulator / simulator check
    if (!Device.isDevice) {
      warnings.push("Running on emulator/simulator");
    }

    // Root / jailbreak detection heuristic via Device API
    // Device.osBuildId is unavailable on jailbroken devices in some cases
    if (Platform.OS === "android") {
      // Check for known dangerous device characteristics
      const brand = (Device.brand ?? "").toLowerCase();
      const model = (Device.modelName ?? "").toLowerCase();
      if (brand === "generic" || model.includes("generic")) {
        warnings.push("Device may be rooted or using a generic/emulated image");
      }
    }

    if (Platform.OS === "ios") {
      // On iOS, look for suspicious device model indicators
      const model = (Device.modelName ?? "").toLowerCase();
      if (model.includes("simulator")) {
        warnings.push("Running on iOS Simulator");
      }
    }

    return {
      isSecure: warnings.length === 0,
      warnings,
    };
  },

  isProductionBuild(): boolean {
    return !__DEV__;
  },
};
