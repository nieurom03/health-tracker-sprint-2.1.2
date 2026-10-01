import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import AppIcon from "@/components/AppIcon";
import {
  deleteMedication,
  listMedications,
  saveMedication,
} from "@/database/repositories/medicationRepository";
import { getPatient } from "@/database/repositories/patientRepository";
import type { Medication, Patient } from "@/types/health";

export default function MedicationsScreen() {
  const styles = useThemedStyles(baseStyles);
  const { patientId: rawId } = useLocalSearchParams<{ patientId: string }>();
  const patientId = Number(rawId);
  const db = useSQLiteContext();
  const scrollRef = useRef<ScrollView>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState<number>();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState<"active" | "stopped">("active");
  const [sideEffects, setSideEffects] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setPatient(await getPatient(db, patientId));
    setItems(await listMedications(db, patientId));
  }, [db, patientId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetFields() {
    setId(undefined);
    setName("");
    setDosage("");
    setFrequency("");
    setStart("");
    setEnd("");
    setStatus("active");
    setSideEffects("");
    setNotes("");
  }

  function scrollToForm() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 120, animated: true });
    });
  }

  function beginAdd() {
    resetFields();
    setShowForm(true);
    scrollToForm();
  }

  function edit(item: Medication) {
    setId(item.id);
    setName(item.name);
    setDosage(item.dosage ?? "");
    setFrequency(item.frequency ?? "");
    setStart(item.start_date ?? "");
    setEnd(item.end_date ?? "");
    setStatus(item.status);
    setSideEffects(item.side_effects ?? "");
    setNotes(item.notes ?? "");
    setShowForm(true);
    scrollToForm();
  }

  function closeForm() {
    resetFields();
    setShowForm(false);
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert("Thiếu tên thuốc", "Hãy nhập tên thuốc.");
      return;
    }
    await saveMedication(db, {
      id,
      patientId,
      name,
      dosage,
      frequency,
      startDate: start,
      endDate: end,
      status,
      sideEffects,
      notes,
    });
    closeForm();
    await load();
  }

  function remove(item: Medication) {
    Alert.alert("Xóa thuốc?", item.name, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await deleteMedication(db, item.id);
          if (id === item.id) closeForm();
          await load();
        },
      },
    ]);
  }

  const activeCount = items.filter((item) => item.status === "active").length;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.overline}>MEDICATION TRACKER</Text>
            <Text style={styles.heroTitle}>
              {patient?.name ?? "Thuốc đang dùng"}
            </Text>
          </View>
          <Pressable
            style={styles.heroAdd}
            onPress={showForm ? closeForm : beginAdd}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showForm ? "Đóng form thuốc" : "Thêm thuốc"}
          >
            <AppIcon
              ios={showForm ? "xmark" : "plus"}
              android={showForm ? "close" : "add"}
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
        <Text style={styles.heroText}>
          Theo dõi liều, lịch dùng, thời gian điều trị và tác dụng phụ.
        </Text>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formEyebrow}>
                {id ? "CHỈNH SỬA" : "THÊM MỚI"}
              </Text>
              <Text style={styles.heading}>
                {id ? "Chỉnh sửa thuốc" : "Thêm thuốc"}
              </Text>
            </View>
            <Pressable
              onPress={closeForm}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng form thuốc"
            >
              <Text style={styles.close}>Đóng</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tên thuốc *"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="Liều dùng"
            />
            <TextInput
              style={[styles.input, styles.half]}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="Lịch uống"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              value={start}
              onChangeText={setStart}
              placeholder="Bắt đầu YYYY-MM-DD"
            />
            <TextInput
              style={[styles.input, styles.half]}
              value={end}
              onChangeText={setEnd}
              placeholder="Kết thúc"
            />
          </View>
          <View style={styles.segment}>
            <Pressable
              style={[styles.seg, status === "active" && styles.segOn]}
              onPress={() => setStatus("active")}
            >
              <Text
                style={[
                  styles.segText,
                  status === "active" && styles.segTextOn,
                ]}
              >
                Đang dùng
              </Text>
            </Pressable>
            <Pressable
              style={[styles.seg, status === "stopped" && styles.segOn]}
              onPress={() => setStatus("stopped")}
            >
              <Text
                style={[
                  styles.segText,
                  status === "stopped" && styles.segTextOn,
                ]}
              >
                Đã ngưng
              </Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, styles.multi]}
            value={sideEffects}
            onChangeText={setSideEffects}
            placeholder="Tác dụng phụ ghi nhận"
            multiline
          />
          <TextInput
            style={[styles.input, styles.multi]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ghi chú"
            multiline
          />
          <Pressable style={styles.primary} onPress={save}>
            <Text style={styles.primaryText}>
              {id ? "Lưu thay đổi" : "Lưu thuốc"}
            </Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={closeForm}>
            <Text style={styles.cancel}>Hủy</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.listHeading}>Thuốc đang dùng</Text>
          <Text style={styles.listCount}>
            {activeCount} đang dùng · {items.length} tổng cộng
          </Text>
        </View>
        {!showForm && (
          <Pressable
            style={styles.addButton}
            onPress={beginAdd}
            accessibilityRole="button"
            accessibilityLabel="Thêm thuốc"
          >
            <AppIcon ios="plus" android="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Thêm thuốc</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <AppIcon
              ios="pills.fill"
              android="medication"
              size={25}
              color="#2563EB"
            />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thuốc nào</Text>
          <Text style={styles.emptyText}>
            Thêm thuốc để theo dõi liều dùng và lịch uống.
          </Text>
          {!showForm && (
            <Pressable style={styles.emptyAddButton} onPress={beginAdd}>
              <Text style={styles.emptyAddText}>+ Thêm thuốc</Text>
            </Pressable>
          )}
        </View>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => edit(item)}
            onLongPress={() => remove(item)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.name}</Text>
              <Text
                style={[
                  styles.badge,
                  item.status === "stopped" && styles.badgeOff,
                ]}
              >
                {item.status === "active" ? "ĐANG DÙNG" : "ĐÃ NGƯNG"}
              </Text>
            </View>
            <Text style={styles.details}>
              {[item.dosage, item.frequency].filter(Boolean).join(" · ") ||
                "Chưa nhập liều/lịch"}
            </Text>
            {item.side_effects && (
              <Text style={styles.side}>
                Tác dụng phụ: {item.side_effects}
              </Text>
            )}
            <Text style={styles.cardHint}>Chạm để sửa · Giữ để xóa</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 50,
    gap: 12,
    backgroundColor: "#F8FAFC",
    minHeight: "100%",
  },
  hero: { backgroundColor: "#0F172A", borderRadius: 22, padding: 20 },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: { flex: 1 },
  heroAdd: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  overline: {
    color: "#6EE7B7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 5 },
  heroText: { color: "#CBD5E1", fontSize: 12, marginTop: 9, lineHeight: 18 },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 20,
    padding: 15,
    gap: 10,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  formEyebrow: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  heading: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 3 },
  close: { color: "#64748B", fontSize: 12, fontWeight: "900" },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 13,
    padding: 12,
    color: "#0F172A",
  },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  multi: { height: 72, textAlignVertical: "top" },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 14,
  },
  seg: { flex: 1, padding: 10, alignItems: "center", borderRadius: 11 },
  segOn: { backgroundColor: "#fff" },
  segText: { color: "#64748B", fontWeight: "800" },
  segTextOn: { color: "#0F172A" },
  primary: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  cancelButton: { paddingVertical: 4 },
  cancel: { textAlign: "center", color: "#64748B", fontWeight: "800" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  listHeading: { fontSize: 19, fontWeight: "900", color: "#0F172A" },
  listCount: { color: "#94A3B8", fontSize: 10, fontWeight: "700", marginTop: 3 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: "#0F172A", fontSize: 15, fontWeight: "900", marginTop: 12 },
  emptyText: { color: "#64748B", fontSize: 11, marginTop: 5, textAlign: "center" },
  emptyAddButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 15,
  },
  emptyAddText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { flex: 1, fontSize: 15, fontWeight: "900", color: "#0F172A", marginRight: 8 },
  badge: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "900",
    backgroundColor: "#D1FAE5",
    padding: 5,
    borderRadius: 99,
  },
  badgeOff: { color: "#64748B", backgroundColor: "#E2E8F0" },
  details: { color: "#475569", fontSize: 12, marginTop: 6 },
  side: { color: "#B45309", fontSize: 11, marginTop: 6 },
  cardHint: { color: "#94A3B8", fontSize: 9, marginTop: 8, fontWeight: "700" },
});
