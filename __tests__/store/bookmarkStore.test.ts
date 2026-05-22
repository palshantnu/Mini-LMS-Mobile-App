import { useBookmarkStore } from "../../store/bookmarkStore";
import { storageService } from "../../services/storageService";
import { notificationService } from "../../services/notificationService";
import { BookmarkedCourse } from "../../types";

jest.mock("../../services/storageService");
jest.mock("../../services/notificationService");

const makeBookmarks = (count: number): BookmarkedCourse[] =>
  Array.from({ length: count }, (_, i) => ({
    courseId: `course-${i + 1}`,
    savedAt: new Date().toISOString(),
  }));

const resetStore = () => {
  useBookmarkStore.setState({
    bookmarks: [],
    enrolledCourses: [],
    isLoading: false,
    milestoneNotified: new Set(),
  });
};

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe("bookmarkStore – initialize", () => {
  it("loads bookmarks and enrolled courses from storage", async () => {
    const stored = makeBookmarks(2);
    (storageService.getBookmarks as jest.Mock).mockResolvedValue(stored);
    (storageService.getEnrolledCourses as jest.Mock).mockResolvedValue(["course-99"]);

    await useBookmarkStore.getState().initialize();

    expect(useBookmarkStore.getState().bookmarks).toEqual(stored);
    expect(useBookmarkStore.getState().enrolledCourses).toEqual(["course-99"]);
  });

  it("defaults to empty arrays when storage throws", async () => {
    (storageService.getBookmarks as jest.Mock).mockRejectedValue(new Error("Storage error"));
    (storageService.getEnrolledCourses as jest.Mock).mockRejectedValue(new Error("Storage error"));

    await useBookmarkStore.getState().initialize();

    expect(useBookmarkStore.getState().bookmarks).toEqual([]);
    expect(useBookmarkStore.getState().enrolledCourses).toEqual([]);
  });
});

describe("bookmarkStore – toggleBookmark", () => {
  it("adds a bookmark when not yet bookmarked", async () => {
    const added: BookmarkedCourse[] = [{ courseId: "course-1", savedAt: new Date().toISOString() }];
    (storageService.addBookmark as jest.Mock).mockResolvedValue(added);
    (notificationService.sendBookmarkMilestoneNotification as jest.Mock).mockResolvedValue(undefined);

    await useBookmarkStore.getState().toggleBookmark("course-1");

    expect(useBookmarkStore.getState().bookmarks).toEqual(added);
    expect(useBookmarkStore.getState().isBookmarked("course-1")).toBe(true);
  });

  it("removes a bookmark when already bookmarked", async () => {
    useBookmarkStore.setState({ bookmarks: makeBookmarks(1) });
    (storageService.removeBookmark as jest.Mock).mockResolvedValue([]);

    await useBookmarkStore.getState().toggleBookmark("course-1");

    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
    expect(useBookmarkStore.getState().isBookmarked("course-1")).toBe(false);
  });

  it("fires milestone notification when bookmarks reach 5", async () => {
    useBookmarkStore.setState({ bookmarks: makeBookmarks(4) });
    const after5 = makeBookmarks(5);
    (storageService.addBookmark as jest.Mock).mockResolvedValue(after5);
    (notificationService.sendBookmarkMilestoneNotification as jest.Mock).mockResolvedValue(undefined);

    await useBookmarkStore.getState().toggleBookmark("course-5");

    expect(notificationService.sendBookmarkMilestoneNotification).toHaveBeenCalledWith(5);
  });

  it("does not fire duplicate milestone notification for the same threshold", async () => {
    useBookmarkStore.setState({
      bookmarks: makeBookmarks(4),
      milestoneNotified: new Set([1]),
    });
    const after5 = makeBookmarks(5);
    (storageService.addBookmark as jest.Mock).mockResolvedValue(after5);

    await useBookmarkStore.getState().toggleBookmark("course-5");

    expect(notificationService.sendBookmarkMilestoneNotification).not.toHaveBeenCalled();
  });

  it("fires notification again at 10 bookmarks (second milestone)", async () => {
    useBookmarkStore.setState({
      bookmarks: makeBookmarks(9),
      milestoneNotified: new Set([1]),
    });
    const after10 = makeBookmarks(10);
    (storageService.addBookmark as jest.Mock).mockResolvedValue(after10);
    (notificationService.sendBookmarkMilestoneNotification as jest.Mock).mockResolvedValue(undefined);

    await useBookmarkStore.getState().toggleBookmark("course-10");

    expect(notificationService.sendBookmarkMilestoneNotification).toHaveBeenCalledWith(10);
  });
});

describe("bookmarkStore – enrollCourse", () => {
  it("adds course to enrolled list", async () => {
    (storageService.enrollCourse as jest.Mock).mockResolvedValue(["course-1"]);

    await useBookmarkStore.getState().enrollCourse("course-1");

    expect(useBookmarkStore.getState().enrolledCourses).toContain("course-1");
    expect(useBookmarkStore.getState().isEnrolled("course-1")).toBe(true);
  });

  it("isEnrolled returns false for non-enrolled course", () => {
    expect(useBookmarkStore.getState().isEnrolled("course-999")).toBe(false);
  });
});
