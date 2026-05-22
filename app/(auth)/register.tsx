import React from "react";
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
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../constants";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function InputField({
  icon,
  label,
  placeholder,
  error,
  secureEntry,
  onToggleSecure,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
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
  const { colorScheme } = useColorScheme();
  const textColor = colorScheme === "dark" ? "#f1f5f9" : "#0f172a";

  return (
    <View className="mb-4">
      <Text className="text-slate-900 dark:text-slate-100 text-sm font-semibold mb-1.5 ml-0.5">{label}</Text>
      <View
        className={`flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 h-14 border ${
          error ? "border-red-400 bg-red-50" : "border-slate-200"
        }`}
      >
        <Ionicons name={icon} size={20} color={error ? COLORS.error : COLORS.textMuted} />
        <TextInput
          className="flex-1 ml-3 text-base"
          style={{ color: textColor }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureEntry}
          {...props}
        />
        {onToggleSecure !== undefined && (
          <Pressable onPress={onToggleSecure} hitSlop={8}>
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

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [showPassword, setShowPassword] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    await register({ fullName: data.fullName, username: data.username, email: data.email, password: data.password, role: "USER" });
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#6366f1", "#8B5CF6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute top-0 left-0 right-0"
        style={{ height: 220 }}
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
            <View className="items-center pt-8 pb-6 px-6">
              <View
                className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center mb-4"
                style={{ borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }}
              >
                <Ionicons name="school" size={30} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold">Create account</Text>
              <Text className="text-white/75 text-sm mt-1">Start learning today</Text>
            </View>

            {/* Form card */}
            <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-7 pb-8">
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text className="text-red-600 text-sm ml-2 flex-1">{error}</Text>
                  <Pressable onPress={clearError} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </Pressable>
                </View>
              )}

              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="person-outline"
                    label="Full Name"
                    placeholder="John Doe"
                    error={errors.fullName?.message}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                  />
                )}
              />

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="at-outline"
                    label="Username"
                    placeholder="johndoe123"
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
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="mail-outline"
                    label="Email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="lock-closed-outline"
                    label="Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
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

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputField
                    icon="shield-checkmark-outline"
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword?.message}
                    secureEntry={!showPassword}
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
                className="mt-2"
                accessibilityLabel="Create account"
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
                    <Text className="text-white font-bold text-base tracking-wide">
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-slate-600 dark:text-slate-300 text-sm">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text className="text-primary-600 font-bold text-sm">Sign In</Text>
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
