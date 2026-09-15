import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "@/components/AppIcon";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#34D399",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarHideOnKeyboard: true,
        headerTitleStyle: { fontWeight: "900" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 7 },
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: Math.max(insets.bottom, 12),
          height: 76,
          marginHorizontal: 18,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: 38,
          borderTopWidth: 0,
          backgroundColor: "#737C79",
          shadowColor: "#0F172A",
          shadowOpacity: 0.2,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 7 },
          elevation: 12,
          overflow: Platform.OS === "android" ? "hidden" : "visible",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Sức khỏe",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AppIcon
              ios="heart.text.clipboard.fill"
              android="health_and_safety"
              color={color}
              size={25}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AppIcon
              ios="clock.arrow.circlepath"
              android="history"
              color={color}
              size={25}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Bệnh nhân",
          tabBarIcon: ({ color }) => (
            <AppIcon
              ios="person.2.fill"
              android="groups"
              color={color}
              size={25}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="documents"
        options={{
          title: "Tài liệu",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AppIcon
              ios="doc.text.fill"
              android="description"
              color={color}
              size={25}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Thêm",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AppIcon
              ios="ellipsis.circle.fill"
              android="more_horiz"
              color={color}
              size={25}
            />
          ),
        }}
      />
    </Tabs>
  );
}
