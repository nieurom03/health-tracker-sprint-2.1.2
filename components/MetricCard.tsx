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
  const outside =
    (item.reference_min != null && item.value < item.reference_min) ||
    (item.reference_max != null && item.value > item.reference_max);

  return (
    <GlassCard
      style={[styles.card, outside && styles.cardOutside]}
      onPress={onPress}
      borderRadius={20}
    >
      <View style={styles.top}>
        <View style={[styles.icon, outside && styles.iconOutside]}>
          {item.source === "vital" ? (
            <AppIcon
              ios="waveform.path.ecg"
              android="monitoring"
              size={18}
              color={outside ? "#DC2626" : "#2563EB"}
            />
          ) : (
            <Text style={[styles.iconText, outside && styles.iconTextOutside]}>
              {outside ? "!" : def?.icon ?? "LAB"}
            </Text>
          )}
        </View>
        <AppIcon
          ios="chevron.right"
          android="chevron_right"
          size={15}
          color={outside ? "#EF4444" : "#94A3B8"}
        />
      </View>
      <Text style={[styles.name, outside && styles.nameOutside]} numberOfLines={1}>
        {item.metric_name}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.value, outside && styles.valueOutside]}>
          {formatMetricValue(item.value, item.value2)}
        </Text>
        <Text style={[styles.unit, outside && styles.unitOutside]}>{item.unit}</Text>
      </View>
      {outside && <Text style={styles.outsideLabel}>NGOÀI KHOẢNG</Text>}
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
  cardOutside: {
    borderColor: "rgba(248, 113, 113, 0.65)",
    backgroundColor: "rgba(254, 242, 242, 0.92)",
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
  iconOutside: {
    backgroundColor: "#FEE2E2",
  },
  iconText: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 12,
  },
  iconTextOutside: { color: "#DC2626" },
  name: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  nameOutside: { color: "#B91C1C" },
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
  valueOutside: { color: "#DC2626" },
  unit: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  unitOutside: { color: "#EF4444" },
  outsideLabel: {
    color: "#DC2626",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
});
