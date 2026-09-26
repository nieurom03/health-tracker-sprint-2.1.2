import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as LocalAuthentication from "expo-local-authentication";
import { SafeAreaView } from "react-native-safe-area-context";
import GlassCard from "@/components/GlassCard";
import AmbientBackground from "@/components/AmbientBackground";
import {
  getPatient,
  getSelectedPatientId,
} from "@/database/repositories/patientRepository";
import {
  getSetting,
  setSetting,
} from "@/database/repositories/settingsRepository";
import type { Patient } from "@/types/health";
import { createEncryptedBackup, pickAndRestoreBackup } from "@/utils/backup";
import AppIcon from "@/components/AppIcon";

const featureLinks = [
  {
    title: "Hồ sơ bệnh án",
    description: "Chẩn đoán, tiền sử, dị ứng, toa thuốc và các lần khám.",
    route: "/clinical",
  },
  {
    title: "Thuốc đang dùng",
    description: "Theo dõi liều, lịch dùng, thời gian và tác dụng phụ.",
    route: "/medications",
  },
  {
    title: "Health Insights",
    description: "Nhận biết xu hướng và chỉ số ngoài khoảng tham chiếu.",
    route: "/insights",
  },
  {
    title: "Báo cáo sức khỏe",
    description: "Tổng hợp 1/3/6/12 tháng và xuất PDF, CSV hoặc ZIP.",
    route: "/reports",
  },
  {
    title: "Nhắc lịch",
    description: "Nhắc uống thuốc, đo chỉ số, tái khám và xét nghiệm.",
    route: "/reminders",
  },
] as const;

export default function MoreScreen() {
  const s = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [biometric, setBiometric] = useState(false);
  const [timeout, setTimeoutValue] = useState("60");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const id = await getSelectedPatientId(db);
    const [p, b, t] = await Promise.all([
      id ? getPatient(db, id) : Promise.resolve(null),
      getSetting(db, "biometric_lock_enabled"),
      getSetting(db, "auto_lock_seconds"),
    ]);
    setPatient(p);
    setBiometric(b === "1");
    setTimeoutValue(t || "60");
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleBiometric(value: boolean) {
    if (value) {
      const [hardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hardware || !enrolled)
        return Alert.alert(
          "Chưa thể bật",
          "Thiết bị cần có Face ID/Touch ID hoặc sinh trắc học đã đăng ký.",
        );
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Xác nhận bật khóa Health Tracker",
        disableDeviceFallback: false,
      });
      if (!result.success) return;
    }
    await setSetting(db, "biometric_lock_enabled", value ? "1" : "0");
    setBiometric(value);
    Alert.alert(
      value ? "Đã bật khóa" : "Đã tắt khóa",
      value
        ? "Khóa sinh trắc học áp dụng từ lần mở ứng dụng tiếp theo."
        : "Ứng dụng sẽ không yêu cầu xác thực ở lần mở tiếp theo.",
    );
  }

  async function chooseTimeout(value: string) {
    await setSetting(db, "auto_lock_seconds", value);
    setTimeoutValue(value);
  }

  function validPassword() {
    if (password.length < 8) {
      Alert.alert(
        "Mật khẩu quá ngắn",
        "Dùng ít nhất 8 ký tự để bảo vệ bản backup.",
      );
      return false;
    }
    if (password !== confirm) {
      Alert.alert("Mật khẩu không khớp", "Nhập lại cùng một mật khẩu ở hai ô.");
      return false;
    }
    return true;
  }

  async function backup() {
    if (!validPassword()) return;
    setBusy("backup");
    try {
      await createEncryptedBackup(db, password);
      Alert.alert(
        "Đã tạo backup",
        "File backup được mã hóa bằng mật khẩu bạn vừa nhập. Hãy cất mật khẩu riêng vì ứng dụng không thể khôi phục nếu quên.",
      );
    } catch (e) {
      Alert.alert(
        "Không thể backup",
        e instanceof Error ? e.message : "Đã xảy ra lỗi.",
      );
    } finally {
      setBusy("");
    }
  }

  function restore() {
    if (!validPassword()) return;
    Alert.alert(
      "Khôi phục toàn bộ dữ liệu?",
      "Dữ liệu hiện tại sẽ được thay bằng nội dung trong file backup. Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chọn file và khôi phục",
          style: "destructive",
          onPress: async () => {
            setBusy("restore");
            try {
              const done = await pickAndRestoreBackup(db, password);
              if (done) {
                await load();
                Alert.alert(
                  "Khôi phục thành công",
                  "Bệnh nhân, chỉ số, tài liệu và cài đặt đã được phục hồi. Hãy mở lại ứng dụng để nạp đầy đủ thay đổi.",
                );
              }
            } catch (e) {
              Alert.alert(
                "Không thể khôi phục",
                e instanceof Error
                  ? e.message
                  : "Sai mật khẩu hoặc file không hợp lệ.",
              );
            } finally {
              setBusy("");
            }
          },
        },
      ],
    );
  }

  const open = (route: string) => {
    if (!patient)
      return Alert.alert(
        "Chưa có bệnh nhân",
        "Hãy tạo và chọn một bệnh nhân trước.",
      );
    router.push({
      pathname: route as never,
      params: { patientId: String(patient.id) },
    });
  };

  return (
    <SafeAreaView style={s.safeArea} edges={["top", "left", "right"]}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={[s.page, { paddingBottom: 130 }]}>
        <GlassCard variant="darkHero" style={s.hero} borderRadius={24}>
          <Text style={s.eyebrow}>TRUNG TÂM SỨC KHỎE</Text>
          <Text style={s.h1}>Thêm</Text>
          <Text style={s.sub}>
            {patient
              ? `Đang quản lý dữ liệu của ${patient.name}.`
              : "Chưa có bệnh nhân được chọn."}
          </Text>
        </GlassCard>

        <Text style={s.section}>Hồ sơ & phân tích</Text>
        {featureLinks.map((x) => (
          <GlassCard
            key={x.route}
            style={s.link}
            borderRadius={16}
            onPress={() => open(x.route)}
          >
            <View style={s.linkBody}>
              <Text style={s.linkTitle}>{x.title}</Text>
              <Text style={s.desc}>{x.description}</Text>
            </View>
            <AppIcon
              ios="chevron.right"
              android="chevron_right"
              size={17}
              color="#94A3B8"
            />
          </GlassCard>
        ))}

        <Text style={s.section}>Bảo mật trên thiết bị</Text>
        <GlassCard style={s.panel} borderRadius={18}>
          <View style={s.switchRow}>
            <View style={s.linkBody}>
              <Text style={s.linkTitle}>Khóa sinh trắc học</Text>
              <Text style={s.desc}>
                Yêu cầu Face ID/Touch ID hoặc mật mã thiết bị khi mở hồ sơ.
              </Text>
            </View>
            <Switch
              value={biometric}
              onValueChange={toggleBiometric}
              trackColor={{ true: "#93C5FD" }}
            />
          </View>
          <Text style={s.smallTitle}>TỰ KHÓA SAU KHI RỜI ỨNG DỤNG</Text>
          <View style={s.timeouts}>
            {[
              ["0", "Không khóa"],
              ["15", "15 giây"],
              ["60", "1 phút"],
              ["300", "5 phút"],
            ].map(([v, n]) => (
              <Pressable
                key={v}
                style={[s.timeout, timeout === v && s.timeoutOn]}
                onPress={() => chooseTimeout(v)}
              >
                <Text style={[s.timeoutText, timeout === v && s.timeoutTextOn]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.securityNote}>
            Cơ sở dữ liệu dùng SQLCipher; ảnh và PDF được mã hóa riêng trên
            thiết bị. Bản xem tạm chỉ nằm trong cache hệ thống.
          </Text>
        </GlassCard>

        <Text style={s.section}>Backup / Restore có mã hóa</Text>
        <GlassCard style={s.panel} borderRadius={18}>
          <Text style={s.desc}>
            Backup gom SQLite và tài liệu vào một file được mã hóa. Mật khẩu
            không được lưu, nên hãy ghi nhớ trước khi khôi phục.
          </Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mật khẩu backup (ít nhất 8 ký tự)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
          />
          <View style={s.buttons}>
            <Pressable style={s.primary} onPress={backup} disabled={!!busy}>
              {busy === "backup" ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={s.primaryText}>Tạo backup</Text>
              )}
            </Pressable>
            <Pressable style={s.secondary} onPress={restore} disabled={!!busy}>
              {busy === "restore" ? (
                <ActivityIndicator color="#2563EB" />
              ) : (
                <Text style={s.secondaryText}>Khôi phục</Text>
              )}
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  page: { padding: 18, paddingBottom: 48, gap: 10 },
  hero: { padding: 22 },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  h1: { fontSize: 29, fontWeight: "900", color: "white", marginTop: 4 },
  sub: { color: "#CBD5E1", marginTop: 5 },
  section: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 12,
  },
  link: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  linkBody: { flex: 1, paddingRight: 10 },
  linkTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  desc: { color: "#64748B", fontSize: 11, lineHeight: 17, marginTop: 4 },
  panel: { padding: 15, gap: 12 },
  switchRow: { flexDirection: "row", alignItems: "center" },
  smallTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.7,
  },
  timeouts: { flexDirection: "row", gap: 7 },
  timeout: {
    flex: 1,
    alignItems: "center",
    padding: 9,
    borderRadius: 11,
    backgroundColor: "rgba(241, 245, 249, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.7)",
  },
  timeoutOn: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  timeoutText: { fontSize: 11, fontWeight: "900", color: "#475569" },
  timeoutTextOn: { color: "white" },
  securityNote: {
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    color: "#1E40AF",
    fontSize: 10,
    lineHeight: 16,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.7)",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 13,
    padding: 13,
    fontSize: 14,
    color: "#0F172A",
  },
  buttons: { flexDirection: "row", gap: 9 },
  primary: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primaryText: { color: "white", fontWeight: "900" },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(147, 197, 253, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
  },
  secondaryText: { color: "#2563EB", fontWeight: "900" },
});
