import { Platform, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "@/components/AppIcon";
import { useTheme } from "@/hooks/useTheme";

function IOSLiquidGlassTabs() {
  const { colors, isDark } = useTheme();

  const inactiveColor = isDark
    ? "rgba(255, 255, 255, 0.72)"
    : "rgba(71, 85, 105, 0.65)";

  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={{
        default: inactiveColor,
        selected: colors.accent,
      }}
      labelStyle={{
        default: { color: inactiveColor },
        selected: { color: colors.accent },
      }}
      backgroundColor={
        isDark ? "rgba(15, 23, 42, 0.22)" : "rgba(255, 255, 255, 0.12)"
      }
      blurEffect={
        isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"
      }
      minimizeBehavior="never"
      sidebarAdaptable={false}
      unstable_nativeProps={{
        colorScheme: isDark ? "dark" : "light",
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "heart.text.clipboard",
            selected: "heart.text.clipboard.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Sức khỏe</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="timeline">
        <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" />
        <NativeTabs.Trigger.Label>Timeline</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="patients">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.2",
            selected: "person.2.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Bệnh nhân</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "doc.text",
            selected: "doc.text.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Tài liệu</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "ellipsis.circle",
            selected: "ellipsis.circle.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Thêm</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function FallbackTabs() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const inactiveColor = isDark
    ? "rgba(255, 255, 255, 0.72)"
    : "rgba(100, 116, 139, 0.85)";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: inactiveColor,
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
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.65)"
            : "rgba(255, 255, 255, 0.65)",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(255, 255, 255, 0.65)",
          shadowColor: "#0F172A",
          shadowOpacity: 0.15,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={55}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(15, 23, 42, 0.25)"
                    : "rgba(255, 255, 255, 0.20)",
                },
              ]}
            />
          </BlurView>
        ),
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
          headerShown: false,
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

export default function TabLayout() {
  return Platform.OS === "ios" ? <IOSLiquidGlassTabs /> : <FallbackTabs />;
}
