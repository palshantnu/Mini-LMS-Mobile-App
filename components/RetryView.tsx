import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants";

interface RetryViewProps {
  message?: string;
  onRetry: () => void;
  isLoading?: boolean;
}

export function RetryView({
  message = "Something went wrong. Please try again.",
  onRetry,
  isLoading = false,
}: RetryViewProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="cloud-offline-outline" size={56} color={COLORS.textMuted} />
      <Text className="text-slate-900 dark:text-slate-100 text-lg font-semibold mt-4 text-center">
        Oops!
      </Text>
      <Text className="text-slate-600 dark:text-slate-300 text-sm mt-2 text-center leading-5">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        disabled={isLoading}
        className={`mt-6 px-8 py-3 rounded-xl flex-row items-center ${
          isLoading ? "bg-primary-200" : "bg-primary-500"
        }`}
      >
        <Ionicons name="refresh-outline" size={16} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isLoading ? "Retrying..." : "Try again"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
