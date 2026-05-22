import { useCourseStore } from "../../store/courseStore";
import { courseService } from "../../services/courseService";
import { Course } from "../../types";

jest.mock("../../services/courseService");

const makeCourse = (id: string, category = "Development"): Course => ({
  id,
  title: `Course ${id}`,
  description: `Description for ${id}`,
  price: 29.99,
  category,
  thumbnail: `https://example.com/${id}.jpg`,
  rating: 4.5,
  ratingCount: 100,
  instructor: {
    id: `inst-${id}`,
    name: "Test Instructor",
    email: "inst@example.com",
    avatar: "https://example.com/avatar.jpg",
    location: "USA",
  },
  duration: "3h 00m",
  level: "Beginner",
  enrolledCount: 500,
});

const resetStore = () => {
  useCourseStore.setState({
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
  });
};

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe("courseStore – fetchCourses", () => {
  it("loads courses and sets state on success", async () => {
    const courses = [makeCourse("1"), makeCourse("2")];
    (courseService.fetchCourses as jest.Mock).mockResolvedValue({
      courses,
      totalPages: 3,
      total: 30,
    });

    await useCourseStore.getState().fetchCourses();

    const state = useCourseStore.getState();
    expect(state.courses).toHaveLength(2);
    expect(state.filteredCourses).toHaveLength(2);
    expect(state.totalPages).toBe(3);
    expect(state.total).toBe(30);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    (courseService.fetchCourses as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    await useCourseStore.getState().fetchCourses();

    const state = useCourseStore.getState();
    expect(state.error).toBe("Network error");
    expect(state.isLoading).toBe(false);
    expect(state.courses).toHaveLength(0);
  });

  it("sets isRefreshing during refresh", async () => {
    (courseService.fetchCourses as jest.Mock).mockResolvedValue({
      courses: [],
      totalPages: 1,
      total: 0,
    });

    const fetchPromise = useCourseStore.getState().fetchCourses(true);
    expect(useCourseStore.getState().isRefreshing).toBe(true);
    await fetchPromise;
    expect(useCourseStore.getState().isRefreshing).toBe(false);
  });

  it("resets to page 1 on refresh", async () => {
    useCourseStore.setState({ currentPage: 3 });
    (courseService.fetchCourses as jest.Mock).mockResolvedValue({
      courses: [],
      totalPages: 1,
      total: 0,
    });

    await useCourseStore.getState().fetchCourses(true);

    expect(useCourseStore.getState().currentPage).toBe(1);
  });
});

describe("courseStore – loadMoreCourses", () => {
  it("appends new courses on load more", async () => {
    const page1 = [makeCourse("1"), makeCourse("2")];
    const page2 = [makeCourse("3"), makeCourse("4")];
    useCourseStore.setState({ courses: page1, filteredCourses: page1, currentPage: 1, totalPages: 2 });

    (courseService.fetchCourses as jest.Mock).mockResolvedValue({
      courses: page2,
      totalPages: 2,
    });

    await useCourseStore.getState().loadMoreCourses();

    const state = useCourseStore.getState();
    expect(state.courses).toHaveLength(4);
    expect(state.currentPage).toBe(2);
  });

  it("does not load more when already on last page", async () => {
    useCourseStore.setState({ currentPage: 2, totalPages: 2 });

    await useCourseStore.getState().loadMoreCourses();

    expect(courseService.fetchCourses).not.toHaveBeenCalled();
  });

  it("does not load more when searching", async () => {
    useCourseStore.setState({ searchQuery: "react", currentPage: 1, totalPages: 3 });

    await useCourseStore.getState().loadMoreCourses();

    expect(courseService.fetchCourses).not.toHaveBeenCalled();
  });
});

describe("courseStore – setSearchQuery", () => {
  const courses = [
    makeCourse("1", "Development"),
    makeCourse("2", "Design"),
    makeCourse("3", "Development"),
  ];

  beforeEach(() => {
    useCourseStore.setState({ courses, filteredCourses: courses });
  });

  it("filters courses by title", () => {
    useCourseStore.getState().setSearchQuery("Course 1");
    const state = useCourseStore.getState();
    expect(state.filteredCourses).toHaveLength(1);
    expect(state.filteredCourses[0].id).toBe("1");
  });

  it("resets filtered courses when query is cleared", () => {
    useCourseStore.getState().setSearchQuery("Course 1");
    useCourseStore.getState().setSearchQuery("");
    expect(useCourseStore.getState().filteredCourses).toHaveLength(3);
  });

  it("is case-insensitive", () => {
    useCourseStore.getState().setSearchQuery("course 2");
    expect(useCourseStore.getState().filteredCourses).toHaveLength(1);
  });
});

describe("courseStore – fetchCourseById", () => {
  it("returns from cache when course already loaded", async () => {
    const cached = makeCourse("42");
    useCourseStore.setState({ courses: [cached] });

    const result = await useCourseStore.getState().fetchCourseById("42");

    expect(result).toEqual(cached);
    expect(courseService.fetchCourseById).not.toHaveBeenCalled();
  });

  it("fetches from service when not in cache", async () => {
    const course = makeCourse("99");
    (courseService.fetchCourseById as jest.Mock).mockResolvedValue(course);

    const result = await useCourseStore.getState().fetchCourseById("99");

    expect(result).toEqual(course);
    expect(useCourseStore.getState().selectedCourse).toEqual(course);
  });

  it("sets error when service returns null", async () => {
    (courseService.fetchCourseById as jest.Mock).mockResolvedValue(null);

    const result = await useCourseStore.getState().fetchCourseById("999");

    expect(result).toBeNull();
  });
});

describe("courseStore – clearError", () => {
  it("clears error field", () => {
    useCourseStore.setState({ error: "some error" });
    useCourseStore.getState().clearError();
    expect(useCourseStore.getState().error).toBeNull();
  });
});
