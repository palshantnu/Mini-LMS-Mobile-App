import { create } from "zustand";
import { courseService } from "../services/courseService";
import { Course } from "../types";
import { PAGE_SIZE } from "../constants";

interface CourseState {
  courses: Course[];
  filteredCourses: Course[];
  selectedCourse: Course | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  fetchCourses: (refresh?: boolean) => Promise<void>;
  loadMoreCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<Course | null>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  clearSelectedCourse: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  filteredCourses: [],
  selectedCourse: null,
  searchQuery: "",
  currentPage: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,

  fetchCourses: async (refresh = false) => {
    const state = get();
    if (state.isLoading && !refresh) return;

    set({ isLoading: !refresh, isRefreshing: refresh, error: null });
    try {
      const { courses, totalPages, total } = await courseService.fetchCourses(1, PAGE_SIZE);
      set({
        courses,
        filteredCourses: courses,
        currentPage: 1,
        totalPages,
        total,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Failed to fetch courses";
      set({ error: message, isLoading: false, isRefreshing: false });
    }
  },

  loadMoreCourses: async () => {
    const state = get();
    if (
      state.isLoadingMore ||
      state.currentPage >= state.totalPages ||
      state.searchQuery
    ) {
      return;
    }

    const nextPage = state.currentPage + 1;
    set({ isLoadingMore: true });

    try {
      const { courses, totalPages } = await courseService.fetchCourses(nextPage, PAGE_SIZE);
      set((prev) => ({
        courses: [...prev.courses, ...courses],
        filteredCourses: [...prev.filteredCourses, ...courses],
        currentPage: nextPage,
        totalPages,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const existing = get().courses.find((c) => c.id === id);
      if (existing) {
        set({ selectedCourse: existing, isLoading: false });
        return existing;
      }

      const course = await courseService.fetchCourseById(id);
      set({ selectedCourse: course, isLoading: false });
      return course;
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Failed to fetch course";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  setSearchQuery: (query: string) => {
    const state = get();
    set({ searchQuery: query });

    if (!query.trim()) {
      set({ filteredCourses: state.courses });
      return;
    }

    const q = query.toLowerCase();
    const filtered = state.courses.filter(
      (course) =>
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.instructor.name.toLowerCase().includes(q)
    );
    set({ filteredCourses: filtered });
  },

  clearError: () => set({ error: null }),

  clearSelectedCourse: () => set({ selectedCourse: null }),
}));
