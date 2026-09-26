import { useThemedStyles } from "@/hooks/useTheme";
import { StyleSheet, Text, View } from "react-native";
import type { MetricPoint } from "@/types/health";
import { metricDefinition } from "@/database/repositories/metricRepository";
import { formatMetricValue } from "@/utils/format";
import AppIcon from "@/components/AppIcon";
import GlassCard from "@/components/GlassCard";

export default function MetricCard({
  item,
  onPress,
}: {
  item: MetricPoint;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(baseStyles);
  const def = metricDefinition(item.source, item.metric_key) as any;

  return (
    <GlassCard style={styles.card} onPress={onPress} borderRadius={20}>
      <View style={styles.top}>
        <View style={styles.icon}>
          {item.source === "vital" ? (
            <AppIcon
              ios="waveform.path.ecg"
              android="monitoring"
              size={18}
              color="#2563EB"
            />
          ) : (
            <Text style={styles.iconText}>{def?.icon ?? "LAB"}</Text>
          )}
        </View>
        <AppIcon
          ios="chevron.right"
          android="chevron_right"
          size={15}
          color="#94A3B8"
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.metric_name}
      </Text>
      <View style={styles.row}>
        <Text style={styles.value}>
          {formatMetricValue(item.value, item.value2)}
        </Text>
        <Text style={styles.unit}>{item.unit}</Text>
      </View>
      <Text style={styles.date}>
        {new Date(item.measured_at).toLocaleDateString("vi-VN")}
      </Text>
    </GlassCard>
  );
}

const baseStyles = StyleSheet.create({
  card: {
    width: "48%",
    padding: 15,
    gap: 5,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "rgba(239, 246, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 12,
  },
  name: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  value: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  unit: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  date: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
});
