import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSQLiteContext } from "expo-sqlite";
import { getSetting } from "@/database/repositories/settingsRepository";
import { clearMaterializedDocuments } from "@/utils/protectedFile";
import AppIcon from "@/components/AppIcon";

export default function AppLockGate({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const backgroundAt = useRef(0);
  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Mở khóa Health Tracker",
      cancelLabel: "Hủy",
      fallbackLabel: "Dùng mật mã thiết bị",
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
  }, []);
  useEffect(() => {
    Promise.all([
      getSetting(db, "biometric_lock_enabled"),
      getSetting(db, "auto_lock_seconds"),
    ]).then(([on]) => {
      const active = on === "1";
      setEnabled(active);
      setLocked(active);
      setChecking(false);
      if (active) unlock();
    });
  }, [db, unlock]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "background" || state === "inactive") {
        backgroundAt.current = Date.now();
        clearMaterializedDocuments();
      }
      if (state === "active" && enabled) {
        const timeout =
          Number((await getSetting(db, "auto_lock_seconds")) || "60") * 1000;
        if (
          backgroundAt.current &&
          Date.now() - backgroundAt.current >= timeout
        ) {
          setLocked(true);
          unlock();
        }
      }
    });
    return () => sub.remove();
  }, [db, enabled, unlock]);
  if (checking)
    return (
      <View style={s.center}>
        <Text style={s.brand}>Health Tracker</Text>
      </View>
    );
  if (locked)
    return (
      <View style={s.center}>
        <View style={s.lock}>
          <AppIcon ios="lock.shield.fill" android="lock" size={42} color="#60A5FA" />
          <Text style={s.title}>Hồ sơ đang khóa</Text>
          <Text style={s.text}>
            Xác thực bằng sinh trắc học hoặc mật mã thiết bị để tiếp tục.
          </Text>
          <Pressable style={s.button} onPress={unlock}>
            <Text style={s.buttonText}>Mở khóa</Text>
          </Pressable>
        </View>
      </View>
    );
  return children;
}
const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brand: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  lock: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 26,
    padding: 26,
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 12 },
  text: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "900" },
});
