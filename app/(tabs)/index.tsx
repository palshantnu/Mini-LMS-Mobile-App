import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LegendList } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { useCourseStore } from "../../store/courseStore";
import { useAuthStore } from "../../store/authStore";
import { CourseCard } from "../../components/CourseCard";
import { CourseListSkeleton } from "../../components/LoadingState";
import { RetryView } from "../../components/RetryView";
import { EmptyState } from "../../components/EmptyState";
import { useDebounce } from "../../hooks/useDebounce";
import { RecommendationSection } from "../../components/RecommendationSection";
import { Course } from "../../types";
import { COLORS } from "../../constants";

const CATEGORIES = ["All", "Development", "Design", "Business", "Health & Fitness"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function CoursesScreen() {
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const loadMoreCourses = useCourseStore((s) => s.loadMoreCourses);
  const setSearchQuery = useCourseStore((s) => s.setSearchQuery);
  const filteredCourses = useCourseStore((s) => s.filteredCourses);
  const isLoading = useCourseStore((s) => s.isLoading);
  const isRefreshing = useCourseStore((s) => s.isRefreshing);
  const isLoadingMore = useCourseStore((s) => s.isLoadingMore);
  const error = useCourseStore((s) => s.error);
  const searchQuery = useCourseStore((s) => s.searchQuery);
  const user = useAuthStore((s) => s.user);

  const [localSearch, setLocalSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const debouncedSearch = useDebounce(localSearch, 300);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCourses();
    }
  }, [fetchCourses]);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const handleRefresh = useCallback(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  const handleLoadMore = useCallback(() => {
    if (!searchQuery) {
      loadMoreCourses();
    }
  }, [loadMoreCourses, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setLocalSearch("");
  }, []);

  const displayedCourses =
    activeCategory === "All"
      ? filteredCourses
      : filteredCourses.filter((c) => c.category === activeCategory);

  const renderItem = useCallback(({ item }: { item: Course }) => {
    return <CourseCard course={item} />;
  }, []);

  const renderHeader = useCallback(() => {
    if (searchQuery || activeCategory !== "All") return null;
    return <RecommendationSection />;
  }, [searchQuery, activeCategory]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const firstName = user?.fullName?.split(" ")[0] ?? "Learner";

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={["top"]}>
        <LinearGradient
          colors={["#6366f1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        >
          <Text className="text-white/80 text-sm">{getGreeting()}</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{firstName} 👋</Text>
          <Text className="text-white/70 text-sm mt-1">Continue your learning journey</Text>
        </LinearGradient>
        <CourseListSkeleton />
      </SafeAreaView>
    );
  }

  if (error && filteredCourses.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <RetryView message={error} onRetry={() => fetchCourses()} isLoading={isLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={["top"]}>
      {/* Gradient header */}
      <LinearGradient
        colors={["#6366f1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
      >
        <Text className="text-white/80 text-sm">{getGreeting()},</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">{firstName} 👋</Text>
        <Text className="text-white/70 text-sm mt-0.5">
          {displayedCourses.length} courses available
        </Text>

        {/* Search bar */}
        <View className="flex-row items-center bg-white/20 border border-white/30 rounded-2xl px-4 h-12 mt-4">
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.8)" />
          <TextInput
            className="flex-1 text-white text-sm ml-2"
            placeholder="Search courses, instructors..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={localSearch}
            onChangeText={setLocalSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category filter chips */}
      <View className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700" style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? "#6366f1" : "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? "#ffffff" : "#64748b",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {displayedCourses.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No courses found"
          description={
            searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : activeCategory !== "All"
              ? `No ${activeCategory} courses right now.`
              : "No courses available right now. Pull to refresh."
          }
          actionLabel={searchQuery ? "Clear search" : activeCategory !== "All" ? "Show all" : "Refresh"}
          onAction={
            searchQuery
              ? handleClearSearch
              : activeCategory !== "All"
              ? () => setActiveCategory("All")
              : handleRefresh
          }
        />
      ) : (
        <LegendList
          data={displayedCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
          estimatedItemSize={340}
          recycleItems
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
