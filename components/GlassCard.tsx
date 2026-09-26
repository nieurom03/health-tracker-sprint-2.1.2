import { ReactNode } from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { BlurView, BlurTint } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";

export type GlassVariant = "regular" | "darkHero" | "subtle" | "tinted";

export interface GlassCardProps extends ViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
  intensity?: number;
  borderRadius?: number;
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
}

export default function GlassCard({
  children,
  style,
  variant = "regular",
  intensity,
  borderRadius = 20,
  onPress,
  disabled,
  ...rest
}: GlassCardProps) {
  const { isDark } = useTheme();

  const isDarkVariant =
    variant === "darkHero" || (variant === "regular" && isDark);

  const blurTint: BlurTint =
    variant === "darkHero"
      ? "systemUltraThinMaterialDark"
      : isDark
        ? "systemUltraThinMaterialDark"
        : "systemUltraThinMaterialLight";

  const defaultIntensity =
    intensity !== undefined
      ? intensity
      : variant === "darkHero"
        ? 65
        : isDark
          ? 40
          : 60;

  const variantStyles = getVariantStyle(variant, isDark);

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    { borderRadius },
    variantStyles,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        onPress={onPress}
        disabled={disabled}
        {...rest}
      >
        <BlurView
          intensity={defaultIntensity}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} {...rest}>
      <BlurView
        intensity={defaultIntensity}
        tint={blurTint}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

function getVariantStyle(variant: GlassVariant, isDark: boolean): ViewStyle {
  switch (variant) {
    case "darkHero":
      return {
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        shadowColor: "#000",
        shadowOpacity: 0.25,
      };
    case "subtle":
      return {
        backgroundColor: isDark
          ? "rgba(30, 41, 59, 0.45)"
          : "rgba(255, 255, 255, 0.50)",
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.10)"
          : "rgba(255, 255, 255, 0.70)",
      };
    case "tinted":
      return {
        backgroundColor: isDark
          ? "rgba(30, 58, 138, 0.35)"
          : "rgba(239, 246, 255, 0.75)",
        borderColor: isDark
          ? "rgba(147, 197, 253, 0.25)"
          : "rgba(191, 219, 254, 0.70)",
      };
    case "regular":
    default:
      return {
        backgroundColor: isDark
          ? "rgba(30, 41, 59, 0.68)"
          : "rgba(255, 255, 255, 0.70)",
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.14)"
          : "rgba(255, 255, 255, 0.85)",
      };
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.78,
    transform: Platform.OS === "ios" ? [{ scale: 0.985 }] : undefined,
  },
});
