import { useThemedStyles } from "@/hooks/useTheme";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import GenderField from "@/components/form/GenderField";
import PatientDateField from "@/components/form/PatientDateField";
import {
  createPatient,
  setSelectedPatientId,
} from "@/database/repositories/patientRepository";

export default function NewPatientScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [blood, setBlood] = useState("");
  const [notes, setNotes] = useState("");
  async function save() {
    if (!name.trim())
      return Alert.alert("Thiếu tên", "Vui lòng nhập tên bệnh nhân.");
    const id = await createPatient(db, {
      name,
      dob,
      gender,
      bloodType: blood,
      notes,
    });
    await setSelectedPatientId(db, id);
    router.back();
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Họ tên *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nguyễn Văn A"
        />
        <Text style={styles.label}>Ngày sinh</Text>
        <PatientDateField value={dob} onChange={setDob} />
        <Text style={styles.label}>Giới tính</Text>
        <GenderField value={gender} onChange={setGender} />
        <Text style={styles.label}>Nhóm máu</Text>
        <TextInput
          style={styles.input}
          value={blood}
          onChangeText={setBlood}
          placeholder="O+"
          autoCapitalize="characters"
        />
        <Text style={styles.label}>Ghi chú</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Tiền sử, lưu ý..."
          multiline
        />
        <Pressable style={styles.primary} onPress={save}>
          <Text style={styles.primaryText}>Lưu bệnh nhân</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const baseStyles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 8,
    backgroundColor: "#F6F8FB",
    minHeight: "100%",
  },
  label: { fontSize: 13, fontWeight: "700", color: "#344054", marginTop: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  multiline: { height: 110, textAlignVertical: "top" },
  primary: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
});
