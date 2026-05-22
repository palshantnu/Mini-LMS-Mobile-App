import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;
  const wasConnected = useRef(true);

  useEffect(() => {
    if (!isConnected) {
      wasConnected.current = false;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (!wasConnected.current) {
      wasConnected.current = true;
      Animated.spring(translateY, {
        toValue: -60,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [isConnected, translateY]);

  if (isConnected && wasConnected.current) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY }], position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <View
        className="flex-row items-center justify-center px-4 py-3"
        style={{
          backgroundColor: isConnected ? "#22c55e" : "#ef4444",
        }}
      >
        <Ionicons
          name={isConnected ? "wifi" : "wifi-outline"}
          size={15}
          color="white"
          style={{ marginRight: 6 }}
        />
        <Text className="text-white text-sm font-semibold">
          {isConnected ? "Back online" : "No internet connection"}
        </Text>
      </View>
    </Animated.View>
  );
}
