import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";
import { getMetricHistory } from "@/database/repositories/metricRepository";
import type { MetricPoint } from "@/types/health";
import { formatDateTime, formatMetricValue } from "@/utils/format";
export default function TrendScreen() {
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
  const width = Math.min(Dimensions.get("window").width - 36, 430);
  if (!latest)
    return (
      <View style={styles.container}>
        <EmptyState
          title="Chưa có dữ liệu"
          text="Cần ít nhất một lần đo để hiển thị xu hướng."
        />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.overline}>TREND</Text>
      <Text style={styles.metric}>{latest.metric_name}</Text>
      <View style={styles.latest}>
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
      </View>
      <View style={styles.chart}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Biến động theo thời gian</Text>
          <Text style={styles.count}>{data.length} lần đo</Text>
        </View>
        <TrendChart data={data} width={width - 32} />
      </View>
      <Text style={styles.heading}>Lịch sử</Text>
      {[...data].reverse().map((x) => (
        <Pressable
          key={`${x.source}-${x.id}`}
          style={styles.row}
          onPress={() =>
            router.push({
              pathname: "/records/[source]/[id]",
              params: { source: x.source, id: x.id },
            })
          }
        >
          <View>
            <Text style={styles.date}>{formatDateTime(x.measured_at)}</Text>
            {x.notes && (
              <Text style={styles.notes} numberOfLines={1}>
                {x.notes}
              </Text>
            )}
          </View>
          <View style={styles.historyRight}>
            <Text style={styles.value}>
              {formatMetricValue(x.value, x.value2)} {x.unit}
            </Text>
            <Text style={styles.edit}>Sửa ›</Text>
          </View>
        </Pressable>
      ))}
      <Text style={styles.notice}>
        Biểu đồ chỉ thể hiện xu hướng của dữ liệu đã nhập và không thay thế đánh
        giá hoặc chẩn đoán của nhân viên y tế.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
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
    backgroundColor: "#0F172A",
    padding: 21,
    borderRadius: 24,
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
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  chartHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartTitle: { fontSize: 13, fontWeight: "900", color: "#334155" },
  count: { fontSize: 10, color: "#94A3B8", fontWeight: "800" },
  heading: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  row: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  date: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  notes: { color: "#94A3B8", fontSize: 10, marginTop: 3, maxWidth: 190 },
  historyRight: { alignItems: "flex-end" },
  value: { fontWeight: "900", color: "#0F172A" },
  edit: { fontSize: 10, color: "#2563EB", fontWeight: "900", marginTop: 3 },
  notice: {
    fontSize: 10,
    color: "#94A3B8",
    lineHeight: 16,
    marginTop: 8,
    textAlign: "center",
  },
});
