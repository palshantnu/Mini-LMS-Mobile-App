import { Course } from "../types";

interface ScoredCourse {
  course: Course;
  score: number;
  reason: string;
}

interface UserProfile {
  bookmarkedIds: string[];
  enrolledIds: string[];
  bookmarkedCourses: Course[];
  enrolledCourses: Course[];
}

function getCategoryWeights(profile: UserProfile): Record<string, number> {
  const weights: Record<string, number> = {};

  profile.bookmarkedCourses.forEach((c) => {
    weights[c.category] = (weights[c.category] ?? 0) + 2;
  });

  profile.enrolledCourses.forEach((c) => {
    weights[c.category] = (weights[c.category] ?? 0) + 3;
  });

  return weights;
}

function getPreferredLevel(profile: UserProfile): string | null {
  const levels: Record<string, number> = {};

  [...profile.bookmarkedCourses, ...profile.enrolledCourses].forEach((c) => {
    if (c.level) {
      levels[c.level] = (levels[c.level] ?? 0) + 1;
    }
  });

  if (Object.keys(levels).length === 0) return null;
  return Object.entries(levels).sort((a, b) => b[1] - a[1])[0][0];
}


function scoreAndRankCourses(
  allCourses: Course[],
  profile: UserProfile
): ScoredCourse[] {
  const seenIds = new Set([...profile.bookmarkedIds, ...profile.enrolledIds]);
  const categoryWeights = getCategoryWeights(profile);
  const preferredLevel = getPreferredLevel(profile);

  const hasHistory =
    profile.bookmarkedIds.length > 0 || profile.enrolledIds.length > 0;

  return allCourses
    .filter((c) => !seenIds.has(c.id))
    .map((course) => {
      let score = 0;
      let reason = "";

      // Category affinity (0-60 pts)
      const categoryScore = (categoryWeights[course.category] ?? 0) * 10;
      score += Math.min(categoryScore, 60);

      // Level match (0-20 pts)
      if (preferredLevel && course.level === preferredLevel) {
        score += 20;
      }

      // Rating quality (0-20 pts)
      score += (course.rating / 5) * 20;

      // Popularity bonus (0-10 pts)
      const enrolled = course.enrolledCount ?? 0;
      if (enrolled > 10000) score += 10;
      else if (enrolled > 5000) score += 6;
      else if (enrolled > 1000) score += 3;

      // Price value (0-5 pts) — lower price = better value score
      if (course.price < 20) score += 5;
      else if (course.price < 50) score += 3;

      // Build human-readable reason
      if (hasHistory) {
        if (categoryScore >= 30) {
          reason = `Based on your interest in ${course.category}`;
        } else if (preferredLevel && course.level === preferredLevel) {
          reason = `Matches your ${preferredLevel} level`;
        } else if (course.rating >= 4.5) {
          reason = "Highly rated by learners";
        } else {
          reason = "Trending in our catalog";
        }
      } else {
        if (course.rating >= 4.5) {
          reason = "Top rated course";
        } else if (enrolled > 5000) {
          reason = "Popular among learners";
        } else {
          reason = "Recommended for new learners";
        }
      }

      return { course, score, reason };
    })
    .sort((a, b) => b.score - a.score);
}

export const aiRecommendationService = {
  getRecommendations(
    allCourses: Course[],
    profile: UserProfile,
    limit = 5
  ): ScoredCourse[] {
    if (allCourses.length === 0) return [];
    const ranked = scoreAndRankCourses(allCourses, profile);
    return ranked.slice(0, limit);
  },

  getTrendingCourses(allCourses: Course[], limit = 5): Course[] {
    return [...allCourses]
      .sort((a, b) => {
        const scoreA = a.rating * 20 + (a.enrolledCount ?? 0) / 1000;
        const scoreB = b.rating * 20 + (b.enrolledCount ?? 0) / 1000;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  getSimilarCourses(course: Course, allCourses: Course[], limit = 4): Course[] {
    return allCourses
      .filter((c) => c.id !== course.id)
      .map((c) => {
        let score = 0;
        if (c.category === course.category) score += 50;
        if (c.level === course.level) score += 30;
        score += (c.rating / 5) * 20;
        return { course: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.course);
  },
};

export type { ScoredCourse, UserProfile };
