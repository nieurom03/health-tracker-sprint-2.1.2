import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

export type ThemeColors = {
  accent: string;
  inactive: string;
  tabBg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textSubtle: string;
};

const DARK_COLOR_MAP: Record<string, string> = {
  "#f8fafc": "#0B1120",
  "#f6f8fb": "#0B1120",
  "#ffffff": "#1E293B",
  "#fff": "#1E293B",
  white: "#1E293B",
  "#e2e8f0": "#334155",
  "#d0d5dd": "#475569",
  "#dce3ec": "#334155",
  "#e7eaf0": "#334155",
  "#eff6ff": "#172554",
  "#dbeafe": "#1E3A8A",
  "#bfdbfe": "#1E40AF",
  "#fef2f2": "#450A0A",
  "#fff7f7": "#450A0A",
  "#fee2e2": "#7F1D1D",
  "#fecaca": "#991B1B",
  "#fff7ed": "#431407",
  "#fed7aa": "#7C2D12",
  "#fef3c7": "#422006",
  "#fffbeb": "#422006",
  "#fde68a": "#854D0E",
  "#dcfce7": "#052E16",
  "#d1fae5": "#064E3B",
  "#ecfdf5": "#052E16",
  "#a7f3d0": "#047857",
  "rgba(255, 255, 255, 0.85)": "rgba(30, 41, 59, 0.85)",
  "rgba(255, 255, 255, 0.72)": "rgba(30, 41, 59, 0.78)",
  "rgba(255, 255, 255, 0.7)": "rgba(30, 41, 59, 0.78)",
  "rgba(255, 255, 255, 0.70)": "rgba(30, 41, 59, 0.78)",
  "rgba(255, 255, 255, 0.65)": "rgba(30, 41, 59, 0.72)",
  "rgba(241, 245, 249, 0.85)": "rgba(30, 41, 59, 0.85)",
  "rgba(239, 246, 255, 0.9)": "rgba(30, 58, 138, 0.55)",
  "rgba(239, 246, 255, 0.85)": "rgba(30, 58, 138, 0.55)",
  "rgba(236, 253, 245, 0.9)": "rgba(6, 78, 59, 0.55)",
  "rgba(209, 250, 229, 0.9)": "rgba(6, 78, 59, 0.55)",
  "rgba(254, 242, 242, 0.9)": "rgba(127, 29, 29, 0.50)",
  "rgba(226, 232, 240, 0.7)": "rgba(71, 85, 105, 0.70)",
  "rgba(191, 219, 254, 0.7)": "rgba(96, 165, 250, 0.35)",
  "rgba(191, 219, 254, 0.70)": "rgba(96, 165, 250, 0.35)",
  "rgba(191, 219, 254, 0.6)": "rgba(96, 165, 250, 0.30)",
  "rgba(167, 243, 208, 0.7)": "rgba(52, 211, 153, 0.30)",
  "rgba(167, 243, 208, 0.6)": "rgba(52, 211, 153, 0.28)",
  "rgba(254, 202, 202, 0.6)": "rgba(248, 113, 113, 0.30)",
  "rgba(203, 213, 225, 0.8)": "rgba(148, 163, 184, 0.35)",
};

const DARK_TEXT_MAP: Record<string, string> = {
  "#0f172a": "#F8FAFC",
  "#172033": "#F8FAFC",
  "#334155": "#E2E8F0",
  "#344054": "#E2E8F0",
  "#475467": "#CBD5E1",
  "#475569": "#CBD5E1",
  "#64748b": "#94A3B8",
  "#667085": "#94A3B8",
  "#98a2b3": "#94A3B8",
  "#dc2626": "#F87171",
  "#d92d20": "#F87171",
  "#b91c1c": "#FCA5A5",
  "#b45309": "#FBBF24",
  "#a16207": "#FBBF24",
  "#92400e": "#FCD34D",
  "#047857": "#34D399",
  "#15803d": "#34D399",
  "#1d4ed8": "#60A5FA",
  "#1e40af": "#93C5FD",
  "#0369a1": "#38BDF8",
};

type StyleMap = Record<string, object>;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const colors: ThemeColors = {
    accent: "#2563EB",
    inactive: isDark ? "rgba(255, 255, 255, 0.72)" : "rgba(71, 85, 105, 0.65)",
    tabBg: isDark ? "rgba(15, 23, 42, 0.22)" : "rgba(255, 255, 255, 0.12)",
    cardBg: isDark ? "rgba(30, 41, 59, 0.68)" : "rgba(255, 255, 255, 0.70)",
    cardBorder: isDark
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(255, 255, 255, 0.82)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    background: isDark ? "#0B1120" : "#F8FAFC",
    surface: isDark ? "#1E293B" : "#FFFFFF",
    surfaceMuted: isDark ? "#334155" : "#E2E8F0",
    border: isDark ? "#334155" : "#E2E8F0",
    textSubtle: isDark ? "#CBD5E1" : "#475569",
  };

  const blurEffect = isDark
    ? ("systemUltraThinMaterialDark" as const)
    : ("systemUltraThinMaterialLight" as const);

  return {
    isDark,
    colorScheme: isDark ? ("dark" as const) : ("light" as const),
    colors,
    blurEffect,
  };
}

function darkColorFor(property: string, value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.toLowerCase();

  if (property === "color") {
    return DARK_TEXT_MAP[normalized] ?? value;
  }
  if (
    property === "backgroundColor" ||
    property === "borderColor" ||
    property === "borderTopColor" ||
    property === "borderBottomColor"
  ) {
    return DARK_COLOR_MAP[normalized] ?? value;
  }
  return value;
}

/**
 * Applies the shared dark palette to legacy StyleSheets while keeping their
 * light appearance unchanged. This lets every existing screen react to the
 * system color scheme without duplicating a second StyleSheet.
 */
export function useThemedStyles<T extends StyleMap>(styleSheet: T): T {
  const isDark = useColorScheme() === "dark";

  return useMemo(() => {
    if (!isDark) return styleSheet;

    const themed = Object.fromEntries(
      Object.entries(styleSheet).map(([name, style]) => {
        const flattened = StyleSheet.flatten(style) ?? {};
        return [
          name,
          Object.fromEntries(
            Object.entries(flattened).map(([property, value]) => [
              property,
              darkColorFor(property, value),
            ]),
          ),
        ];
      }),
    );

    return StyleSheet.create(themed) as T;
  }, [isDark, styleSheet]);
}
