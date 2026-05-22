import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CachedImage } from "../../components/CachedImage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { authService } from "../../services/authService";
import { biometricService } from "../../services/biometricService";
import { storageService } from "../../services/storageService";
import { analyticsService } from "../../services/analyticsService";
import { useTheme, ThemeMode } from "../../context/ThemeContext";
import { COLORS } from "../../constants";

interface StatPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <View
      className="flex-1 items-center py-4"
      style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, marginHorizontal: 4 }}
    >
      <Ionicons name={icon} size={20} color="white" />
      <Text className="text-white text-xl font-bold mt-1">{value}</Text>
      <Text className="text-white/70 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
  rightElement?: React.ReactNode;
  accessibilityLabel?: string;
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
  loading,
  rightElement,
  accessibilityLabel,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center px-5 py-4 border-b border-slate-50 active:bg-slate-50"
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: destructive ? "#fef2f2" : "#eef2ff" }}
      >
        <Ionicons name={icon} size={18} color={destructive ? "#ef4444" : COLORS.primary} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-semibold ${destructive ? "text-red-500" : "text-slate-900 dark:text-slate-100"}`}>
          {label}
        </Text>
        {subtitle && <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.textMuted} />
      ) : rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

interface EditProfileModalProps {
  visible: boolean;
  fullName: string;
  email: string;
  onClose: () => void;
  onSave: (fullName: string, email: string) => Promise<void>;
}

function EditProfileModal({ visible, fullName, email, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(fullName);
  const [mail, setMail] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setName(fullName);
      setMail(email);
      setError("");
    }
  }, [visible, fullName, email]);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(name.trim(), mail.trim());
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top", "bottom"]}>
        <View className="flex-row items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Cancel editing profile"
            accessibilityRole="button"
          >
            <Text className="text-slate-400 dark:text-slate-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-center text-slate-900 dark:text-slate-100 font-bold text-lg">Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Save profile changes"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text className="text-primary-600 font-bold text-base">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {error !== "" && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex-row items-center">
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text className="text-red-600 text-sm ml-2 flex-1">{error}</Text>
            </View>
          )}

          <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5 ml-0.5">
            Full Name
          </Text>
          <View className="flex-row items-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 h-14 mb-5">
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              className="flex-1 ml-3 text-slate-900 dark:text-slate-100 text-base"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              autoCapitalize="words"
              accessibilityLabel="Full name input"
            />
          </View>

          <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5 ml-0.5">
            Email
          </Text>
          <View className="flex-row items-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 h-14 mb-5">
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              className="flex-1 ml-3 text-slate-900 dark:text-slate-100 text-base"
              value={mail}
              onChangeText={setMail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email input"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
  { label: "System", value: "system", icon: "phone-portrait-outline" },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const enrolledCourses = useBookmarkStore((s) => s.enrolledCourses);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      const [prefs, bioAvailable, bioEnabled] = await Promise.all([
        storageService.getPreferences(),
        biometricService.isAvailable(),
        biometricService.isEnabled(),
      ]);
      setNotificationsEnabled(prefs.notifications);
      setBiometricEnabled(bioEnabled);
      setBiometricAvailable(bioAvailable);
    };
    loadPrefs();
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          analyticsService.track("logout");
          logout();
        },
      },
    ]);
  };

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await authService.updateAvatar(result.assets[0].uri);
      updateUser(updatedUser);
      analyticsService.track("course_view", { action: "avatar_update" });
    } catch {
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (fullName: string, email: string) => {
    const updatedUser = await authService.updateProfile({ fullName, email });
    updateUser(updatedUser);
    analyticsService.track("course_view", { action: "profile_edit" });
  };

  const handleToggleNotifications = async (value: boolean) => {
    setSavingPrefs(true);
    setNotificationsEnabled(value);
    await storageService.savePreferences({ notifications: value });
    setSavingPrefs(false);
    analyticsService.track("course_view", { action: "toggle_notifications", value: String(value) });
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await biometricService.authenticate("Authenticate to enable biometric login");
      if (!success) return;
    }
    setBiometricEnabled(value);
    await biometricService.setEnabled(value);
    await storageService.savePreferences({ biometricEnabled: value });
    analyticsService.track("course_view", { action: "toggle_biometric", value: String(value) });
  };

  const handleThemeChange = async (newMode: ThemeMode) => {
    await setThemeMode(newMode);
    analyticsService.track("course_view", { action: "theme_change", theme: newMode });
  };

  if (!user) return null;

  const avatarUri = user.avatar?.url;
  const initials = user.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <EditProfileModal
        visible={showEditModal}
        fullName={user.fullName ?? ""}
        email={user.email ?? ""}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient hero */}
        <LinearGradient
          colors={["#6366f1", "#8B5CF6", "#6366f1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={["top"]}>
            <View className="items-center px-5 pt-4 pb-6">
              <Text className="text-white text-lg font-bold self-start mb-4">My Profile</Text>

              <TouchableOpacity
                onPress={handleAvatarChange}
                disabled={isUploadingAvatar}
                accessibilityLabel="Change profile picture"
                accessibilityRole="button"
              >
                <View className="relative">
                  {avatarUri ? (
                    <CachedImage
                      source={{ uri: avatarUri }}
                      style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: "rgba(255,255,255,0.8)" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="w-24 h-24 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.25)", borderWidth: 3, borderColor: "rgba(255,255,255,0.7)" }}
                    >
                      <Text className="text-white text-3xl font-bold">{initials}</Text>
                    </View>
                  )}
                  <View
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons name="camera" size={14} color={COLORS.primary} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <Text className="text-white text-xl font-bold mt-3">{user.fullName}</Text>
              <Text className="text-white/70 text-sm mt-0.5">@{user.username}</Text>
              <Text className="text-white/60 text-xs mt-0.5">{user.email}</Text>

              <View
                className="mt-3 px-4 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }}
              >
                <Text className="text-white text-xs font-semibold capitalize">{user.role}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Stats row */}
        <View className="flex-row px-5 -mt-1 pb-4">
          <LinearGradient
            colors={["#6366f1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, flexDirection: "row", borderRadius: 20, padding: 12, marginTop: -16 }}
          >
            <StatPill icon="book-outline" value={enrolledCourses.length} label="Enrolled" />
            <StatPill icon="bookmark-outline" value={bookmarks.length} label="Saved" />
            <StatPill icon="trophy-outline" value={0} label="Completed" />
          </LinearGradient>
        </View>

        {/* Account section */}
        <View
          className="bg-white dark:bg-slate-800 rounded-3xl mx-5 mt-3 overflow-hidden"
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="px-5 pt-4 pb-1">
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Account</Text>
          </View>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            subtitle="Update your name and email"
            onPress={() => setShowEditModal(true)}
            accessibilityLabel="Edit your profile information"
          />
          <MenuItem
            icon="camera-outline"
            label="Change Photo"
            subtitle="Update your profile picture"
            onPress={handleAvatarChange}
            loading={isUploadingAvatar}
            accessibilityLabel="Change your profile photo"
          />
        </View>

        {/* Preferences section */}
        <View
          className="bg-white dark:bg-slate-800 rounded-3xl mx-5 mt-4 overflow-hidden"
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="px-5 pt-4 pb-1">
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Preferences</Text>
          </View>

          {/* Notifications toggle */}
          <View className="flex-row items-center px-5 py-4 border-b border-slate-50">
            <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center mr-4">
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Notifications</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Bookmark milestones & reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={savingPrefs}
              trackColor={{ false: "#e2e8f0", true: "#c7d2fe" }}
              thumbColor={notificationsEnabled ? COLORS.primary : "#94a3b8"}
              accessibilityLabel="Toggle push notifications"
            />
          </View>

          {/* Biometric toggle */}
          {biometricAvailable && (
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50">
              <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center mr-4">
                <Ionicons name="finger-print-outline" size={18} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Biometric Login</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Use fingerprint or Face ID</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: "#e2e8f0", true: "#c7d2fe" }}
                thumbColor={biometricEnabled ? COLORS.primary : "#94a3b8"}
                accessibilityLabel="Toggle biometric login"
              />
            </View>
          )}

          {/* Theme selector */}
          <View className="px-5 py-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center mr-4">
                <Ionicons name="color-palette-outline" size={18} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Appearance</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Choose your preferred theme</Text>
              </View>
            </View>
            <View className="flex-row gap-3 ml-14">
              {THEME_OPTIONS.map((opt) => {
                const active = themeMode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleThemeChange(opt.value)}
                    className="flex-1 items-center py-3 rounded-2xl border-2"
                    style={{
                      borderColor: active ? COLORS.primary : "#e2e8f0",
                      backgroundColor: active ? "#eef2ff" : "#f8fafc",
                    }}
                    accessibilityLabel={`Set ${opt.label} theme`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={opt.icon} size={20} color={active ? COLORS.primary : COLORS.textMuted} />
                    <Text
                      className="text-xs font-semibold mt-1"
                      style={{ color: active ? COLORS.primary : COLORS.textMuted }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Support section */}
        <View
          className="bg-white dark:bg-slate-800 rounded-3xl mx-5 mt-4 mb-8 overflow-hidden"
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="px-5 pt-4 pb-1">
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Support</Text>
          </View>
          <MenuItem
            icon="help-circle-outline"
            label="Help Center"
            subtitle="Get help and find answers"
            onPress={() => Alert.alert("Help", "Support is available at support@minilms.app")}
            accessibilityLabel="Open help center"
          />
          <MenuItem
            icon="information-circle-outline"
            label="About Mini LMS"
            subtitle="Version 1.0.0 · Built with Expo"
            onPress={() => Alert.alert("Mini LMS", "Version 1.0.0\nBuilt with Expo SDK 52\nAll rights reserved.")}
            accessibilityLabel="About this app"
          />
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            destructive
            loading={isLoading}
            accessibilityLabel="Sign out of your account"
          />
        </View>
      </ScrollView>
    </View>
  );
}
