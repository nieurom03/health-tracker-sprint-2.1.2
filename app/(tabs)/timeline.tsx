import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import {
  getPatient,
  getSelectedPatientId,
} from "@/database/repositories/patientRepository";
import { getTimeline } from "@/database/repositories/metricRepository";
import type { MetricPoint, MetricSource, Patient } from "@/types/health";
import { formatDate, formatMetricValue, formatTime } from "@/utils/format";
import AppIcon from "@/components/AppIcon";

type Filter = "all" | MetricSource;

function isOutsideReference(item: MetricPoint) {
  return (
    (item.reference_min != null && item.value < item.reference_min) ||
    (item.reference_max != null && item.value > item.reference_max)
  );
}

export default function TimelineScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<MetricPoint[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const id = await getSelectedPatientId(db);
    if (!id) {
      setPatient(null);
      setItems([]);
      return;
    }
    setPatient(await getPatient(db, id));
    setItems(await getTimeline(db, id, 300, "all"));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((x) => x.source === filter)),
    [items, filter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, MetricPoint[]>();
    for (const x of visible) {
      const d = new Date(x.measured_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), x]);
    }
    return [...map.values()];
  }, [visible]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 130 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>HEALTH HISTORY</Text>
            <Text style={styles.title}>{patient?.name || "Timeline"}</Text>
          </View>
          {patient && (
            <Pressable
              style={styles.addBtn}
              onPress={() =>
                router.push({
                  pathname: "/records/new",
                  params: { patientId: patient.id },
                })
              }
            >
              <AppIcon ios="plus" android="add" size={21} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        <View style={styles.filters}>
          {(
            [
              ["all", "Tất cả"],
              ["vital", "Sinh hiệu"],
              ["lab", "Xét nghiệm"],
            ] as const
          ).map(([k, t]) => (
            <Pressable
              key={k}
              style={[styles.filter, filter === k && styles.filterActive]}
              onPress={() => setFilter(k)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === k && styles.filterTextActive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {!patient ? (
          <EmptyState
            title="Chưa có bệnh nhân"
            text="Tạo và chọn một bệnh nhân trước."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Chưa có lịch sử"
            text="Không có dữ liệu trong nhóm đang chọn."
          />
        ) : (
          groups.map((group, gi) => (
            <View key={gi} style={styles.group}>
              <Text style={styles.dateHeader}>
                {formatDate(group[0].measured_at)}
              </Text>
              {group.map((item) => {
                const outside = isOutsideReference(item);
                return (
                  <GlassCard
                    key={`${item.source}-${item.id}`}
                    style={[styles.row, outside && styles.rowOutside]}
                    borderRadius={17}
                    onPress={() =>
                      router.push({
                        pathname: "/records/[source]/[id]",
                        params: { source: item.source, id: item.id },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.dot,
                        item.source === "lab" && styles.labDot,
                        outside && styles.outsideDot,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dotText,
                          outside && styles.outsideDotText,
                        ]}
                      >
                        {outside ? "!" : item.source === "lab" ? "L" : "V"}
                      </Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, outside && styles.outsideName]}>
                        {item.metric_name}
                      </Text>
                      <Text style={styles.meta}>
                        {formatTime(item.measured_at)}
                        {item.notes ? `  ·  ${item.notes}` : ""}
                      </Text>
                      {outside && (
                        <Text style={styles.outsideLabel}>Ngoài khoảng tham chiếu</Text>
                      )}
                    </View>
                    <View style={styles.right}>
                      <Text style={[styles.value, outside && styles.outsideValue]}>
                        {formatMetricValue(item.value, item.value2)}
                      </Text>
                      <Text style={[styles.unit, outside && styles.outsideUnit]}>
                        {item.unit} ›
                      </Text>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          ))
        )}

        {visible.length > 0 && (
          <Text style={styles.tip}>
            Chạm vào một dòng để sửa hoặc xóa dữ liệu.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: {
    padding: 18,
    paddingBottom: 44,
    gap: 12,
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#64748B",
  },
  title: { fontSize: 25, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  filters: { flexDirection: "row", gap: 8, marginVertical: 4 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  filterActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  filterText: { fontSize: 12, fontWeight: "900", color: "#64748B" },
  filterTextActive: { color: "#fff" },
  group: { gap: 8, marginTop: 4 },
  dateHeader: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    textTransform: "capitalize",
    marginTop: 5,
  },
  row: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  rowOutside: {
    borderColor: "rgba(248, 113, 113, 0.55)",
    backgroundColor: "rgba(254, 242, 242, 0.9)",
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.6)",
  },
  labDot: {
    backgroundColor: "rgba(236, 253, 245, 0.9)",
    borderColor: "rgba(167, 243, 208, 0.6)",
  },
  outsideDot: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  dotText: { fontSize: 11, fontWeight: "900", color: "#2563EB" },
  outsideDotText: { color: "#DC2626" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  outsideName: { color: "#B91C1C" },
  meta: { fontSize: 10, color: "#94A3B8", marginTop: 4, maxWidth: 180 },
  outsideLabel: {
    color: "#DC2626",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
  },
  right: { alignItems: "flex-end" },
  value: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  outsideValue: { color: "#DC2626" },
  unit: { fontSize: 10, color: "#94A3B8", marginTop: 3, fontWeight: "700" },
  outsideUnit: { color: "#EF4444" },
  tip: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 10 },
});
