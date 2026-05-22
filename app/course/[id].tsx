import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { CachedImage } from "../../components/CachedImage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCourseStore } from "../../store/courseStore";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { LoadingState } from "../../components/LoadingState";
import { RetryView } from "../../components/RetryView";
import { Course } from "../../types";
import { COLORS } from "../../constants";

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View className="flex-row items-center py-3.5 border-b border-slate-50 dark:border-slate-700">
      <View className="w-9 h-9 rounded-xl bg-primary-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <Text className="text-slate-600 dark:text-slate-300 text-sm flex-1">{label}</Text>
      <Text className="text-slate-900 dark:text-slate-100 text-sm font-semibold">{value}</Text>
    </View>
  );
}


export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const isLoading = useCourseStore((s) => s.isLoading);
  const error = useCourseStore((s) => s.error);
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked);
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const isEnrolled = useBookmarkStore((s) => s.isEnrolled);
  const enrollCourse = useBookmarkStore((s) => s.enrollCourse);
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseById(id).then((c) => setCourse(c));
    }
  }, [id, fetchCourseById]);

  const handleBookmark = useCallback(async () => {
    if (!id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleBookmark(id);
  }, [id, toggleBookmark]);

  const handleEnroll = useCallback(async () => {
    if (!id) return;
    setIsEnrolling(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await enrollCourse(id);
    setIsEnrolling(false);
    Alert.alert("Enrolled!", `You've been enrolled in "${course?.title}". Start learning now!`);
  }, [id, course, enrollCourse]);

  const handleShare = useCallback(async () => {
    if (!course) return;
    await Share.share({
      message: `Check out this course: ${course.title} — Learn from ${course.instructor.name}`,
      title: course.title,
    });
  }, [course]);

  const handleViewContent = useCallback(() => {
    if (!course) return;
    router.push({
      pathname: "/course/webview",
      params: {
        id: course.id,
        title: course.title,
        instructorName: course.instructor.name,
        instructorAvatar: course.instructor.avatar,
        category: course.category,
        level: course.level ?? "Beginner",
        duration: course.duration ?? "N/A",
        price: course.price.toFixed(2),
        rating: course.rating.toFixed(1),
        thumbnail: course.thumbnail,
        description: course.description,
      },
    });
  }, [course]);

  if (isLoading && !course) {
    return <LoadingState message="Loading course details..." />;
  }

  if (error && !course) {
    return (
      <RetryView
        message={error}
        onRetry={() => fetchCourseById(id ?? "")}
        isLoading={isLoading}
      />
    );
  }

  if (!course) return null;

  const bookmarked = isBookmarked(course.id);
  const enrolled = isEnrolled(course.id);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Immersive hero */}
        <View style={{ height: 320 }}>
          <CachedImage
            source={{ uri: course.thumbnail }}
            style={{ width: "100%", height: 320 }}
            contentFit="cover"
          />
          {/* Deep gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.65)"]}
            style={{ position: "absolute", inset: 0 }}
          />

          {/* Top action bar */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center px-4"
            style={{ paddingTop: Platform.OS === "ios" ? 56 : 48 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-auto"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              hitSlop={8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              hitSlop={8}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </Pressable>
            <Pressable
              onPress={handleBookmark}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: bookmarked ? "rgba(99,102,241,0.85)" : "rgba(0,0,0,0.35)" }}
              hitSlop={8}
            >
              <Ionicons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color="white"
              />
            </Pressable>
          </View>

          {/* Hero bottom content */}
          <View className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <View className="flex-row items-center mb-2">
              <View className="bg-white/20 border border-white/40 px-3 py-1 rounded-full mr-2">
                <Text className="text-white text-xs font-semibold">{course.category}</Text>
              </View>
              {course.level && (
                <View className="bg-white/20 border border-white/40 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">{course.level}</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-bold leading-snug" numberOfLines={2}>
              {course.title}
            </Text>

            {/* Quick stats bar */}
            <View className="flex-row items-center mt-3 gap-4">
              <View className="flex-row items-center">
                <Ionicons name="star" size={13} color="#fbbf24" />
                <Text className="text-white text-xs font-semibold ml-1">
                  {course.rating.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 text-xs ml-1">
                  {(course.enrolledCount ?? 0).toLocaleString()}
                </Text>
              </View>
              {course.duration && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/80 text-xs ml-1">{course.duration}</Text>
                </View>
              )}
              <View className="ml-auto">
                <Text className="text-white text-lg font-bold">${course.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructor card */}
        <View className="bg-white dark:bg-slate-800 mx-4 -mt-1 rounded-3xl px-5 py-4 flex-row items-center"
          style={{ elevation: 6, shadowColor: "#6366f1", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
        >
          <CachedImage
            source={{ uri: course.instructor.avatar }}
            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-sm">{course.instructor.name}</Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{course.instructor.location}</Text>
          </View>
          <View className="bg-primary-50 px-3 py-1.5 rounded-full">
            <Text className="text-primary-600 text-xs font-semibold">Instructor</Text>
          </View>
        </View>

        {/* About */}
        <View className="bg-white mt-3 mx-4 rounded-3xl px-5 py-5"
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          <Text className="text-slate-900 dark:text-slate-100 text-base font-bold mb-3">About this course</Text>
          <Text className="text-slate-600 dark:text-slate-300 text-sm leading-6">{course.description}</Text>
        </View>

        {/* Course info */}
        <View className="bg-white mt-3 mx-4 rounded-3xl px-5 py-5 mb-4"
          style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        >
          <Text className="text-slate-900 dark:text-slate-100 text-base font-bold mb-2">Course Info</Text>
          <InfoRow icon="layers-outline" label="Level" value={course.level ?? "Beginner"} />
          <InfoRow icon="time-outline" label="Duration" value={course.duration ?? "N/A"} />
          <InfoRow icon="star-outline" label="Rating" value={`${course.rating.toFixed(1)} / 5.0`} />
          <InfoRow
            icon="people-outline"
            label="Enrolled Students"
            value={(course.enrolledCount ?? 0).toLocaleString()}
          />
          <InfoRow icon="globe-outline" label="Instructor Location" value={course.instructor.location} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="bg-white dark:bg-slate-900 px-5 border-t border-slate-100 dark:border-slate-700"
        style={{
          paddingTop: 12,
          paddingBottom: Platform.OS === "ios" ? 32 : 16,
          elevation: 12,
          shadowColor: "#6366f1",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleViewContent}
            className="flex-1 border-2 border-primary-500 py-3.5 rounded-2xl items-center flex-row justify-center"
            activeOpacity={0.8}
            accessibilityLabel="Preview course content"
            accessibilityRole="button"
          >
            <Ionicons name="play-circle-outline" size={18} color={COLORS.primary} />
            <Text className="text-primary-500 font-bold ml-2">Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEnroll}
            disabled={enrolled || isEnrolling}
            activeOpacity={0.85}
            className="flex-1 rounded-2xl overflow-hidden"
            accessibilityLabel={enrolled ? "Already enrolled" : "Enroll in this course"}
            accessibilityRole="button"
            accessibilityState={{ disabled: enrolled || isEnrolling }}
          >
            <LinearGradient
              colors={
                enrolled
                  ? ["#22c55e", "#16a34a"]
                  : isEnrolling
                  ? ["#a5b4fc", "#a5b4fc"]
                  : ["#6366f1", "#8B5CF6"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3.5 items-center flex-row justify-center"
            >
              <Ionicons
                name={enrolled ? "checkmark-circle" : "add-circle-outline"}
                size={18}
                color="white"
              />
              <Text className="text-white font-bold ml-2">
                {enrolled ? "Enrolled" : isEnrolling ? "Enrolling..." : "Enroll Now"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
