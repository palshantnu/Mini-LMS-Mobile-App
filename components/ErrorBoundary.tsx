import React, { Component, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center p-8 bg-surface">
          <Ionicons name="warning-outline" size={56} color={COLORS.error} />
          <Text className="text-text-primary text-xl font-bold mt-4 text-center">
            Something went wrong
          </Text>
          <Text className="text-text-secondary text-sm mt-2 text-center">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="mt-6 bg-primary-500 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
