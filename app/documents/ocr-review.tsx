import { useThemedStyles } from "@/hooks/useTheme";
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
import Constants from "expo-constants";
import { useSQLiteContext } from "expo-sqlite";

import {
  getDocument,
  updateDocumentOcrText,
} from "@/database/repositories/documentRepository";
import type { HealthDocument } from "@/types/health";
import { parseDocumentMetadata } from "@/utils/documentMetadataParser";
import { materializeDocument } from "@/utils/protectedFile";

type ReviewState = "loading" | "scanning" | "ready" | "error";

export default function OcrReviewScreen() {
  const styles = useThemedStyles(baseStyles);
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
      if (Constants.appOwnership === "expo") {
        throw new Error(
          "OCR không chạy trong Expo Go. Hãy mở ứng dụng Health Tracker development build đã cài trên thiết bị.",
        );
      }
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
      const primaryOptions = {
        languages: [],
        recognitionLevel: document.type === "pdf" ? ("line" as const) : ("word" as const),
        useFastRecognition: false,
        pdfDpi: 400,
        preprocessImages: false,
      };
      const attempt = async (options: Parameters<typeof recognizeText>[1]) => {
        try {
          return await recognizeText(uri, options);
        } catch {
          return null;
        }
      };
      let result = await attempt(primaryOptions);
      const primaryText = result?.success ? (result.fullText?.trim() ?? "") : "";
      if (!result?.success || primaryText.length < 40) {
        const fallback = await attempt({
          ...primaryOptions,
          pdfDpi: document.type === "pdf" ? 550 : 400,
          recognitionLevel: "line",
          preprocessImages: true,
        });
        if (fallback?.success && (fallback.fullText?.trim().length ?? 0) > primaryText.length) {
          result = fallback;
        }
      }
      if (!result?.success) {
        throw new Error("Không nhận dạng được tài liệu sau hai lần thử.");
      }
      setDraft(result.fullText?.trim() ?? "");
      setState("ready");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "File không còn tồn tại hoặc không đọc được.";
      setErrorMessage(
        message.includes("doesn't seem to be linked")
          ? "Bản ứng dụng hiện tại chưa chứa mô-đun OCR. Hãy cài lại Health Tracker development build, không mở dự án bằng Expo Go."
          : message,
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
      const metadata = parseDocumentMetadata(reviewedText);
      await updateDocumentOcrText(db, item.id, reviewedText, metadata);
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
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>OCR</Text><Text style={styles.heroBadgeCaption}>OFFLINE · TRÊN THIẾT BỊ</Text></View>
          <Text style={styles.title}>Review văn bản</Text>
          <Text style={styles.subtitle}>
            Kiểm tra và sửa nội dung nhận dạng trước khi lưu. Dữ liệu không rời khỏi thiết bị.
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressStep}><View style={styles.progressDot}><Text style={styles.progressDotText}>1</Text></View><Text style={styles.progressText}>Tài liệu</Text></View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}><View style={[styles.progressDot, styles.progressDotActive]}><Text style={styles.progressDotText}>2</Text></View><Text style={styles.progressTextActive}>OCR</Text></View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}><View style={styles.progressDot}><Text style={styles.progressDotText}>3</Text></View><Text style={styles.progressText}>Chỉ số</Text></View>
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
            <View style={styles.editorCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.label}>VĂN BẢN NHẬN DẠNG</Text>
                  <Text style={styles.counter}>
                    {draft.length.toLocaleString("vi-VN")} ký tự · Có thể chỉnh sửa
                  </Text>
                </View>
                {draft !== originalText && (
                  <View style={styles.changedBadge}>
                    <Text style={styles.changedText}>CHƯA LƯU</Text>
                  </View>
                )}
              </View>
              <View style={styles.editorFrame}>
                <TextInput
                  style={styles.editor}
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  placeholder="Không tìm thấy văn bản. Bạn có thể nhập nội dung thủ công tại đây."
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel="Nội dung OCR cần review"
                />
              </View>
              <Text style={styles.editorHint}>
                Đối chiếu với tài liệu gốc trước khi lưu để hạn chế sai sót nhận dạng.
              </Text>
            </View>
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

const baseStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 18, paddingBottom: 48, gap: 14 },
  hero: { backgroundColor: "#0F172A", borderRadius: 22, padding: 20 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  heroBadgeText: { color: "#0F172A", backgroundColor: "#93C5FD", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroBadgeCaption: { color: "#93C5FD", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  eyebrow: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 6 },
  subtitle: { color: "#CBD5E1", fontSize: 12, lineHeight: 18, marginTop: 8 },
  progressCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 13, paddingVertical: 11 },
  progressStep: { alignItems: "center", gap: 4 },
  progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  progressDotActive: { backgroundColor: "#2563EB" },
  progressDotText: { color: "#64748B", fontSize: 10, fontWeight: "900" },
  progressText: { color: "#94A3B8", fontSize: 9, fontWeight: "800" },
  progressTextActive: { color: "#2563EB", fontSize: 9, fontWeight: "900" },
  progressLine: { flex: 1, height: 1, backgroundColor: "#CBD5E1", marginHorizontal: 7, marginBottom: 14 },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 17,
    padding: 11,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
  editorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
    minHeight: 390,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    padding: 14,
    fontSize: 14.5,
    lineHeight: 22,
  },
  editorFrame: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 15,
    overflow: "hidden",
  },
  editorHint: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  secondaryText: { color: "#1D4ED8", fontSize: 12, fontWeight: "900" },
  mutedText: { color: "#94A3B8" },
  saveButton: {
    minHeight: 52,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  saveHint: { color: "#64748B", fontSize: 10, textAlign: "center" },
  disabled: { opacity: 0.55 },
  cancelText: { color: "#2563EB", fontSize: 15, fontWeight: "800" },
});
