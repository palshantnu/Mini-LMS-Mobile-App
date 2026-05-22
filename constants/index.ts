export const API_BASE_URL = "https://api.freeapi.app";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  BOOKMARKS: "course_bookmarks",
  USER_PREFERENCES: "user_preferences",
  LAST_ACTIVE: "last_active_timestamp",
  ENROLLED_COURSES: "enrolled_courses",
  BIOMETRIC_ENABLED: "biometric_auth_enabled",
  COURSE_PROGRESS: "course_progress",
} as const;

export const NOTIFICATION_IDS = {
  INACTIVITY_REMINDER: "inactivity-reminder",
  BOOKMARK_MILESTONE: "bookmark-milestone",
} as const;

export const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const COURSE_CATEGORIES = [
  "All",
  "Development",
  "Design",
  "Marketing",
  "Business",
  "Data Science",
  "Photography",
  "Music",
] as const;

export const PAGE_SIZE = 10;

export const REQUEST_TIMEOUT = 15000;

export const RETRY_COUNT = 3;

export const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export const BOOKMARK_MILESTONE = 5;

export const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#e0e7ff",
  background: "#f8fafc",
  surface: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  error: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  border: "#e2e8f0",
  divider: "#f1f5f9",
} as const;
