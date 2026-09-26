import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function AmbientBackground() {
  const { isDark } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.topRightAura,
          {
            backgroundColor: isDark
              ? "rgba(30, 58, 138, 0.25)"
              : "rgba(191, 219, 254, 0.45)",
          },
        ]}
      />
      <View
        style={[
          styles.midLeftAura,
          {
            backgroundColor: isDark
              ? "rgba(6, 78, 59, 0.20)"
              : "rgba(209, 250, 229, 0.40)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRightAura: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  midLeftAura: {
    position: "absolute",
    top: 340,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
});
