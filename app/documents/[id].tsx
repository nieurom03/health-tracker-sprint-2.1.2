import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { requireOptionalNativeModule } from "expo-modules-core";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";

import DocumentDateField from "@/components/form/DocumentDateField";
import {
  deleteDocument,
  DOCUMENT_CATEGORIES,
  getDocument,
  updateDocument,
} from "@/database/repositories/documentRepository";
import type { HealthDocument } from "@/types/health";
import { formatDateTime } from "@/utils/format";
import { removeStoredDocument } from "@/utils/documentStorage";
import { materializeDocument } from "@/utils/protectedFile";

type QuickLookModule = {
  canPreview: (uri: string) => Promise<boolean>;
  previewFile: (options: {
    uri: string;
    chooserTitle?: string;
    editingMode?: "disabled" | "createCopy" | "updateContents";
  }) => Promise<void>;
};

const quickLook = requireOptionalNativeModule<QuickLookModule>("ExpoQuickLook");

function parseDocumentDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLocalDate(value: Date | null) {
  if (!value) return undefined;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export default function DocumentDetailScreen() {
  const styles = useThemedStyles(baseStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Number(id);
  const db = useSQLiteContext();
  const [item, setItem] = useState<HealthDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullOcr, setShowFullOcr] = useState(false);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [documentDate, setDocumentDate] = useState<Date | null>(null);
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    const document = await getDocument(db, documentId);
    setItem(document ?? null);
    if (document) {
      setFileName(document.file_name);
      setCategory(document.category ?? "");
      setDocumentDate(parseDocumentDate(document.document_date));
      setHospital(document.hospital ?? "");
      setDoctor(document.doctor ?? "");
      setNotes(document.notes ?? "");
      try {
        setPreviewUri(await materializeDocument(document.file_path, document.file_name));
      } catch {
        setPreviewUri(null);
      }
    }
    setLoading(false);
  }, [db, documentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function preview() {
    if (!item) return;
    if (Platform.OS === "web") {
      Alert.alert(
        "Không hỗ trợ trên web",
        "Hãy mở tài liệu trên ứng dụng iOS hoặc Android.",
      );
      return;
    }
    try {
      const uri = previewUri ?? await materializeDocument(item.file_path, item.file_name);
      if (quickLook) {
        const supported = await quickLook.canPreview(uri);
        if (!supported) {
          Alert.alert(
            "Không có trình xem phù hợp",
            "Thiết bị chưa có ứng dụng có thể mở định dạng này.",
          );
          return;
        }
        await quickLook.previewFile({
          uri,
          chooserTitle: "Mở tài liệu y tế",
          editingMode: "disabled",
        });
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Không thể xem tài liệu", "Bản ứng dụng này chưa có trình xem file phù hợp.");
        return;
      }
      await Sharing.shareAsync(uri, {
        dialogTitle: "Mở tài liệu y tế",
        mimeType: item.type === "pdf" ? "application/pdf" : "image/*",
        UTI: item.type === "pdf" ? "com.adobe.pdf" : "public.image",
      });
    } catch (error) {
      Alert.alert(
        "Không thể xem tài liệu",
        error instanceof Error
          ? error.message
          : "File không còn tồn tại hoặc không đọc được.",
      );
    }
  }

  async function save() {
    if (!item) return;
    if (!fileName.trim())
      return Alert.alert(
        "Thiếu tên tài liệu",
        "Tên tài liệu không được để trống.",
      );
    setSaving(true);
    try {
      await updateDocument(db, item.id, {
        fileName,
        category,
        documentDate: toLocalDate(documentDate),
        hospital,
        doctor,
        notes,
      });
      await load();
      Alert.alert("Đã lưu", "Thông tin tài liệu đã được cập nhật.");
    } catch (error) {
      Alert.alert(
        "Không thể lưu",
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cập nhật tài liệu.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openOcrReview(scan: boolean) {
    if (!item) return;
    if (Platform.OS === "web") {
      Alert.alert(
        "Không hỗ trợ trên web",
        "OCR offline cần development build trên iOS hoặc Android.",
      );
      return;
    }
    router.push({
      pathname: "/documents/ocr-review",
      params: { id: String(item.id), scan: scan ? "1" : "0" },
    });
  }

  function confirmRescan() {
    Alert.alert("Quét lại tài liệu?", "Bản đã lưu chỉ được thay thế sau khi bạn review và xác nhận lưu.", [
      { text: "Hủy", style: "cancel" },
      { text: "Quét lại", onPress: () => openOcrReview(true) },
    ]);
  }

  function openMedicalReview() {
    if (!item) return;
    router.push({
      pathname: "/documents/medical-review",
      params: { id: String(item.id) },
    });
  }

  function remove() {
    if (!item) return;
    Alert.alert(
      "Xóa tài liệu?",
      `${item.file_name} và file lưu trên thiết bị sẽ bị xóa.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(db, item.id);
              try {
                removeStoredDocument(item.file_path);
              } catch {
                /* DB record is already removed. */
              }
              router.back();
            } catch (error) {
              Alert.alert(
                "Không thể xóa",
                error instanceof Error
                  ? error.message
                  : "Đã xảy ra lỗi khi xóa tài liệu.",
              );
            }
          },
        },
      ],
    );
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (!item)
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Không tìm thấy tài liệu.</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.previewCard}>
          {item.type === "image" ? (
            <Image
              source={{ uri: previewUri ?? item.file_path }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPreview}>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <Text style={styles.previewTitle}>{item.file_name}</Text>
              <Text style={styles.previewHint}>
                Xem bằng trình đọc PDF của thiết bị
              </Text>
            </View>
          )}
          <Pressable style={styles.previewButton} onPress={preview}>
            <Text style={styles.previewButtonText}>
              {item.type === "image" ? "Xem toàn màn hình" : "Mở PDF"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.ownerRow}>
          <View>
            <Text style={styles.ownerLabel}>BỆNH NHÂN</Text>
            <Text style={styles.owner}>{item.patient_name}</Text>
          </View>
          <Text style={styles.created}>
            Thêm {formatDateTime(item.created_at)}
          </Text>
        </View>

        <View style={styles.ocrCard}>
          <View style={styles.ocrHeader}>
            <View style={styles.ocrTitleWrap}>
              <Text style={styles.ocrEyebrow}>OCR OFFLINE</Text>
              <Text style={styles.ocrTitle}>
                {item.ocr_text === null
                  ? "Chưa nhận dạng văn bản"
                  : "Văn bản đã nhận dạng"}
              </Text>
            </View>
            {item.ocr_text !== null && (
              <View style={styles.ocrBadge}>
                <Text style={styles.ocrBadgeText}>ĐÃ LƯU</Text>
              </View>
            )}
          </View>
          <Text style={styles.ocrHint}>
            Xử lý hoàn toàn trên thiết bị. Ảnh và nội dung không được tải lên
            máy chủ.
          </Text>
          {item.ocr_text !== null &&
            (item.ocr_text ? (
              <View style={styles.ocrResult}>
                <Text selectable style={styles.ocrText}>
                  {showFullOcr || item.ocr_text.length <= 1200
                    ? item.ocr_text
                    : `${item.ocr_text.slice(0, 1200)}…`}
                </Text>
                {item.ocr_text.length > 1200 && (
                  <Pressable onPress={() => setShowFullOcr((value) => !value)}>
                    <Text style={styles.ocrToggle}>
                      {showFullOcr ? "Thu gọn" : "Xem toàn bộ văn bản"}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={styles.ocrEmpty}>
                Đã quét nhưng không tìm thấy văn bản.
              </Text>
            ))}
          <Pressable style={styles.ocrButton} onPress={() => openOcrReview(item.ocr_text === null)}>
            <Text style={styles.ocrButtonText}>
              {item.ocr_text === null ? "Quét và review OCR" : "Xem và chỉnh sửa OCR"}
            </Text>
          </Pressable>
          {item.ocr_text !== null && (
            <Pressable style={styles.ocrSecondaryButton} onPress={confirmRescan}>
              <Text style={styles.ocrSecondaryButtonText}>Quét lại từ tài liệu</Text>
            </Pressable>
          )}
          {!!item.ocr_text && (
            <Pressable style={styles.parserButton} onPress={openMedicalReview}>
              <Text style={styles.parserButtonText}>Trích xuất chỉ số y khoa →</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>Tên tài liệu</Text>
        <TextInput
          style={styles.input}
          value={fileName}
          onChangeText={setFileName}
          placeholder="Tên tài liệu"
        />

        <Text style={styles.label}>Phân loại</Text>
        <View style={styles.chips}>
          {DOCUMENT_CATEGORIES.map((choice) => (
            <Pressable
              key={choice.key}
              style={[
                styles.chip,
                category === choice.key && styles.chipActive,
              ]}
              onPress={() => setCategory(choice.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  category === choice.key && styles.chipTextActive,
                ]}
              >
                {choice.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Ngày khám</Text>
        <DocumentDateField value={documentDate} onChange={setDocumentDate} />

        <Text style={styles.label}>Bệnh viện / cơ sở y tế</Text>
        <TextInput
          style={styles.input}
          value={hospital}
          onChangeText={setHospital}
          placeholder="Ví dụ: Bệnh viện Chợ Rẫy"
        />

        <Text style={styles.label}>Bác sĩ</Text>
        <TextInput
          style={styles.input}
          value={doctor}
          onChangeText={setDoctor}
          placeholder="Tên bác sĩ"
        />

        <Text style={styles.label}>Ghi chú</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Thông tin cần ghi nhớ..."
          multiline
        />

        <Pressable
          style={[styles.save, saving && styles.disabled]}
          disabled={saving}
          onPress={save}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          )}
        </Pressable>
        <Pressable style={styles.delete} onPress={remove}>
          <Text style={styles.deleteText}>Xóa tài liệu này</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const baseStyles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  missing: { color: "#64748B", fontWeight: "800" },
  container: {
    padding: 18,
    paddingBottom: 48,
    gap: 10,
    backgroundColor: "#F8FAFC",
  },
  previewCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    backgroundColor: "#020617",
  },
  pdfPreview: {
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  pdfBadge: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: "#FEF2F2",
  },
  pdfBadgeText: { color: "#DC2626", fontSize: 18, fontWeight: "900" },
  previewTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  previewHint: { color: "#94A3B8", fontSize: 11, marginTop: 5 },
  previewButton: {
    backgroundColor: "#2563EB",
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 10,
  },
  previewButtonText: { color: "#fff", fontWeight: "900" },
  ownerRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ownerLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  owner: { color: "#2563EB", fontSize: 14, fontWeight: "900", marginTop: 3 },
  created: {
    maxWidth: 150,
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "right",
  },
  ocrCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 18,
    padding: 15,
    gap: 10,
  },
  ocrHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  ocrTitleWrap: { flex: 1 },
  ocrEyebrow: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  ocrTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  ocrBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },
  ocrBadgeText: { color: "#15803D", fontSize: 9, fontWeight: "900" },
  ocrHint: { color: "#64748B", fontSize: 11, lineHeight: 16 },
  ocrResult: { backgroundColor: "#fff", borderRadius: 13, padding: 12, gap: 9 },
  ocrText: { color: "#334155", fontSize: 12, lineHeight: 19 },
  ocrToggle: { color: "#2563EB", fontSize: 12, fontWeight: "900" },
  ocrEmpty: { color: "#B45309", fontSize: 12, fontWeight: "700" },
  ocrButton: {
    minHeight: 46,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  ocrButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  ocrSecondaryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  ocrSecondaryButtonText: { color: "#1D4ED8", fontSize: 12, fontWeight: "900" },
  parserButton: {
    minHeight: 44,
    backgroundColor: "#D1FAE5",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  parserButtonText: { color: "#047857", fontSize: 12, fontWeight: "900" },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: "#475569",
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
  },
  multiline: { height: 100, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { color: "#475569", fontSize: 11, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  save: {
    marginTop: 14,
    minHeight: 52,
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  delete: { padding: 15, alignItems: "center" },
  deleteText: { color: "#DC2626", fontWeight: "900" },
});
