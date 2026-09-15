import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import {
  getDocument,
  updateDocumentOcrText,
} from "@/database/repositories/documentRepository";
import type { HealthDocument } from "@/types/health";
import { materializeDocument } from "@/utils/protectedFile";

type ReviewState = "loading" | "scanning" | "ready" | "error";

export default function OcrReviewScreen() {
  const { id, scan } = useLocalSearchParams<{ id: string; scan?: string }>();
  const documentId = Number(id);
  const shouldScan = scan === "1";
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const allowLeave = useRef(false);
  const scanStarted = useRef(false);
  const [item, setItem] = useState<HealthDocument | null>(null);
  const [state, setState] = useState<ReviewState>("loading");
  const [originalText, setOriginalText] = useState("");
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const isDirty = state === "ready" && draft !== originalText;

  const runOcr = useCallback(async (document: HealthDocument) => {
    setState("scanning");
    setErrorMessage("");
    try {
      const { isAvailable, recognizeText } =
        await import("@dariyd/react-native-text-recognition");
      if (!(await isAvailable())) {
        throw new Error("Thiết bị này không hỗ trợ nhận dạng văn bản offline.");
      }
      const uri = await materializeDocument(
        document.file_path,
        document.file_name,
      );
      setPreviewUri(uri);
      const result = await recognizeText(uri, {
        languages: ["vi", "en"],
        recognitionLevel: document.type === "pdf" ? "line" : "word",
        useFastRecognition: false,
        pdfDpi: 300,
      });
      if (!result.success) {
        throw new Error(
          result.errorMessage || "Không nhận dạng được tài liệu.",
        );
      }
      setDraft(result.fullText?.trim() ?? "");
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "File không còn tồn tại hoặc không đọc được.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!documentId) {
        setState("error");
        setErrorMessage("Mã tài liệu không hợp lệ.");
        return;
      }
      const document = await getDocument(db, documentId);
      if (!active) return;
      if (!document) {
        setState("error");
        setErrorMessage("Không tìm thấy tài liệu.");
        return;
      }
      const savedText = document.ocr_text ?? "";
      setItem(document);
      try {
        setPreviewUri(
          await materializeDocument(document.file_path, document.file_name),
        );
      } catch {
        setPreviewUri(null);
      }
      setOriginalText(savedText);
      setDraft(savedText);
      if (shouldScan && !scanStarted.current) {
        scanStarted.current = true;
        await runOcr(document);
      } else {
        setState("ready");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [db, documentId, runOcr, shouldScan]);

  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (!isDirty || allowLeave.current) return;
      event.preventDefault();
      Alert.alert("Bỏ thay đổi OCR?", "Nội dung đang review chưa được lưu.", [
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

  async function saveReview() {
    if (!item || saving) return;
    setSaving(true);
    try {
      const reviewedText = draft.trim();
      await updateDocumentOcrText(db, item.id, reviewedText);
      allowLeave.current = true;
      router.replace({
        pathname: "/documents/medical-review",
        params: { id: String(item.id) },
      });
    } catch (error) {
      Alert.alert(
        "Không thể lưu OCR",
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu.",
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmRerun() {
    if (!item) return;
    if (!isDirty) {
      runOcr(item);
      return;
    }
    Alert.alert(
      "Quét lại tài liệu?",
      "Các chỉnh sửa chưa lưu trong bản review sẽ bị thay thế.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Quét lại", onPress: () => runOcr(item) },
      ],
    );
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SPRINT 4.1 · OFFLINE</Text>
          <Text style={styles.title}>Kiểm tra nội dung OCR</Text>
          <Text style={styles.subtitle}>
            Sửa các ký tự nhận dạng chưa đúng trước khi lưu. Nội dung không rời
            khỏi thiết bị.
          </Text>
        </View>

        {item && (
          <View style={styles.documentCard}>
            {item.type === "image" ? (
              <Image
                source={{ uri: previewUri ?? item.file_path }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfText}>PDF</Text>
              </View>
            )}
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={2}>
                {item.file_name}
              </Text>
              <Text style={styles.patient}>Bệnh nhân: {item.patient_name}</Text>
            </View>
          </View>
        )}

        {(state === "loading" || state === "scanning") && (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.statusTitle}>
              {state === "scanning"
                ? "Đang nhận dạng trên thiết bị…"
                : "Đang mở tài liệu…"}
            </Text>
            <Text style={styles.statusText}>
              PDF nhiều trang có thể cần thêm thời gian.
            </Text>
          </View>
        )}

        {state === "error" && (
          <View style={[styles.statusCard, styles.errorCard]}>
            <Text style={styles.errorTitle}>Không thể chuẩn bị bản review</Text>
            <Text style={styles.statusText}>{errorMessage}</Text>
            {item && (
              <Pressable
                style={styles.retryButton}
                onPress={() => runOcr(item)}
              >
                <Text style={styles.retryText}>Thử quét lại</Text>
              </Pressable>
            )}
          </View>
        )}

        {state === "ready" && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.label}>VĂN BẢN NHẬN DẠNG</Text>
                <Text style={styles.counter}>
                  {draft.length.toLocaleString("vi-VN")} ký tự
                </Text>
              </View>
              {draft !== originalText && (
                <View style={styles.changedBadge}>
                  <Text style={styles.changedText}>CHƯA LƯU</Text>
                </View>
              )}
            </View>
            <TextInput
              style={styles.editor}
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect={false}
              placeholder="Không tìm thấy văn bản. Bạn có thể nhập nội dung thủ công tại đây."
              accessibilityLabel="Nội dung OCR cần review"
            />
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setDraft(originalText)}
                disabled={draft === originalText}
              >
                <Text
                  style={[
                    styles.secondaryText,
                    draft === originalText && styles.mutedText,
                  ]}
                >
                  Hoàn tác
                </Text>
              </Pressable>
              {item && (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={confirmRerun}
                >
                  <Text style={styles.secondaryText}>Quét lại</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.saveButton, saving && styles.disabled]}
              onPress={saveReview}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Lưu nội dung đã review</Text>
              )}
            </Pressable>
            <Text style={styles.saveHint}>
              Sau khi lưu, ứng dụng sẽ tìm chỉ số y khoa để bạn review trước khi
              tạo dữ liệu.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 18, paddingBottom: 48, gap: 14 },
  hero: { backgroundColor: "#0F172A", borderRadius: 22, padding: 20 },
  eyebrow: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 6 },
  subtitle: { color: "#CBD5E1", fontSize: 12, lineHeight: 18, marginTop: 8 },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 17,
    padding: 11,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  pdfBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfText: { color: "#DC2626", fontWeight: "900" },
  documentInfo: { flex: 1 },
  documentName: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
  patient: { color: "#64748B", fontSize: 11, marginTop: 5 },
  statusCard: {
    minHeight: 220,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  statusText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  errorCard: { borderColor: "#FECACA", backgroundColor: "#FFF7F7" },
  errorTitle: { color: "#B91C1C", fontSize: 16, fontWeight: "900" },
  retryButton: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryText: { color: "#fff", fontWeight: "900" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  counter: { color: "#94A3B8", fontSize: 10, marginTop: 3 },
  changedBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  changedText: { color: "#B45309", fontSize: 9, fontWeight: "900" },
  editor: {
    minHeight: 360,
    backgroundColor: "#fff",
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 17,
    padding: 15,
    fontSize: 14,
    lineHeight: 21,
  },
  actionsRow: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#1D4ED8", fontSize: 12, fontWeight: "900" },
  mutedText: { color: "#94A3B8" },
  saveButton: {
    minHeight: 52,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  saveHint: { color: "#64748B", fontSize: 10, textAlign: "center" },
  disabled: { opacity: 0.55 },
  cancelText: { color: "#2563EB", fontSize: 15, fontWeight: "800" },
});
