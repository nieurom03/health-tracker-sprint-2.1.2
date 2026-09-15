import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import AppLockGate from "@/components/security/AppLockGate";
import {
  initializeDatabase,
  prepareDatabaseEncryption,
} from "@/database/security";
import { configureNotificationPresentation } from "@/utils/notifications";
import { clearMaterializedDocuments } from "@/utils/protectedFile";

configureNotificationPresentation();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const prepare = () => {
    setReady(false);
    setError("");
    clearMaterializedDocuments();
    prepareDatabaseEncryption()
      .then(() => setReady(true))
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Không thể chuẩn bị kho dữ liệu.",
        ),
      );
  };
  useEffect(prepare, []);
  if (error)
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Không thể mở dữ liệu an toàn</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={prepare}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  if (!ready)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SQLiteProvider
        databaseName="health-tracker.db"
        onInit={initializeDatabase}
      >
        <AppLockGate>
          <Stack
            screenOptions={{
              headerBackTitle: "Quay lại",
              headerTitleStyle: { fontWeight: "900" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="patients/new"
              options={{ title: "Thêm bệnh nhân", presentation: "modal" }}
            />
            <Stack.Screen
              name="patients/[id]"
              options={{ title: "Hồ sơ bệnh nhân" }}
            />
            <Stack.Screen
              name="patients/edit/[id]"
              options={{ title: "Cập nhật người bệnh", presentation: "modal" }}
            />
            <Stack.Screen
              name="records/new"
              options={{ title: "Thêm chỉ số", presentation: "modal" }}
            />
            <Stack.Screen
              name="records/[source]/[id]"
              options={{ title: "Chỉnh sửa chỉ số", presentation: "modal" }}
            />
            <Stack.Screen
              name="documents/new"
              options={{ title: "Thêm tài liệu", presentation: "modal" }}
            />
            <Stack.Screen
              name="documents/[id]"
              options={{ title: "Chi tiết tài liệu" }}
            />
            <Stack.Screen
              name="documents/ocr-review"
              options={{ title: "Review OCR", presentation: "modal" }}
            />
            <Stack.Screen
              name="documents/medical-review"
              options={{ title: "Review chỉ số", presentation: "modal" }}
            />
            <Stack.Screen
              name="trends/[metric]"
              options={{ title: "Xu hướng" }}
            />
            <Stack.Screen
              name="clinical/index"
              options={{ title: "Hồ sơ bệnh án" }}
            />
            <Stack.Screen
              name="medications/index"
              options={{ title: "Thuốc đang dùng" }}
            />
            <Stack.Screen
              name="insights"
              options={{ title: "Health Insights" }}
            />
            <Stack.Screen
              name="reports"
              options={{ title: "Báo cáo sức khỏe" }}
            />
            <Stack.Screen name="reminders" options={{ title: "Nhắc lịch" }} />
          </Stack>
        </AppLockGate>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  errorTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  errorText: { color: "#64748B", textAlign: "center", marginTop: 8 },
  retry: {
    backgroundColor: "#2563EB",
    borderRadius: 13,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 18,
  },
  retryText: { color: "white", fontWeight: "900" },
});
