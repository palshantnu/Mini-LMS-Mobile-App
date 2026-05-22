import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "book-outline",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <LinearGradient
        colors={["#6366f1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 88, height: 88, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
      >
        <Ionicons name={icon} size={40} color="white" />
      </LinearGradient>
      <Text className="text-slate-900 dark:text-slate-100 text-xl font-bold text-center">{title}</Text>
      {description && (
        <Text className="text-slate-600 dark:text-slate-300 text-sm mt-2 text-center leading-5 max-w-xs">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.85} className="mt-7 rounded-2xl overflow-hidden">
          <LinearGradient
            colors={["#6366f1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 32, paddingVertical: 13 }}
          >
            <Text className="text-white font-bold text-sm">{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}
