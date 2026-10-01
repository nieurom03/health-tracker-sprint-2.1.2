import { useThemedStyles } from "@/hooks/useTheme";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import DateTimeField from "@/components/form/DateTimeField";
import { getDocument } from "@/database/repositories/documentRepository";
import {
  countDocumentLabResults,
  replaceDocumentLabResults,
} from "@/database/repositories/metricRepository";
import type { HealthDocument } from "@/types/health";
import {
  parseClinicalNarrative,
  parseDocumentMetadata,
} from "@/utils/documentMetadataParser";
import {
  labStatus,
  parseMedicalText,
  type ParsedLabResult,
} from "@/utils/medicalParser";

type LabDraft = ParsedLabResult & {
  selected: boolean;
  valueText: string;
  referenceMinText: string;
  referenceMaxText: string;
};

function numberValue(value: string) {
  return Number(value.replace(",", "."));
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = numberValue(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function documentDate(item: HealthDocument, detectedDate: string | null) {
  if (detectedDate) return new Date(detectedDate);
  if (item.document_date) return new Date(`${item.document_date}T12:00:00`);
  return new Date(item.created_at);
}

function clinicalContent(results: LabDraft[]) {
  return results
    .map((draft) => {
      const min = optionalNumber(draft.referenceMinText);
      const max = optionalNumber(draft.referenceMaxText);
      const reference =
        min === undefined && max === undefined
          ? "chưa có khoảng tham chiếu"
          : `tham chiếu ${min ?? "—"}–${max ?? "—"}`;
      return `${draft.name}: ${numberValue(draft.valueText)} ${draft.unit.trim()} (${reference})`;
    })
    .join("\n");
}

function resultInterpretation(results: LabDraft[]) {
  const outside = results.flatMap((draft) => {
    const value = numberValue(draft.valueText);
    const min = optionalNumber(draft.referenceMinText) ?? null;
    const max = optionalNumber(draft.referenceMaxText) ?? null;
    const status = labStatus(value, min, max);
    if (status !== "high" && status !== "low") return [];
    return [
      `${draft.name} ${status === "high" ? "cao hơn" : "thấp hơn"} khoảng tham chiếu (${value} ${draft.unit.trim()})`,
    ];
  });
  if (outside.length) {
    return `Đối chiếu dữ liệu: ${outside.join("; ")}. Đây chỉ là mô tả kết quả, không phải chẩn đoán.`;
  }
  const withReference = results.some(
    (draft) =>
      draft.referenceMinText.trim() || draft.referenceMaxText.trim(),
  );
  return withReference
    ? "Các chỉ số đã chọn nằm trong khoảng tham chiếu được lưu. Đây chỉ là mô tả kết quả, không phải chẩn đoán."
    : "Chưa đủ khoảng tham chiếu để diễn giải các chỉ số đã chọn. Đây không phải chẩn đoán.";
}

export default function MedicalReviewScreen() {
  const styles = useThemedStyles(baseStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Number(id);
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const allowLeave = useRef(false);
  const [item, setItem] = useState<HealthDocument | null>(null);
  const [drafts, setDrafts] = useState<LabDraft[]>([]);
  const [testedAt, setTestedAt] = useState(new Date());
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [existingCount, setExistingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const snapshot = useMemo(
    () => JSON.stringify({ drafts, testedAt: testedAt.toISOString() }),
    [drafts, testedAt],
  );
  const isDirty = Boolean(initialSnapshot) && snapshot !== initialSnapshot;
  const selectedCount = drafts.filter((draft) => draft.selected).length;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const document = await getDocument(db, documentId);
        if (!active) return;
        if (!document?.ocr_text) {
          setErrorMessage("Tài liệu chưa có nội dung OCR để phân tích.");
          return;
        }
        const parsed = parseMedicalText(document.ocr_text);
        const nextDrafts = parsed.results.map((result) => ({
          ...result,
          selected: true,
          valueText: String(result.value),
          referenceMinText: result.referenceMin === null ? "" : String(result.referenceMin),
          referenceMaxText: result.referenceMax === null ? "" : String(result.referenceMax),
        }));
        const nextDate = documentDate(document, parsed.detectedDate);
        const count = await countDocumentLabResults(db, document.id);
        if (!active) return;
        setItem(document);
        setDrafts(nextDrafts);
        setTestedAt(nextDate);
        setExistingCount(count);
        setInitialSnapshot(JSON.stringify({ drafts: nextDrafts, testedAt: nextDate.toISOString() }));
        if (!nextDrafts.length) {
          setErrorMessage("Không tìm thấy chỉ số xét nghiệm được hỗ trợ trong nội dung OCR.");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Không thể phân tích tài liệu.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [db, documentId]);

  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (!isDirty || allowLeave.current) return;
      event.preventDefault();
      Alert.alert("Bỏ kết quả đang review?", "Các lựa chọn và chỉnh sửa chưa được lưu.", [
        { text: "Ở lại", style: "cancel" },
        {
          text: "Bỏ thay đổi",
          style: "destructive",
          onPress: () => {
            allowLeave.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
  }, [isDirty, navigation]);

  function updateDraft(index: number, patch: Partial<LabDraft>) {
    setDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch } : draft,
      ),
    );
  }

  async function commit() {
    if (!item || saving) return;
    const selected = drafts.filter((draft) => draft.selected);
    if (!selected.length) {
      Alert.alert("Chưa chọn chỉ số", "Hãy chọn ít nhất một kết quả để tạo dữ liệu.");
      return;
    }
    const invalid = selected.find((draft) => {
      const min = optionalNumber(draft.referenceMinText);
      const max = optionalNumber(draft.referenceMaxText);
      return (
        !Number.isFinite(numberValue(draft.valueText)) ||
        !draft.unit.trim() ||
        (Boolean(draft.referenceMinText.trim()) && min === undefined) ||
        (Boolean(draft.referenceMaxText.trim()) && max === undefined) ||
        (min !== undefined && max !== undefined && min > max)
      );
    });
    if (invalid) {
      Alert.alert("Dữ liệu chưa hợp lệ", `Kiểm tra giá trị và đơn vị của ${invalid.name}.`);
      return;
    }
    setSaving(true);
    try {
      const ocrText = item.ocr_text ?? "";
      const narrative = parseClinicalNarrative(ocrText);
      const metadata = parseDocumentMetadata(ocrText);
      const automaticInterpretation = resultInterpretation(selected);
      const interpretation = narrative.interpretation
        ? `${narrative.interpretation}\n\n${automaticInterpretation}`
        : automaticInterpretation;
      const content = clinicalContent(selected);
      await replaceDocumentLabResults(db, {
        documentId: item.id,
        patientId: item.patient_id,
        testedAt: testedAt.toISOString(),
        results: selected.map((draft) => ({
          testCode: draft.key,
          testName: draft.name,
          value: numberValue(draft.valueText),
          unit: draft.unit.trim(),
          referenceMin: optionalNumber(draft.referenceMinText),
          referenceMax: optionalNumber(draft.referenceMaxText),
          referenceText: draft.referenceText ?? undefined,
          notes: `Tự động từ tài liệu: ${item.file_name}`,
          sourceLine: draft.sourceLine,
        })),
        clinicalEntry: {
          title: `Kết quả xét nghiệm · ${item.file_name}`,
          content,
          interpretation,
          symptoms: narrative.symptoms ?? undefined,
          details: `Tự động tạo từ tài liệu ${item.file_name}. Nội dung cần được đối chiếu với tài liệu gốc.`,
          facility: item.hospital ?? metadata.hospital ?? undefined,
          clinician: item.doctor ?? metadata.doctor ?? undefined,
        },
      });
      allowLeave.current = true;
      Alert.alert(
        "Đã cập nhật Health Tracker",
        `${selected.length} chỉ số và hồ sơ bệnh án đã được cập nhật từ tài liệu.`,
        [
          { text: "Về tài liệu", onPress: () => router.back() },
          {
            text: "Xem hồ sơ",
            onPress: () =>
              router.replace({
                pathname: "/clinical",
                params: { patientId: String(item.patient_id) },
              }),
          },
          { text: "Xem Dashboard", onPress: () => router.replace("/") },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Không thể tạo chỉ số",
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu dữ liệu.",
      );
    } finally {
      setSaving(false);
    }
  }

  function save() {
    if (selectedCount === 0) {
      Alert.alert("Chưa chọn chỉ số", "Hãy chọn ít nhất một kết quả để tạo dữ liệu.");
      return;
    }
    if (existingCount > 0) {
      Alert.alert(
        "Cập nhật chỉ số từ tài liệu?",
        `${existingCount} chỉ số đã tạo trước đó từ tài liệu này sẽ được thay thế bằng lựa chọn hiện tại.`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Cập nhật", onPress: commit },
        ],
      );
      return;
    }
    commit();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={96}
    >
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SPRINT 5–6 · LOCAL PARSER</Text>
          <Text style={styles.title}>Review chỉ số y khoa</Text>
          <Text style={styles.subtitle}>
            Đối chiếu với phiếu gốc, bỏ chọn hoặc sửa kết quả trước khi cập nhật Health Tracker.
          </Text>
        </View>

        {loading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.statusTitle}>Đang phân tích nội dung OCR…</Text>
          </View>
        ) : errorMessage ? (
          <View style={[styles.statusCard, styles.errorCard]}>
            <Text style={styles.errorTitle}>Chưa thể tạo chỉ số</Text>
            <Text style={styles.statusText}>{errorMessage}</Text>
            {item && (
              <Pressable
                style={styles.editOcrButton}
                onPress={() => router.replace({ pathname: "/documents/ocr-review", params: { id: String(item.id), scan: "0" } })}
              >
                <Text style={styles.editOcrText}>Chỉnh lại nội dung OCR</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View><Text style={styles.summaryLabel}>TÀI LIỆU</Text><Text style={styles.summaryValue}>{item?.file_name}</Text></View>
              <View style={styles.summaryRight}><Text style={styles.summaryCount}>{selectedCount}/{drafts.length}</Text><Text style={styles.summaryLabel}>ĐÃ CHỌN</Text></View>
            </View>

            <Text style={styles.sectionLabel}>Ngày xét nghiệm</Text>
            <DateTimeField value={testedAt} onChange={setTestedAt} />

            <Text style={styles.sectionLabel}>Kết quả nhận dạng</Text>
            {drafts.map((draft, index) => {
              const value = numberValue(draft.valueText);
              const min = optionalNumber(draft.referenceMinText) ?? null;
              const max = optionalNumber(draft.referenceMaxText) ?? null;
              const status = Number.isFinite(value) ? labStatus(value, min, max) : "unknown";
              return (
                <View key={draft.key} style={[styles.resultCard, !draft.selected && styles.resultDisabled]}>
                  <Pressable style={styles.resultHeader} onPress={() => updateDraft(index, { selected: !draft.selected })}>
                    <View style={[styles.checkbox, draft.selected && styles.checkboxActive]}>
                      <Text style={styles.checkmark}>{draft.selected ? "✓" : ""}</Text>
                    </View>
                    <View style={styles.resultTitleWrap}>
                      <Text style={styles.resultName}>{draft.name}</Text>
                      <Text style={styles.confidence}>Tin cậy {Math.round(draft.confidence * 100)}%</Text>
                    </View>
                    <View style={[styles.statusBadge, styles[`status_${status}`]]}>
                      <Text style={[styles.statusBadgeText, styles[`statusText_${status}`]]}>
                        {status === "high" ? "CAO" : status === "low" ? "THẤP" : status === "normal" ? "TRONG KHOẢNG" : "CHƯA RÕ"}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.valueRow}>
                    <View style={styles.fieldGrow}>
                      <Text style={styles.fieldLabel}>GIÁ TRỊ</Text>
                      <TextInput style={styles.input} keyboardType="decimal-pad" value={draft.valueText} onChangeText={(valueText) => updateDraft(index, { valueText })} />
                    </View>
                    <View style={styles.fieldGrow}>
                      <Text style={styles.fieldLabel}>ĐƠN VỊ</Text>
                      <TextInput style={styles.input} value={draft.unit} onChangeText={(unit) => updateDraft(index, { unit })} autoCapitalize="none" />
                    </View>
                  </View>
                  <View style={styles.valueRow}>
                    <View style={styles.fieldGrow}><Text style={styles.fieldLabel}>THAM CHIẾU TỪ</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={draft.referenceMinText} onChangeText={(referenceMinText) => updateDraft(index, { referenceMinText })} placeholder="—" /></View>
                    <View style={styles.fieldGrow}><Text style={styles.fieldLabel}>ĐẾN</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={draft.referenceMaxText} onChangeText={(referenceMaxText) => updateDraft(index, { referenceMaxText })} placeholder="—" /></View>
                  </View>
                  {draft.referenceText && <Text style={styles.referenceSource}>Tham chiếu OCR: {draft.referenceText}</Text>}
                  <Text style={styles.sourceLine} numberOfLines={3}>OCR: {draft.sourceLine}</Text>
                  {draft.converted && <Text style={styles.converted}>Đã quy đổi từ {draft.rawValue} {draft.rawUnit}</Text>}
                </View>
              );
            })}

            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Cần đối chiếu phiếu gốc</Text>
              <Text style={styles.warningText}>Kết quả OCR/parser có thể sai. Đây không phải chẩn đoán y khoa.</Text>
            </View>
            <Pressable style={[styles.saveButton, saving && styles.disabled]} disabled={saving} onPress={save}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Tạo {selectedCount} chỉ số đã chọn</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const baseStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 18, paddingBottom: 52, gap: 13 },
  cancelText: { color: "#2563EB", fontSize: 15, fontWeight: "800" },
  hero: { backgroundColor: "#0F172A", borderRadius: 22, padding: 20 },
  eyebrow: { color: "#6EE7B7", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 6 },
  subtitle: { color: "#CBD5E1", fontSize: 12, lineHeight: 18, marginTop: 7 },
  statusCard: { minHeight: 220, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  statusTitle: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  statusText: { color: "#64748B", fontSize: 12, lineHeight: 18, textAlign: "center" },
  errorCard: { borderColor: "#FED7AA", backgroundColor: "#FFFBEB" },
  errorTitle: { color: "#B45309", fontSize: 16, fontWeight: "900" },
  editOcrButton: { marginTop: 8, backgroundColor: "#2563EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  editOcrText: { color: "#fff", fontWeight: "900" },
  summaryCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 17, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  summaryValue: { color: "#0F172A", fontSize: 13, fontWeight: "900", marginTop: 4, maxWidth: 260 },
  summaryRight: { alignItems: "flex-end" },
  summaryCount: { color: "#2563EB", fontSize: 18, fontWeight: "900" },
  sectionLabel: { color: "#475569", fontSize: 11, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase", marginTop: 3 },
  resultCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE3EC", borderRadius: 18, padding: 14, gap: 11 },
  resultDisabled: { opacity: 0.48 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 25, height: 25, borderRadius: 8, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  checkmark: { color: "#fff", fontWeight: "900" },
  resultTitleWrap: { flex: 1 },
  resultName: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  confidence: { color: "#94A3B8", fontSize: 9, marginTop: 2 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  statusBadgeText: { fontSize: 8, fontWeight: "900" },
  status_high: { backgroundColor: "#FEE2E2" }, statusText_high: { color: "#B91C1C" },
  status_low: { backgroundColor: "#FEF3C7" }, statusText_low: { color: "#B45309" },
  status_normal: { backgroundColor: "#DCFCE7" }, statusText_normal: { color: "#15803D" },
  status_unknown: { backgroundColor: "#E2E8F0" }, statusText_unknown: { color: "#64748B" },
  valueRow: { flexDirection: "row", gap: 9 },
  fieldGrow: { flex: 1 },
  fieldLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "900", marginBottom: 4 },
  input: { minHeight: 43, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 11, paddingHorizontal: 11, color: "#0F172A", fontSize: 13, fontWeight: "800" },
  referenceSource: { color: "#1D4ED8", backgroundColor: "#EFF6FF", borderRadius: 9, padding: 9, fontSize: 10, lineHeight: 14 },
  sourceLine: { color: "#64748B", backgroundColor: "#F8FAFC", borderRadius: 9, padding: 9, fontSize: 9, lineHeight: 14 },
  converted: { color: "#0369A1", fontSize: 9, fontWeight: "800" },
  warningCard: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 15, padding: 13 },
  warningTitle: { color: "#92400E", fontSize: 12, fontWeight: "900" },
  warningText: { color: "#A16207", fontSize: 10, lineHeight: 15, marginTop: 4 },
  saveButton: { minHeight: 54, backgroundColor: "#2563EB", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.55 },
});
