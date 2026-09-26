import { useThemedStyles } from "@/hooks/useTheme";
import { StyleSheet, Text } from "react-native";
import GlassCard from "@/components/GlassCard";

export default function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const styles = useThemedStyles(baseStyles);
  return (
    <GlassCard style={styles.box} borderRadius={18}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </GlassCard>
  );
}

const baseStyles = StyleSheet.create({
  box: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "800",
    fontSize: 16,
    color: "#172033",
  },
  text: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 20,
  },
});
