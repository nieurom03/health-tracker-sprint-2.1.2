import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import { getMetricHistory } from "@/database/repositories/metricRepository";
import type { MetricPoint } from "@/types/health";
import { formatDateTime, formatMetricValue } from "@/utils/format";

export default function TrendScreen() {
  const styles = useThemedStyles(baseStyles);
  const { metric, patientId } = useLocalSearchParams<{
    metric: string;
    patientId: string;
  }>();
  const db = useSQLiteContext();
  const [data, setData] = useState<MetricPoint[]>([]);

  const load = useCallback(async () => {
    if (metric && patientId)
      setData(await getMetricHistory(db, Number(patientId), metric));
  }, [db, metric, patientId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const latest = data.at(-1);
  const previous = data.length > 1 ? data.at(-2) : undefined;
  const delta = useMemo(
    () => (latest && previous ? latest.value - previous.value : null),
    [latest, previous],
  );
  const percent = useMemo(
    () =>
      delta != null && previous?.value ? (delta / previous.value) * 100 : null,
    [delta, previous],
  );
  const reference = useMemo(() => {
    const source = [...data]
      .reverse()
      .find(
        (item) => item.reference_min != null || item.reference_max != null,
      );
    return {
      min: source?.reference_min ?? null,
      max: source?.reference_max ?? null,
    };
  }, [data]);
  const hasReference = reference.min != null || reference.max != null;
  const isOutsideReference = useCallback(
    (value: number) =>
      (reference.min != null && value < reference.min) ||
      (reference.max != null && value > reference.max),
    [reference.max, reference.min],
  );
  const width = Math.min(Dimensions.get("window").width - 36, 430);

  if (!latest)
    return (
      <View style={styles.container}>
        <AmbientBackground />
        <EmptyState
          title="Chưa có dữ liệu"
          text="Cần ít nhất một lần đo để hiển thị xu hướng."
        />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AmbientBackground />
      <Text style={styles.overline}>TREND</Text>
      <Text style={styles.metric}>{latest.metric_name}</Text>

      <GlassCard variant="darkHero" style={styles.latest} borderRadius={24}>
        <View>
          <Text style={styles.latestLabel}>MỚI NHẤT</Text>
          <View style={styles.latestRow}>
            <Text style={styles.big}>
              {formatMetricValue(latest.value, latest.value2)}
            </Text>
            <Text style={styles.unit}>{latest.unit}</Text>
          </View>
        </View>
        {delta != null && (
          <View style={styles.deltaBox}>
            <Text
              style={[
                styles.delta,
                {
                  color:
                    delta > 0 ? "#F59E0B" : delta < 0 ? "#34D399" : "#CBD5E1",
                },
              ]}
            >
              {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}{" "}
              {Math.abs(delta).toFixed(2)}
            </Text>
            {percent != null && (
              <Text style={styles.percent}>
                {Math.abs(percent).toFixed(1)}%
              </Text>
            )}
          </View>
        )}
      </GlassCard>

      <GlassCard style={styles.chart} borderRadius={20}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Lịch sử theo ngày</Text>
            <Text style={styles.chartSubtitle}>Mỗi cột là một kết quả</Text>
          </View>
          <Text style={styles.count}>{data.length} lần đo</Text>
        </View>
        {hasReference ? (
          <View style={styles.referenceCard}>
            <View style={styles.referenceTitleRow}>
              <View style={styles.referenceSwatch} />
              <Text style={styles.referenceTitle}>Vùng tham chiếu cố định</Text>
            </View>
            <View style={styles.referenceValues}>
              <View style={styles.referenceValueBox}>
                <Text style={styles.referenceLabel}>TỪ</Text>
                <Text style={styles.referenceValue}>
                  {reference.min ?? "—"} {latest.unit}
                </Text>
              </View>
              <View style={styles.referenceDivider} />
              <View style={styles.referenceValueBox}>
                <Text style={styles.referenceLabel}>ĐẾN</Text>
                <Text style={styles.referenceValue}>
                  {reference.max ?? "—"} {latest.unit}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noReference}>
            Chỉ số này chưa có khoảng tham chiếu được lưu.
          </Text>
        )}
        <TrendChart
          data={data}
          width={width - 32}
          referenceMin={reference.min}
          referenceMax={reference.max}
        />
        <View style={styles.legend}>
          {hasReference ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendGreen]} />
                <Text style={styles.legendText}>Trong vùng</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendRed]} />
                <Text style={styles.legendText}>Ngoài vùng</Text>
              </View>
            </>
          ) : (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendBlue]} />
              <Text style={styles.legendText}>Kết quả theo ngày</Text>
            </View>
          )}
        </View>
      </GlassCard>

      <Text style={styles.heading}>Lịch sử</Text>
      {[...data].reverse().map((x) => {
        const outside = hasReference && isOutsideReference(x.value);
        return (
          <GlassCard
            key={`${x.source}-${x.id}`}
            style={styles.row}
            borderRadius={14}
            onPress={() =>
              router.push({
                pathname: "/records/[source]/[id]",
                params: { source: x.source, id: x.id },
              })
            }
          >
            <View>
              <View style={styles.historyDateRow}>
                <View
                  style={[
                    styles.historyDot,
                    hasReference
                      ? outside
                        ? styles.historyDotOutside
                        : styles.historyDotInside
                      : styles.historyDotUnknown,
                  ]}
                />
                <Text style={styles.date}>{formatDateTime(x.measured_at)}</Text>
              </View>
              {x.notes && (
                <Text style={styles.notes} numberOfLines={1}>
                  {x.notes}
                </Text>
              )}
            </View>
            <View style={styles.historyRight}>
              <Text style={[styles.value, outside && styles.valueOutside]}>
                {formatMetricValue(x.value, x.value2)} {x.unit}
              </Text>
              {hasReference && (
                <Text style={outside ? styles.outsideText : styles.insideText}>
                  {outside ? "Ngoài khoảng" : "Trong khoảng"}
                </Text>
              )}
              <Text style={styles.edit}>Sửa ›</Text>
            </View>
          </GlassCard>
        );
      })}

      <Text style={styles.notice}>
        Biểu đồ chỉ thể hiện xu hướng của dữ liệu đã nhập và không thay thế đánh
        giá hoặc chẩn đoán của nhân viên y tế.
      </Text>
    </ScrollView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 44,
    gap: 12,
    backgroundColor: "#F8FAFC",
    minHeight: "100%",
  },
  overline: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: "#64748B",
  },
  metric: { fontSize: 25, fontWeight: "900", color: "#0F172A", marginTop: -6 },
  latest: {
    padding: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  latestLabel: {
    fontSize: 9,
    color: "#93C5FD",
    fontWeight: "900",
    letterSpacing: 1,
  },
  latestRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
    marginTop: 4,
  },
  big: { fontSize: 36, fontWeight: "900", color: "#fff" },
  unit: { color: "#CBD5E1", fontWeight: "800" },
  deltaBox: { alignItems: "flex-end" },
  delta: { fontWeight: "900", fontSize: 14 },
  percent: { color: "#94A3B8", fontSize: 11, fontWeight: "800", marginTop: 3 },
  chart: {
    padding: 16,
    alignItems: "center",
  },
  chartHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartTitle: { fontSize: 13, fontWeight: "900", color: "#334155" },
  chartSubtitle: { fontSize: 9, color: "#94A3B8", marginTop: 2 },
  count: { fontSize: 10, color: "#94A3B8", fontWeight: "800" },
  referenceCard: {
    width: "100%",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 11,
    gap: 8,
    marginTop: 2,
  },
  referenceTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  referenceSwatch: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    opacity: 0.45,
  },
  referenceTitle: { color: "#166534", fontSize: 10, fontWeight: "900" },
  referenceValues: { flexDirection: "row", alignItems: "center" },
  referenceValueBox: { flex: 1 },
  referenceDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#BBF7D0",
    marginHorizontal: 12,
  },
  referenceLabel: {
    color: "#16A34A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  referenceValue: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  noReference: {
    width: "100%",
    color: "#64748B",
    fontSize: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: -5,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendGreen: { backgroundColor: "#16A34A" },
  legendRed: { backgroundColor: "#EF4444" },
  legendBlue: { backgroundColor: "#2563EB" },
  legendText: { color: "#64748B", fontSize: 9, fontWeight: "800" },
  heading: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  row: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  historyDateRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyDotInside: { backgroundColor: "#16A34A" },
  historyDotOutside: { backgroundColor: "#EF4444" },
  historyDotUnknown: { backgroundColor: "#2563EB" },
  notes: { color: "#94A3B8", fontSize: 10, marginTop: 3, maxWidth: 190 },
  historyRight: { alignItems: "flex-end" },
  value: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  valueOutside: { color: "#DC2626" },
  insideText: {
    color: "#16A34A",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
  },
  outsideText: {
    color: "#DC2626",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
  },
  edit: { color: "#2563EB", fontWeight: "800", fontSize: 11, marginTop: 4 },
  notice: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
  },
});
