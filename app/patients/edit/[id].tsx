import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import GenderField from '@/components/form/GenderField';
import PatientDateField from '@/components/form/PatientDateField';
import { getPatient, updatePatient } from '@/database/repositories/patientRepository';

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = Number(id);
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [blood, setBlood] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    getPatient(db, patientId).then(patient => {
      if (!active) return;
      if (patient) {
        setName(patient.name);
        setDob(patient.dob || '');
        setGender(patient.gender || '');
        setBlood(patient.blood_type || '');
        setNotes(patient.notes || '');
      }
      setLoading(false);
    }).catch(error => {
      if (!active) return;
      setLoading(false);
      Alert.alert('Không thể mở hồ sơ', error instanceof Error ? error.message : 'Đã xảy ra lỗi.');
    });
    return () => { active = false; };
  }, [db, patientId]);

  async function save() {
    if (!name.trim()) return Alert.alert('Thiếu họ tên', 'Vui lòng nhập họ tên người bệnh.');
    setSaving(true);
    try {
      await updatePatient(db, patientId, { name, dob, gender, bloodType: blood, notes });
      router.back();
    } catch (error) {
      Alert.alert('Không thể cập nhật', error instanceof Error ? error.message : 'Đã xảy ra lỗi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#2563EB" /></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.help}>Chỉnh sửa thông tin nhận diện và ghi chú của người bệnh. Dữ liệu đo và tài liệu đã gắn sẽ không bị thay đổi.</Text>
      <Text style={styles.label}>Họ tên *</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" autoFocus />
      <Text style={styles.label}>Ngày sinh</Text><PatientDateField value={dob} onChange={setDob} />
      <Text style={styles.label}>Giới tính</Text><GenderField value={gender} onChange={setGender} />
      <Text style={styles.label}>Nhóm máu</Text><TextInput style={styles.input} value={blood} onChangeText={setBlood} placeholder="O+" autoCapitalize="characters" />
      <Text style={styles.label}>Ghi chú</Text><TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes} placeholder="Tiền sử, lưu ý..." multiline />
      <Pressable style={[styles.primary, saving && styles.disabled]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Lưu thay đổi</Text>}</Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8FB' },
  container: { padding: 18, paddingBottom: 42, gap: 8 },
  help: { color: '#64748B', backgroundColor: '#EFF6FF', borderRadius: 13, padding: 13, lineHeight: 20, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#344054', marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  multiline: { height: 110, textAlignVertical: 'top' },
  primary: { marginTop: 16, backgroundColor: '#2563EB', padding: 16, borderRadius: 14, alignItems: 'center' },
  disabled: { opacity: 0.65 },
  primaryText: { color: '#fff', fontWeight: '800' },
});
