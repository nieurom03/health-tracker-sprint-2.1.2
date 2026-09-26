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
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import {
  deletePatient,
  getSelectedPatientId,
  listPatients,
  setSelectedPatientId,
} from "@/database/repositories/patientRepository";
import type { Patient } from "@/types/health";
import { formatDate } from "@/utils/format";
import AppIcon from "@/components/AppIcon";

export default function PatientsScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [items, setItems] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    setItems(await listPatients(db));
    setSelected(await getSelectedPatientId(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function choose(id: number) {
    await setSelectedPatientId(db, id);
    setSelected(id);
  }

  function remove(item: Patient) {
    Alert.alert(
      "Xóa bệnh nhân?",
      `Toàn bộ dữ liệu của ${item.name} sẽ bị xóa khỏi máy.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            await deletePatient(db, item.id);
            await load();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 130 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DANH SÁCH</Text>
            <Text style={styles.title}>Bệnh nhân</Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/patients/new")}
          >
            <AppIcon ios="plus" android="add" size={21} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          style={styles.primary}
          onPress={() => router.push("/patients/new")}
        >
          <Text style={styles.primaryText}>+ Thêm bệnh nhân</Text>
        </Pressable>

        {items.map((item) => (
          <GlassCard
            key={item.id}
            style={[styles.card, selected === item.id && styles.selected]}
            borderRadius={18}
            onPress={() => choose(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                Ngày sinh: {formatDate(item.dob)} · Nhóm máu:{" "}
                {item.blood_type || "—"}
              </Text>
              {selected === item.id && (
                <View style={styles.activePill}>
                  <Text style={styles.active}>● Đang theo dõi</Text>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push(`/patients/${item.id}`)}
                hitSlop={8}
              >
                <Text style={styles.link}>Xem</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/patients/edit/[id]",
                    params: { id: item.id },
                  })
                }
                hitSlop={8}
              >
                <Text style={styles.edit}>Sửa</Text>
              </Pressable>
              <Pressable onPress={() => remove(item)} hitSlop={8}>
                <Text style={styles.delete}>Xóa</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: {
    padding: 18,
    gap: 12,
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  eyebrow: {
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
  primary: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  card: {
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  selected: {
    borderColor: "#2563EB",
    borderWidth: 2,
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  name: { fontSize: 18, fontWeight: "800", color: "#172033" },
  meta: { fontSize: 12, color: "#667085", marginTop: 5 },
  activePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 246, 255, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.6)",
  },
  active: { fontSize: 11, color: "#2563EB", fontWeight: "800" },
  actions: { justifyContent: "space-around", alignItems: "flex-end" },
  link: { color: "#2563EB", fontWeight: "700", paddingVertical: 2 },
  edit: { color: "#475467", fontWeight: "700", paddingVertical: 2 },
  delete: { color: "#D92D20", fontWeight: "700", paddingVertical: 2 },
});
