import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/authStore";
import { biometricService } from "../../services/biometricService";
import { analyticsService } from "../../services/analyticsService";
import { COLORS } from "../../constants";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function InputField({
  icon,
  placeholder,
  error,
  secureEntry,
  onToggleSecure,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  error?: string;
  secureEntry?: boolean;
  onToggleSecure?: () => void;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  autoCapitalize?: "none" | "words";
  keyboardType?: "email-address" | "default";
}) {
  return (
    <View className="mb-4">
      <View
        className={`flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 h-14 border ${
          error ? "border-red-400 bg-red-50" : "border-slate-200"
        }`}
      >
        <Ionicons name={icon} size={20} color={error ? COLORS.error : COLORS.textMuted} />
        <TextInput
          className="flex-1 ml-3 text-slate-900 dark:text-slate-100 text-base"
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureEntry}
          {...props}
        />
        {onToggleSecure !== undefined && (
          <Pressable
            onPress={onToggleSecure}
            hitSlop={8}
            accessibilityLabel={secureEntry ? "Show password" : "Hide password"}
            accessibilityRole="button"
          >
            <Ionicons
              name={secureEntry ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1.5 ml-1">{error}</Text>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric");
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await biometricService.isAvailable();
      const enabled = await biometricService.isEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);

      if (available) {
        const types = await biometricService.getSupportedTypes();
        setBiometricLabel(biometricService.getBiometricLabel(types));
      }
    };
    checkBiometric();
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data);
      // Always save credentials so biometric login works later
      await biometricService.saveCredentials(data.username, data.password);
      analyticsService.track("login", { method: "password" });
    } catch {
      analyticsService.track("error", { context: "login_password" });
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    clearError();
    try {
      const success = await biometricService.authenticate("Sign in to Mini LMS");
      if (success) {
        const credentials = await biometricService.getCredentials();
        if (credentials) {
          await login(credentials);
          analyticsService.track("login", { method: "biometric" });
        } else {
          // No stored credentials — user must login with password first
          useAuthStore.getState().clearError();
          // Show a helpful message by setting error state
          useAuthStore.setState({ error: "Please sign in with your password once to enable biometric login." });
        }
      }
    } catch {
      analyticsService.track("error", { context: "login_biometric" });
    } finally {
      setBiometricLoading(false);
    }
  };

  const showBiometricButton = biometricAvailable && biometricEnabled;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#6366f1", "#8B5CF6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute top-0 left-0 right-0"
        style={{ height: "42%" }}
      />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero section */}
            <View className="items-center pt-10 pb-8 px-6">
              <View
                className="w-20 h-20 rounded-3xl bg-white/20 items-center justify-center mb-5"
                style={{ borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }}
              >
                <Ionicons name="school" size={38} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold">Welcome back</Text>
              <Text className="text-white/75 text-base mt-1.5">
                Continue your learning journey
              </Text>
            </View>

            {/* Form card */}
            <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-8 pb-6" style={{ minHeight: 420 }}>
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text className="text-red-600 text-sm ml-2 flex-1">{error}</Text>
                  <Pressable
                    onPress={clearError}
                    hitSlop={8}
                    accessibilityLabel="Dismiss error"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </Pressable>
                </View>
              )}

              <Text className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-6">Sign in</Text>

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="person-outline"
                    placeholder="Username"
                    error={errors.username?.message}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="lock-closed-outline"
                    placeholder="Password"
                    error={errors.password?.message}
                    secureEntry={!showPassword}
                    onToggleSecure={() => setShowPassword(!showPassword)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                  />
                )}
              />

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                activeOpacity={0.85}
                style={{ marginTop: 8 }}
                accessibilityLabel="Sign in with username and password"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={isLoading ? ["#a5b4fc", "#a5b4fc"] : ["#6366f1", "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-14 rounded-2xl items-center justify-center"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base tracking-wide">Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Biometric login button */}
              {showBiometricButton && (
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center mt-4 py-3.5 rounded-2xl border-2 border-slate-200"
                  accessibilityLabel={`Sign in with ${biometricLabel}`}
                  accessibilityRole="button"
                >
                  {biometricLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="finger-print-outline" size={22} color={COLORS.primary} />
                      <Text className="text-primary-600 font-semibold ml-2">
                        Sign in with {biometricLabel}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-slate-200" />
                <Text className="text-text-muted mx-4 text-sm">or</Text>
                <View className="flex-1 h-px bg-slate-200" />
              </View>

              <View className="flex-row justify-center items-center">
                <Text className="text-text-secondary text-sm">New to Mini LMS? </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable accessibilityLabel="Create a new account" accessibilityRole="link">
                    <Text className="text-primary-600 font-bold text-sm">Create account</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
