import { api } from "./api";
import {
  ApiResponse,
  Course,
  Instructor,
  PaginatedData,
  RandomProduct,
  RandomUser,
} from "../types";

const COURSE_DURATIONS = ["2h 30m", "4h 15m", "6h 00m", "3h 45m", "5h 20m", "8h 10m"];
const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

function mapProductToCourse(product: RandomProduct, instructor: Instructor): Course {
  const seedIndex = product.id % COURSE_DURATIONS.length;
  const baseEnrolled = (product.stock ?? 50) * ((product.id % 5) + 2) * 10;
  return {
    id: String(product.id),
    title: product.title,
    description: product.description,
    price: product.price,
    category: normalizeCategoryToDomain(product.category),
    thumbnail: product.thumbnail,
    rating: product.rating ?? 0,
    ratingCount: product.stock ?? 0,
    instructor,
    duration: COURSE_DURATIONS[seedIndex],
    level: COURSE_LEVELS[product.id % 3],
    enrolledCount: baseEnrolled,
  };
}

function mapUserToInstructor(user: RandomUser): Instructor {
  return {
    id: user.login.uuid,
    name: `${user.name.first} ${user.name.last}`,
    email: user.email,
    avatar: user.picture.medium,
    location: user.location.country,
  };
}

function normalizeCategoryToDomain(category: string): string {
  const map: Record<string, string> = {
    smartphones: "Development",
    laptops: "Development",
    tablets: "Development",
    electronics: "Development",
    "mens-watches": "Business",
    "womens-watches": "Design",
    "mens-shirts": "Design",
    "womens-dresses": "Design",
    fragrances: "Health & Fitness",
    skincare: "Health & Fitness",
    groceries: "Business",
    "home-decoration": "Design",
    furniture: "Business",
    tops: "Design",
    "womens-shoes": "Design",
    "mens-shoes": "Design",
    "sunglasses": "Design",
    automotive: "Business",
    motorcycle: "Business",
    lighting: "Development",
    // fakestoreapi categories (fallback)
    "men's clothing": "Design",
    "women's clothing": "Design",
    jewelery: "Business",
    "home & kitchen": "Business",
    sports: "Health & Fitness",
  };
  return map[category.toLowerCase()] ?? "Development";
}

export const courseService = {
  async fetchCourses(page: number = 1, limit: number = 10): Promise<{
    courses: Course[];
    totalPages: number;
    total: number;
  }> {
    const [productsRes, usersRes] = await Promise.all([
      api.get<ApiResponse<PaginatedData<RandomProduct>>>(
        `/api/v1/public/randomproducts?page=${page}&limit=${limit}`
      ),
      api.get<ApiResponse<PaginatedData<RandomUser>>>(
        `/api/v1/public/randomusers?page=${page}&limit=${limit}`
      ),
    ]);

    const products = productsRes.data.data.data;
    const users = usersRes.data.data.data;
    const totalPages = productsRes.data.data.totalPages;
    const total = productsRes.data.data.total;

    const instructors = users.map(mapUserToInstructor);

    const courses = products.map((product, index) => {
      const instructor = instructors[index % instructors.length];
      return mapProductToCourse(product, instructor);
    });

    return { courses, totalPages, total };
  },

  async fetchCourseById(id: string): Promise<Course | null> {
    try {
      const [productRes, userRes] = await Promise.all([
        api.get<ApiResponse<RandomProduct>>(`/api/v1/public/randomproducts/product/${id}`),
        api.get<ApiResponse<PaginatedData<RandomUser>>>(
          `/api/v1/public/randomusers?page=1&limit=1`
        ),
      ]);

      const product = productRes.data.data;
      const user = userRes.data.data.data[0];

      if (!product || !user) return null;

      return mapProductToCourse(product, mapUserToInstructor(user));
    } catch {
      return null;
    }
  },

  async searchCourses(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: Course[]; totalPages: number; total: number }> {
    const result = await courseService.fetchCourses(page, limit);
    const filtered = result.courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase()) ||
        course.category.toLowerCase().includes(query.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(query.toLowerCase())
    );
    return {
      courses: filtered,
      totalPages: result.totalPages,
      total: filtered.length,
    };
  },
};
