export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: {
    url: string;
    localPath: string;
  };
  role: string;
  createdAt: string;
  updatedAt: string;
  coursesEnrolled?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: "USER" | "ADMIN";
}

export interface RandomUserName {
  title: string;
  first: string;
  last: string;
}

export interface RandomUserPicture {
  large: string;
  medium: string;
  thumbnail: string;
}

export interface RandomUserLocation {
  city: string;
  state: string;
  country: string;
  postcode: string | number;
}

export interface RandomUser {
  login: { uuid: string };
  name: RandomUserName;
  email: string;
  picture: RandomUserPicture;
  location: RandomUserLocation;
  dob: { date: string; age: number };
  phone: string;
  gender: string;
}

export interface RandomProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  thumbnail: string;
  rating: number;
  stock: number;
  brand?: string;
  images?: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  ratingCount: number;
  instructor: Instructor;
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  enrolledCount?: number;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
}

export interface BookmarkedCourse {
  courseId: string;
  savedAt: string;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  themeMode?: "light" | "dark" | "system";
  biometricEnabled?: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface WebViewMessage {
  type: "ENROLL" | "BOOKMARK" | "READY" | "ERROR";
  payload?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
