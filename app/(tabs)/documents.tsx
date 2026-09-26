import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import AppIcon from "@/components/AppIcon";
import {
  documentCategoryName,
  listDocuments,
} from "@/database/repositories/documentRepository";
import {
  getPatient,
  getSelectedPatientId,
} from "@/database/repositories/patientRepository";
import type { HealthDocument, Patient } from "@/types/health";
import { formatDate, formatDateTime } from "@/utils/format";

type Scope = "all" | "selected";

export default function DocumentsScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [items, setItems] = useState<HealthDocument[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [scope, setScope] = useState<Scope>("all");

  const load = useCallback(async () => {
    const selectedId = await getSelectedPatientId(db);
    const [documents, patient] = await Promise.all([
      listDocuments(db),
      selectedId ? getPatient(db, selectedId) : Promise.resolve(null),
    ]);
    setItems(documents);
    setSelectedPatient(patient);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(
    () =>
      scope === "selected" && selectedPatient
        ? items.filter((item) => item.patient_id === selectedPatient.id)
        : items,
    [items, scope, selectedPatient],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 130 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DOCUMENT INBOX</Text>
            <Text style={styles.title}>Tài liệu y tế</Text>
            <Text style={styles.subtitle}>
              Ảnh và PDF được lưu trên thiết bị
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/documents/new")}
          >
            <AppIcon ios="plus" android="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {selectedPatient && (
          <View style={styles.filters}>
            <Pressable
              style={[styles.filter, scope === "all" && styles.filterActive]}
              onPress={() => setScope("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  scope === "all" && styles.filterTextActive,
                ]}
              >
                Tất cả
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filter,
                scope === "selected" && styles.filterActive,
              ]}
              onPress={() => setScope("selected")}
            >
              <Text
                style={[
                  styles.filterText,
                  scope === "selected" && styles.filterTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedPatient.name}
              </Text>
            </Pressable>
          </View>
        )}

        {!selectedPatient ? (
          <GlassCard style={styles.emptyWrap} borderRadius={20}>
            <EmptyState
              title="Chưa có bệnh nhân"
              text="Tạo hồ sơ bệnh nhân trước khi thêm tài liệu y tế."
            />
            <Pressable
              style={styles.primary}
              onPress={() => router.push("/patients/new")}
            >
              <Text style={styles.primaryText}>+ Thêm bệnh nhân</Text>
            </Pressable>
          </GlassCard>
        ) : visible.length === 0 ? (
          <GlassCard style={styles.emptyWrap} borderRadius={20}>
            <EmptyState
              title="Inbox đang trống"
              text="Chụp giấy, chọn ảnh hoặc import PDF để bắt đầu hồ sơ tài liệu."
            />
            <Pressable
              style={styles.primary}
              onPress={() => router.push("/documents/new")}
            >
              <Text style={styles.primaryText}>Thêm tài liệu đầu tiên</Text>
            </Pressable>
          </GlassCard>
        ) : (
          visible.map((item) => (
            <GlassCard
              key={item.id}
              style={styles.card}
              borderRadius={18}
              onPress={() => router.push(`/documents/${item.id}`)}
            >
              <View
                style={[styles.fileIcon, item.type === "pdf" && styles.pdfIcon]}
              >
                <Text
                  style={[
                    styles.fileIconText,
                    item.type === "pdf" && styles.pdfIconText,
                  ]}
                >
                  {item.type === "pdf" ? "PDF" : "IMG"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {item.file_name}
                </Text>
                <Text style={styles.patientName}>{item.patient_name}</Text>
                <Text style={styles.date}>
                  {documentCategoryName(item.category)} ·{" "}
                  {item.document_date
                    ? formatDate(item.document_date)
                    : formatDateTime(item.created_at)}
                </Text>
              </View>
              <View style={styles.right}>
                <View style={styles.badges}>
                  {item.ocr_text !== null && (
                    <View style={styles.ocrBadge}>
                      <Text style={styles.ocrText}>OCR</Text>
                    </View>
                  )}
                  {!!item.parsed_count && (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricText}>
                        {item.parsed_count} CHỈ SỐ
                      </Text>
                    </View>
                  )}
                  <View style={styles.localBadge}>
                    <Text style={styles.localText}>LOCAL</Text>
                  </View>
                </View>
                <AppIcon
                  ios="chevron.right"
                  android="chevron_right"
                  size={16}
                  color="#94A3B8"
                />
              </View>
            </GlassCard>
          ))
        )}

        {visible.length > 0 && (
          <Text style={styles.notice}>
            Chạm vào tài liệu để xem trước hoặc chỉnh sửa thông tin.
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
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#64748B",
  },
  title: { fontSize: 25, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  subtitle: { fontSize: 11, color: "#94A3B8", marginTop: 3 },
  addButton: {
    width: 44,
    height: 44,
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
  filters: { flexDirection: "row", gap: 8, marginBottom: 2 },
  filter: {
    maxWidth: "70%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  filterActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  filterText: { fontSize: 12, fontWeight: "900", color: "#64748B" },
  filterTextActive: { color: "#fff" },
  emptyWrap: {
    padding: 10,
  },
  primary: {
    backgroundColor: "#2563EB",
    margin: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  card: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIcon: {
    width: 48,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.6)",
  },
  pdfIcon: {
    backgroundColor: "rgba(254, 242, 242, 0.9)",
    borderColor: "rgba(254, 202, 202, 0.6)",
  },
  fileIconText: { color: "#2563EB", fontSize: 11, fontWeight: "900" },
  pdfIconText: { color: "#DC2626" },
  info: { flex: 1 },
  fileName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  patientName: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "800",
    marginTop: 4,
  },
  date: { fontSize: 10, color: "#94A3B8", marginTop: 3 },
  localBadge: {
    backgroundColor: "rgba(236, 253, 245, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.7)",
  },
  localText: { color: "#047857", fontSize: 9, fontWeight: "900" },
  badges: { alignItems: "flex-end", gap: 4 },
  ocrBadge: {
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.7)",
  },
  ocrText: { color: "#2563EB", fontSize: 9, fontWeight: "900" },
  metricBadge: {
    backgroundColor: "rgba(209, 250, 229, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.7)",
  },
  metricText: { color: "#047857", fontSize: 8, fontWeight: "900" },
  right: { alignItems: "center", gap: 6 },
  notice: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
