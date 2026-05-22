import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LegendList } from "@legendapp/list";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { useCourseStore } from "../../store/courseStore";
import { CourseCard } from "../../components/CourseCard";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { router } from "expo-router";
import { Course } from "../../types";

export default function BookmarksScreen() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const isLoading = useCourseStore((s) => s.isLoading);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (courses.length === 0) {
        await fetchCourses();
      }
      setIsInitializing(false);
    };
    load();
  }, [courses.length, fetchCourses]);

  const bookmarkedCourses = courses.filter((course) =>
    bookmarks.some((b) => b.courseId === course.id)
  );

  const renderItem = useCallback(({ item }: { item: Course }) => {
    return <CourseCard course={item} />;
  }, []);

  if (isInitializing || isLoading) {
    return <LoadingState message="Loading your bookmarks..." />;
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <LinearGradient
        colors={["#6366f1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View className="px-5 pt-4 pb-6">
            <Text className="text-white text-2xl font-bold">Bookmarks</Text>
            <Text className="text-white/70 text-sm mt-1">
              {bookmarkedCourses.length} saved course{bookmarkedCourses.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {bookmarkedCourses.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No bookmarks yet"
          description="Save courses you want to take later by tapping the bookmark icon."
          actionLabel="Browse courses"
          onAction={() => router.replace("/(tabs)")}
        />
      ) : (
        <LegendList
          data={bookmarkedCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
          estimatedItemSize={340}
          recycleItems
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
