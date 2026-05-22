import React, { memo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CachedImage } from "./CachedImage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Course } from "../types";
import { useBookmarkStore } from "../store/bookmarkStore";
import { COLORS } from "../constants";

interface CourseCardProps {
  course: Course;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "#dcfce7", text: "#16a34a" },
  Intermediate: { bg: "#fef9c3", text: "#ca8a04" },
  Advanced: { bg: "#fee2e2", text: "#dc2626" },
};

const StarRating = memo(({ rating }: { rating: number }) => (
  <View className="flex-row items-center">
    {Array.from({ length: 5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.round(rating) ? "star" : "star-outline"}
        size={11}
        color={i < Math.round(rating) ? "#f59e0b" : "#cbd5e1"}
      />
    ))}
    <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1 font-medium">{rating?.toFixed(1)}</Text>
  </View>
));

StarRating.displayName = "StarRating";

export const CourseCard = memo(({ course }: CourseCardProps) => {
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(course.id));
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const level = course.level ?? "Beginner";
  const levelStyle = LEVEL_COLORS[level] ?? LEVEL_COLORS.Beginner;

  const handlePress = useCallback(() => {
    router.push(`/course/${course.id}`);
  }, [course.id]);

  const handleBookmark = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleBookmark(course.id);
  }, [course.id, toggleBookmark]);

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-800 rounded-3xl mb-4 overflow-hidden active:opacity-95"
      style={{
        elevation: 4,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }}
      accessibilityLabel={`${course.title} by ${course.instructor.name}, ${course.level}, $${course.price.toFixed(2)}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view course details"
    >
      {/* Thumbnail with gradient overlay */}
      <View style={{ height: 180 }}>
        <CachedImage
          source={{ uri: course.thumbnail }}
          style={{ width: "100%", height: 180 }}
          contentFit="cover"
        />
        {/* Bottom gradient for text legibility */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
        />

        {/* Level badge — bottom left */}
        <View
          className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: levelStyle.bg }}
        >
          <Text className="text-xs font-semibold" style={{ color: levelStyle.text }}>
            {level}
          </Text>
        </View>

        {/* Price — bottom right */}
        <View className="absolute bottom-3 right-3 bg-white/95 px-2.5 py-1 rounded-full">
          <Text className="text-primary-600 text-xs font-bold">${course.price.toFixed(2)}</Text>
        </View>

        {/* Bookmark — top right */}
        <Pressable
          onPress={handleBookmark}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 items-center justify-center"
          hitSlop={8}
          onStartShouldSetResponder={() => true}
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
          accessibilityLabel={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          accessibilityRole="button"
          accessibilityState={{ selected: isBookmarked }}
        >
          <Ionicons
            testID={`icon-${isBookmarked ? "bookmark" : "bookmark-outline"}`}
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={16}
            color={isBookmarked ? COLORS.primary : COLORS.textSecondary}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View className="px-4 pt-3.5 pb-4">
        {/* Category chip */}
        <View className="flex-row items-center mb-2">
          <View className="bg-primary-50 px-2.5 py-0.5 rounded-full">
            <Text className="text-primary-600 text-xs font-medium">{course.category}</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-slate-900 dark:text-slate-100 font-bold text-base leading-snug mb-2" numberOfLines={2}>
          {course.title}
        </Text>

        {/* Instructor row */}
        <View className="flex-row items-center mb-3">
          <CachedImage
            source={{ uri: course.instructor.avatar }}
            style={{ width: 22, height: 22, borderRadius: 11, marginRight: 6 }}
            contentFit="cover"
          />
          <Text className="text-slate-400 dark:text-slate-500 text-xs flex-1" numberOfLines={1}>
            {course.instructor.name}
          </Text>
        </View>

        {/* Bottom row: rating | duration | students */}
        <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          <StarRating rating={course.rating} />

          <View className="flex-row items-center gap-3">
            {course.duration && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1">{course.duration}</Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
              <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                {(course.enrolledCount ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

CourseCard.displayName = "CourseCard";
