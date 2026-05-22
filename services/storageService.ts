import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "../constants";
import { BookmarkedCourse, User, UserPreferences } from "../types";

export const storageService = {
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  async getBookmarks(): Promise<BookmarkedCourse[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? (JSON.parse(raw) as BookmarkedCourse[]) : [];
  },

  async saveBookmarks(bookmarks: BookmarkedCourse[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  async addBookmark(courseId: string): Promise<BookmarkedCourse[]> {
    const existing = await storageService.getBookmarks();
    const alreadyExists = existing.some((b) => b.courseId === courseId);
    if (alreadyExists) return existing;
    const updated = [...existing, { courseId, savedAt: new Date().toISOString() }];
    await storageService.saveBookmarks(updated);
    return updated;
  },

  async removeBookmark(courseId: string): Promise<BookmarkedCourse[]> {
    const existing = await storageService.getBookmarks();
    const updated = existing.filter((b) => b.courseId !== courseId);
    await storageService.saveBookmarks(updated);
    return updated;
  },

  async isBookmarked(courseId: string): Promise<boolean> {
    const existing = await storageService.getBookmarks();
    return existing.some((b) => b.courseId === courseId);
  },

  async getEnrolledCourses(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLED_COURSES);
    return raw ? (JSON.parse(raw) as string[]) : [];
  },

  async enrollCourse(courseId: string): Promise<string[]> {
    const existing = await storageService.getEnrolledCourses();
    if (existing.includes(courseId)) return existing;
    const updated = [...existing, courseId];
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLED_COURSES, JSON.stringify(updated));
    return updated;
  },

  async getPreferences(): Promise<UserPreferences> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return raw
      ? (JSON.parse(raw) as UserPreferences)
      : { notifications: true, darkMode: false, language: "en", themeMode: "system", biometricEnabled: false };
  },

  async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await storageService.getPreferences();
    const updated = { ...existing, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    return updated;
  },

  async getCourseProgress(): Promise<Record<string, number>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  },

  async saveCourseProgress(courseId: string, progressPercent: number): Promise<void> {
    const existing = await storageService.getCourseProgress();
    const updated = { ...existing, [courseId]: progressPercent };
    await AsyncStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(updated));
  },

  async updateLastActive(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
  },

  async getLastActive(): Promise<number | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    return raw ? parseInt(raw, 10) : null;
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      // Keep USER_PREFERENCES — settings like biometric, theme, notifications should survive logout
      AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.LAST_ACTIVE,
        STORAGE_KEYS.ENROLLED_COURSES,
        STORAGE_KEYS.COURSE_PROGRESS,
      ]),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },
};
