import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";
import { COLORS } from "../constants";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = "Loading...", fullScreen = true }: LoadingStateProps) {
  return (
    <View className={`items-center justify-center ${fullScreen ? "flex-1 bg-surface" : "py-8"}`}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="text-text-secondary text-sm mt-3 font-medium">{message}</Text>
    </View>
  );
}

function ShimmerBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: "#e2e8f0", opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      className="bg-white rounded-3xl mb-4 overflow-hidden"
      style={{ elevation: 3, shadowColor: "#6366f1", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }}
    >
      <ShimmerBox width="100%" height={180} borderRadius={0} />
      <View className="px-4 pt-4 pb-5">
        <ShimmerBox width={90} height={22} borderRadius={12} style={{ marginBottom: 10 }} />
        <ShimmerBox width="90%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
        <ShimmerBox width="65%" height={16} borderRadius={6} style={{ marginBottom: 14 }} />
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <ShimmerBox width={22} height={22} borderRadius={11} style={{ marginRight: 8 }} />
          <ShimmerBox width={120} height={12} borderRadius={6} />
        </View>
        <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <ShimmerBox width={80} height={12} borderRadius={6} />
          <ShimmerBox width={100} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function CourseListSkeleton() {
  return (
    <View className="px-5 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
