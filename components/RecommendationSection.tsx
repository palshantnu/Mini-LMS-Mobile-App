import React, { memo, useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CachedImage } from "./CachedImage";
import { Course } from "../types";
import { aiRecommendationService, ScoredCourse } from "../services/aiRecommendationService";
import { useBookmarkStore } from "../store/bookmarkStore";
import { useCourseStore } from "../store/courseStore";
import { COLORS } from "../constants";

interface RecommendationCardProps {
  item: ScoredCourse;
}

const RecommendationCard = memo(({ item }: RecommendationCardProps) => {
  const { course, reason } = item;

  const handlePress = useCallback(() => {
    router.push(`/course/${course.id}`);
  }, [course.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={{ width: 220, marginRight: 12 }}
      accessibilityLabel={`Recommended: ${course.title}`}
      accessibilityRole="button"
    >
      <View
        className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden"
        style={{
          elevation: 4,
          shadowColor: "#6366f1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        {/* Thumbnail */}
        <View style={{ height: 120 }}>
          <CachedImage
            source={{ uri: course.thumbnail }}
            style={{ width: "100%", height: 120 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }}
          />
          <View className="absolute bottom-2 left-2 bg-white/20 border border-white/40 px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs font-semibold">{course.category}</Text>
          </View>
          <View className="absolute top-2 right-2 flex-row items-center bg-black/30 px-2 py-0.5 rounded-full">
            <Ionicons name="star" size={10} color="#fbbf24" />
            <Text className="text-white text-xs ml-0.5">{course.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-3 pt-2.5 pb-3">
          <Text className="text-slate-900 dark:text-slate-100 font-bold text-sm" numberOfLines={2}>
            {course.title}
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1" numberOfLines={1}>
            {course.instructor.name}
          </Text>

          {/* AI reason chip */}
          <View className="flex-row items-center mt-2 bg-indigo-50 rounded-full px-2.5 py-1 self-start">
            <Ionicons name="sparkles" size={10} color={COLORS.primary} />
            <Text className="text-primary-600 text-xs font-medium ml-1" numberOfLines={1}>
              {reason}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

RecommendationCard.displayName = "RecommendationCard";

interface TrendingChipProps {
  course: Course;
}

const TrendingChip = memo(({ course }: TrendingChipProps) => {
  const handlePress = useCallback(() => {
    router.push(`/course/${course.id}`);
  }, [course.id]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 mr-2 mb-2"
      style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
      accessibilityLabel={`Trending: ${course.title}`}
      accessibilityRole="button"
    >
      <Ionicons name="trending-up" size={14} color={COLORS.primary} />
      <Text className="text-slate-900 dark:text-slate-100 text-xs font-semibold ml-1.5" numberOfLines={1} style={{ maxWidth: 130 }}>
        {course.title}
      </Text>
      <View className="flex-row items-center ml-2">
        <Ionicons name="star" size={10} color="#fbbf24" />
        <Text className="text-slate-400 dark:text-slate-500 text-xs ml-0.5">{course.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
});

TrendingChip.displayName = "TrendingChip";

export const RecommendationSection = memo(() => {
  const courses = useCourseStore((s) => s.courses);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const enrolledCourses = useBookmarkStore((s) => s.enrolledCourses);

  const bookmarkedIds = useMemo(
    () => bookmarks.map((b) => b.courseId),
    [bookmarks]
  );

  const bookmarkedCourses = useMemo(
    () => courses.filter((c) => bookmarkedIds.includes(c.id)),
    [courses, bookmarkedIds]
  );

  const enrolledCourseObjects = useMemo(
    () => courses.filter((c) => enrolledCourses.includes(c.id)),
    [courses, enrolledCourses]
  );

  const recommendations = useMemo(
    () =>
      aiRecommendationService.getRecommendations(
        courses,
        {
          bookmarkedIds,
          enrolledIds: enrolledCourses,
          bookmarkedCourses,
          enrolledCourses: enrolledCourseObjects,
        },
        5
      ),
    [courses, bookmarkedIds, enrolledCourses, bookmarkedCourses, enrolledCourseObjects]
  );

  const trending = useMemo(
    () => aiRecommendationService.getTrendingCourses(courses, 5),
    [courses]
  );

  if (courses.length === 0) return null;

  return (
    <View className="mb-2">
      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <View className="mb-5">
          <View className="flex-row items-center px-5 mb-3">
            <View className="w-7 h-7 rounded-lg bg-indigo-100 items-center justify-center mr-2">
              <Ionicons name="sparkles" size={15} color={COLORS.primary} />
            </View>
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-base flex-1">
              {bookmarkedIds.length > 0 || enrolledCourses.length > 0
                ? "Recommended For You"
                : "Top Picks"}
            </Text>
            <Text className="text-primary-500 text-xs font-semibold">AI Powered</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {recommendations.map((item) => (
              <RecommendationCard key={item.course.id} item={item} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trending section */}
      {trending.length > 0 && (
        <View className="mb-2">
          <View className="flex-row items-center px-5 mb-3">
            <View className="w-7 h-7 rounded-lg bg-orange-100 items-center justify-center mr-2">
              <Ionicons name="trending-up" size={15} color="#f97316" />
            </View>
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-base">Trending Now</Text>
          </View>

          <View className="flex-row flex-wrap px-5">
            {trending.map((course) => (
              <TrendingChip key={course.id} course={course} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

RecommendationSection.displayName = "RecommendationSection";
