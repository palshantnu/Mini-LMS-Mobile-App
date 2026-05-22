import { Redirect, Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { OfflineBanner } from "../../components/OfflineBanner";

type TabConfig = {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
};

const TAB_ICONS: Record<string, TabConfig> = {
  book: { active: "book", inactive: "book-outline" },
  bookmark: { active: "bookmark", inactive: "bookmark-outline" },
  person: { active: "person", inactive: "person-outline" },
};

function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: keyof typeof TAB_ICONS;
  focused: boolean;
  color: string;
  size: number;
}) {
  const config = TAB_ICONS[name] ?? TAB_ICONS["book"];
  return (
    <View className="items-center justify-center">
      {focused && (
        <View
          style={{
            position: "absolute",
            top: -10,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#6366f1",
          }}
        />
      )}
      <Ionicons name={focused ? config.active : config.inactive} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1">
      <OfflineBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#6366f1",
          tabBarInactiveTintColor: "#94a3b8",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            height: Platform.OS === "ios" ? 88 : 64,
            paddingBottom: Platform.OS === "ios" ? 28 : 8,
            paddingTop: 10,
            elevation: 12,
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Courses",
            tabBarIcon: (props) => <TabIcon name="book" {...props} />,
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "Bookmarks",
            tabBarIcon: (props) => <TabIcon name="bookmark" {...props} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: (props) => <TabIcon name="person" {...props} />,
          }}
        />
      </Tabs>
    </View>
  );
}
