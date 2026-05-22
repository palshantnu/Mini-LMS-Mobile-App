import { storageService } from "../../services/storageService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../../types";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockUser: User = {
  _id: "u1",
  username: "tester",
  email: "tester@example.com",
  fullName: "Tester One",
  avatar: { url: "", localPath: "" },
  role: "USER",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("storageService – user", () => {
  it("saves and retrieves a user", async () => {
    await storageService.saveUser(mockUser);
    const retrieved = await storageService.getUser();
    expect(retrieved).toEqual(mockUser);
  });

  it("returns null when no user stored", async () => {
    const user = await storageService.getUser();
    expect(user).toBeNull();
  });

  it("clears user data", async () => {
    await storageService.saveUser(mockUser);
    await storageService.clearUser();
    const user = await storageService.getUser();
    expect(user).toBeNull();
  });
});

describe("storageService – bookmarks", () => {
  it("adds a bookmark", async () => {
    const bookmarks = await storageService.addBookmark("course-1");
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].courseId).toBe("course-1");
    expect(bookmarks[0].savedAt).toBeTruthy();
  });

  it("does not duplicate an existing bookmark", async () => {
    await storageService.addBookmark("course-1");
    const bookmarks = await storageService.addBookmark("course-1");
    expect(bookmarks).toHaveLength(1);
  });

  it("removes a bookmark", async () => {
    await storageService.addBookmark("course-1");
    await storageService.addBookmark("course-2");
    const bookmarks = await storageService.removeBookmark("course-1");
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].courseId).toBe("course-2");
  });

  it("returns true for isBookmarked on saved course", async () => {
    await storageService.addBookmark("course-xyz");
    const result = await storageService.isBookmarked("course-xyz");
    expect(result).toBe(true);
  });

  it("returns false for isBookmarked on unsaved course", async () => {
    const result = await storageService.isBookmarked("not-saved");
    expect(result).toBe(false);
  });

  it("saves and retrieves multiple bookmarks", async () => {
    const saved = [
      { courseId: "a", savedAt: "2024-01-01T00:00:00Z" },
      { courseId: "b", savedAt: "2024-01-02T00:00:00Z" },
    ];
    await storageService.saveBookmarks(saved);
    const retrieved = await storageService.getBookmarks();
    expect(retrieved).toHaveLength(2);
  });
});

describe("storageService – enrolled courses", () => {
  it("enrolls a course", async () => {
    const enrolled = await storageService.enrollCourse("course-1");
    expect(enrolled).toContain("course-1");
  });

  it("does not enroll the same course twice", async () => {
    await storageService.enrollCourse("course-1");
    const enrolled = await storageService.enrollCourse("course-1");
    expect(enrolled).toHaveLength(1);
  });

  it("retrieves enrolled courses list", async () => {
    await storageService.enrollCourse("c1");
    await storageService.enrollCourse("c2");
    const enrolled = await storageService.getEnrolledCourses();
    expect(enrolled).toEqual(["c1", "c2"]);
  });
});

describe("storageService – preferences", () => {
  it("returns defaults when no preferences stored", async () => {
    const prefs = await storageService.getPreferences();
    expect(prefs.notifications).toBe(true);
    expect(prefs.darkMode).toBe(false);
    expect(prefs.language).toBe("en");
  });

  it("saves and merges preferences", async () => {
    await storageService.savePreferences({ notifications: false });
    const prefs = await storageService.getPreferences();
    expect(prefs.notifications).toBe(false);
    expect(prefs.darkMode).toBe(false);
  });

  it("does a partial update without overwriting other fields", async () => {
    await storageService.savePreferences({ darkMode: true });
    await storageService.savePreferences({ language: "fr" });
    const prefs = await storageService.getPreferences();
    expect(prefs.darkMode).toBe(true);
    expect(prefs.language).toBe("fr");
  });
});

describe("storageService – last active", () => {
  it("saves and retrieves last active timestamp", async () => {
    await storageService.updateLastActive();
    const ts = await storageService.getLastActive();
    expect(ts).toBeGreaterThan(0);
  });

  it("returns null when last active not set", async () => {
    const ts = await storageService.getLastActive();
    expect(ts).toBeNull();
  });
});

describe("storageService – course progress", () => {
  it("saves and retrieves progress", async () => {
    await storageService.saveCourseProgress("course-1", 75);
    const progress = await storageService.getCourseProgress();
    expect(progress["course-1"]).toBe(75);
  });

  it("updates existing progress", async () => {
    await storageService.saveCourseProgress("course-1", 50);
    await storageService.saveCourseProgress("course-1", 90);
    const progress = await storageService.getCourseProgress();
    expect(progress["course-1"]).toBe(90);
  });
});
