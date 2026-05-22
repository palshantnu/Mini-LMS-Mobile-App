import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CourseCard } from "../../components/CourseCard";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { Course } from "../../types";

// Factories must use require() — jest.mock is hoisted above imports
jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const ReactLib = require("react");
    const { Text } = require("react-native");
    return ReactLib.createElement(Text, { testID: testID ?? `icon-${name}` }, name);
  },
}));

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("../../store/bookmarkStore");
jest.mock("../../components/CachedImage", () => ({
  CachedImage: ({ testID }: { testID?: string; [key: string]: unknown }) => {
    const ReactLib = require("react");
    const { View } = require("react-native");
    return ReactLib.createElement(View, { testID: testID ?? "cached-image" });
  },
}));

const mockCourse: Course = {
  id: "course-1",
  title: "React Native Masterclass",
  description: "Build production-ready mobile apps with React Native and Expo.",
  price: 49.99,
  category: "Development",
  thumbnail: "https://example.com/thumb.jpg",
  rating: 4.7,
  ratingCount: 1200,
  instructor: {
    id: "inst-1",
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "https://example.com/avatar.jpg",
    location: "San Francisco, CA",
  },
  duration: "12h 30m",
  level: "Intermediate",
  enrolledCount: 8500,
};

const mockToggleBookmark = jest.fn().mockResolvedValue(undefined);

const setupMockStore = (bookmarked = false) => {
  (useBookmarkStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) =>
      selector({
        isBookmarked: () => bookmarked,
        toggleBookmark: mockToggleBookmark,
      })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  setupMockStore();
});

describe("CourseCard", () => {
  it("renders course title", () => {
    const { getByText } = render(<CourseCard course={mockCourse} />);
    expect(getByText("React Native Masterclass")).toBeTruthy();
  });

  it("renders instructor name", () => {
    const { getByText } = render(<CourseCard course={mockCourse} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders formatted price", () => {
    const { getByText } = render(<CourseCard course={mockCourse} />);
    expect(getByText("$49.99")).toBeTruthy();
  });

  it("shows outline bookmark icon when not bookmarked", () => {
    const { getByTestId } = render(<CourseCard course={mockCourse} />);
    expect(getByTestId("icon-bookmark-outline")).toBeTruthy();
  });

  it("shows filled bookmark icon when bookmarked", () => {
    setupMockStore(true);
    const { getByTestId } = render(<CourseCard course={mockCourse} />);
    expect(getByTestId("icon-bookmark")).toBeTruthy();
  });

  it("calls toggleBookmark with course id on bookmark press", async () => {
    const { router } = require("expo-router");
    const { getByTestId } = render(<CourseCard course={mockCourse} />);
    // Press the bookmark icon – event bubbles up to the Pressable wrapper
    fireEvent.press(getByTestId("icon-bookmark-outline"));
    await Promise.resolve();
    expect(mockToggleBookmark).toHaveBeenCalledWith("course-1");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("navigates to course detail when card body is pressed", () => {
    const { router } = require("expo-router");
    const { getByText } = render(<CourseCard course={mockCourse} />);
    fireEvent.press(getByText("React Native Masterclass"));
    expect(router.push).toHaveBeenCalledWith("/course/course-1");
  });
});
