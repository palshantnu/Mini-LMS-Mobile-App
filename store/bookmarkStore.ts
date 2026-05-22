import { create } from "zustand";
import { storageService } from "../services/storageService";
import { notificationService } from "../services/notificationService";
import { BookmarkedCourse } from "../types";
import { BOOKMARK_MILESTONE } from "../constants";

interface BookmarkState {
  bookmarks: BookmarkedCourse[];
  enrolledCourses: string[];
  isLoading: boolean;
  milestoneNotified: Set<number>;
  initialize: () => Promise<void>;
  toggleBookmark: (courseId: string) => Promise<void>;
  isBookmarked: (courseId: string) => boolean;
  enrollCourse: (courseId: string) => Promise<void>;
  isEnrolled: (courseId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  enrolledCourses: [],
  isLoading: false,
  milestoneNotified: new Set(),

  initialize: async () => {
    try {
      const [bookmarks, enrolledCourses] = await Promise.all([
        storageService.getBookmarks(),
        storageService.getEnrolledCourses(),
      ]);
      set({ bookmarks, enrolledCourses });
    } catch {
      set({ bookmarks: [], enrolledCourses: [] });
    }
  },

  toggleBookmark: async (courseId: string) => {
    const state = get();
    const isCurrentlyBookmarked = state.isBookmarked(courseId);

    let updatedBookmarks: BookmarkedCourse[];
    if (isCurrentlyBookmarked) {
      updatedBookmarks = await storageService.removeBookmark(courseId);
    } else {
      updatedBookmarks = await storageService.addBookmark(courseId);
    }

    set({ bookmarks: updatedBookmarks });

    if (!isCurrentlyBookmarked) {
      const count = updatedBookmarks.length;
      const milestoneNotified = get().milestoneNotified;

      if (count >= BOOKMARK_MILESTONE && !milestoneNotified.has(Math.floor(count / BOOKMARK_MILESTONE))) {
        const milestoneKey = Math.floor(count / BOOKMARK_MILESTONE);
        await notificationService.sendBookmarkMilestoneNotification(count);
        set((prev) => ({
          milestoneNotified: new Set([...prev.milestoneNotified, milestoneKey]),
        }));
      }
    }
  },

  isBookmarked: (courseId: string) => {
    return get().bookmarks.some((b) => b.courseId === courseId);
  },

  enrollCourse: async (courseId: string) => {
    const updated = await storageService.enrollCourse(courseId);
    set({ enrolledCourses: updated });
  },

  isEnrolled: (courseId: string) => {
    return get().enrolledCourses.includes(courseId);
  },
}));
