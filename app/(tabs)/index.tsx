import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import MetricCard from "@/components/MetricCard";
import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import {
  getPatient,
  getSelectedPatientId,
} from "@/database/repositories/patientRepository";
import {
  getLatestMetrics,
  seedDemoData,
} from "@/database/repositories/metricRepository";
import type { MetricPoint, Patient } from "@/types/health";
import AppIcon from "@/components/AppIcon";

export default function DashboardScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);

  const load = useCallback(async () => {
    const id = await getSelectedPatientId(db);
    if (!id) {
      setPatient(null);
      setMetrics([]);
      return;
    }
    setPatient(await getPatient(db, id));
    setMetrics(await getLatestMetrics(db, id));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function demo() {
    if (!patient) return;
    const ok = await seedDemoData(db, patient.id);
    if (!ok)
      return Alert.alert(
        "Đã có dữ liệu",
        "Dữ liệu demo chỉ được thêm khi hồ sơ chưa có lịch sử.",
      );
    await load();
  }

  if (!patient)
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AmbientBackground />
        <View style={styles.center}>
          <EmptyState
            title="Chưa có bệnh nhân"
            text="Tạo hồ sơ đầu tiên để bắt đầu theo dõi sức khỏe."
          />
          <Pressable
            style={styles.primary}
            onPress={() => router.push("/patients/new")}
          >
            <Text style={styles.primaryText}>+ Thêm bệnh nhân</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 130 }]}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Health Tracker</Text>
            <Text style={styles.sub}>Dữ liệu lưu trên thiết bị</Text>
          </View>
          <View style={styles.localBadge}>
            <Text style={styles.localText}>LOCAL</Text>
          </View>
        </View>

        <GlassCard variant="darkHero" style={styles.hero} borderRadius={26}>
          <Text style={styles.eyebrow}>ĐANG THEO DÕI</Text>
          <Text style={styles.patientName}>{patient.name}</Text>
          <View style={styles.heroBottom}>
            <Text style={styles.heroHint}>
              {metrics.length} chỉ số gần nhất
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/patients")}>
              <Text style={styles.change}>Đổi bệnh nhân ›</Text>
            </Pressable>
          </View>
        </GlassCard>

        <View style={styles.quickRow}>
          <Pressable
            style={styles.quickPrimary}
            onPress={() =>
              router.push({
                pathname: "/records/new",
                params: { patientId: patient.id },
              })
            }
          >
            <AppIcon ios="plus" android="add" size={19} color="#FFFFFF" />
            <Text style={styles.quickPrimaryText}>Thêm chỉ số</Text>
          </Pressable>
          <GlassCard
            style={styles.quick}
            borderRadius={17}
            onPress={() => router.push("/(tabs)/timeline")}
          >
            <AppIcon
              ios="clock.arrow.circlepath"
              android="history"
              size={18}
              color="#334155"
            />
            <Text style={styles.quickText}>Timeline</Text>
          </GlassCard>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.heading}>Tổng quan</Text>
            <Text style={styles.headingSub}>Chỉ số mới nhất của bệnh nhân</Text>
          </View>
        </View>

        {metrics.length === 0 ? (
          <GlassCard style={styles.emptyBox} borderRadius={20}>
            <EmptyState
              title="Chưa có dữ liệu"
              text="Nhập chỉ số đầu tiên hoặc tạo bộ dữ liệu demo để xem Dashboard và Trend."
            />
            <Pressable style={styles.demo} onPress={demo}>
              <Text style={styles.demoText}>Tạo dữ liệu demo</Text>
            </Pressable>
          </GlassCard>
        ) : (
          <View style={styles.grid}>
            {metrics.map((item) => (
              <MetricCard
                key={`${item.source}-${item.metric_key}`}
                item={item}
                onPress={() =>
                  router.push({
                    pathname: "/trends/[metric]",
                    params: { metric: item.metric_key, patientId: patient.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 18,
    minHeight: "100%",
  },
  center: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 23, fontWeight: "900", color: "#0F172A" },
  sub: { fontSize: 11, color: "#94A3B8", marginTop: 2, fontWeight: "700" },
  localBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "rgba(236, 253, 245, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.7)",
  },
  localText: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  hero: {
    padding: 22,
    gap: 5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#93C5FD",
  },
  patientName: { fontSize: 29, fontWeight: "900", color: "#fff" },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  heroHint: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  change: { color: "#BFDBFE", fontWeight: "900", fontSize: 12 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickPrimary: {
    flex: 1.4,
    backgroundColor: "#2563EB",
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickPrimaryText: { color: "#fff", fontWeight: "900" },
  quick: {
    flex: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  quickText: { color: "#334155", fontWeight: "900" },
  headingRow: { flexDirection: "row", justifyContent: "space-between" },
  heading: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  headingSub: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  primary: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  emptyBox: {
    padding: 10,
  },
  demo: {
    backgroundColor: "rgba(239, 246, 255, 0.85)",
    margin: 12,
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.7)",
  },
  demoText: { color: "#2563EB", fontWeight: "900" },
});
