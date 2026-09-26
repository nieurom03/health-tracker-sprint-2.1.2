import { useThemedStyles } from "@/hooks/useTheme";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import AppIcon from '@/components/AppIcon';
import { createDocument } from '@/database/repositories/documentRepository';
import { getSelectedPatientId, listPatients } from '@/database/repositories/patientRepository';
import type { Patient } from '@/types/health';
import { persistDocumentFile, removeStoredDocument } from '@/utils/documentStorage';

type PendingDocument = {
  uri: string;
  name: string;
  mimeType?: string | null;
  type: 'image' | 'pdf';
  size?: number;
};

function imageFileName(fileName?: string | null) {
  return fileName || `anh-tai-lieu-${new Date().toISOString().slice(0, 10)}.jpg`;
}

function formatSize(size?: number) {
  if (!size) return null;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function NewDocumentScreen() {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingDocument | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listPatients(db), getSelectedPatientId(db)]).then(([items, selectedId]) => {
      if (!active) return;
      setPatients(items);
      setPatientId(selectedId ?? items[0]?.id ?? null);
    });
    return () => { active = false; };
  }, [db]);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền camera', 'Hãy cho phép truy cập camera để chụp tài liệu y tế.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPending({ uri: asset.uri, name: imageFileName(asset.fileName), mimeType: asset.mimeType, type: 'image', size: asset.fileSize });
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPending({ uri: asset.uri, name: imageFileName(asset.fileName), mimeType: asset.mimeType, type: 'image', size: asset.fileSize });
  }

  async function choosePdf() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPending({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, type: 'pdf', size: asset.size });
  }

  async function save() {
    if (!patientId) return Alert.alert('Chưa chọn bệnh nhân', 'Hãy chọn bệnh nhân cho tài liệu này.');
    if (!pending) return Alert.alert('Chưa có tài liệu', 'Hãy chụp giấy, chọn ảnh hoặc import PDF.');

    setSaving(true);
    let storedPath: string | null = null;
    try {
      const storedFile = await persistDocumentFile(pending.uri, pending.name, pending.mimeType);
      storedPath = storedFile.uri;
      await createDocument(db, {
        patientId,
        type: pending.type,
        fileName: pending.name,
        filePath: storedFile.uri,
      });
      router.back();
    } catch (error) {
      if (storedPath) removeStoredDocument(storedPath);
      Alert.alert('Không thể lưu tài liệu', error instanceof Error ? error.message : 'Đã xảy ra lỗi khi sao chép file.');
    } finally {
      setSaving(false);
    }
  }

  if (patients.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Cần hồ sơ bệnh nhân</Text>
        <Text style={styles.emptyText}>Tài liệu y tế phải được gắn với một bệnh nhân.</Text>
        <Pressable style={styles.primary} onPress={() => router.replace('/patients/new')}>
          <Text style={styles.primaryText}>+ Thêm bệnh nhân</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>SPRINT 3</Text>
        <Text style={styles.heroTitle}>Thêm tài liệu y tế</Text>
        <Text style={styles.heroText}>File sẽ được sao chép vào vùng lưu trữ nội bộ của ứng dụng.</Text>
      </View>

      <Text style={styles.label}>Gắn với bệnh nhân</Text>
      <View style={styles.chips}>
        {patients.map(patient => (
          <Pressable key={patient.id} style={[styles.chip, patientId === patient.id && styles.chipActive]} onPress={() => setPatientId(patient.id)}>
            <Text style={[styles.chipText, patientId === patient.id && styles.chipTextActive]}>{patient.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Nguồn tài liệu</Text>
      <View style={styles.sourceGrid}>
        <Pressable style={styles.source} onPress={takePhoto}>
          <AppIcon ios="camera.fill" android="photo_camera" size={27} style={styles.sourceSymbol}/><Text style={styles.sourceTitle}>Chụp giấy</Text><Text style={styles.sourceText}>Dùng camera</Text>
        </Pressable>
        <Pressable style={styles.source} onPress={chooseImage}>
          <AppIcon ios="photo.fill.on.rectangle.fill" android="image" size={27} style={styles.sourceSymbol}/><Text style={styles.sourceTitle}>Chọn ảnh</Text><Text style={styles.sourceText}>Từ thư viện</Text>
        </Pressable>
        <Pressable style={styles.source} onPress={choosePdf}>
          <Text style={[styles.sourceIcon, styles.pdf]}>PDF</Text><Text style={styles.sourceTitle}>Import PDF</Text><Text style={styles.sourceText}>Từ ứng dụng Files</Text>
        </Pressable>
      </View>

      {pending && (
        <View style={styles.previewCard}>
          {pending.type === 'image' ? (
            <Image source={{ uri: pending.uri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.pdfPreview}><Text style={styles.pdfPreviewText}>PDF</Text></View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.ready}>SẴN SÀNG LƯU</Text>
            <Text style={styles.fileName} numberOfLines={2}>{pending.name}</Text>
            {formatSize(pending.size) && <Text style={styles.fileSize}>{formatSize(pending.size)}</Text>}
          </View>
          <Pressable onPress={() => setPending(null)}><Text style={styles.remove}>Bỏ</Text></Pressable>
        </View>
      )}

      <Pressable style={[styles.save, (!pending || saving) && styles.disabled]} disabled={!pending || saving} onPress={save}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu vào Document Inbox</Text>}
      </Pressable>
      <Text style={styles.notice}>Dữ liệu chỉ được lưu trên thiết bị. OCR và đọc nội dung tài liệu thuộc các sprint sau.</Text>
    </ScrollView>
  );
}

const baseStyles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 44, gap: 10, backgroundColor: '#F8FAFC', minHeight: '100%' },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F8FAFC' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', lineHeight: 20 },
  hero: { backgroundColor: '#0F172A', borderRadius: 24, padding: 20, marginBottom: 4 },
  heroEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: '#93C5FD' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 5 },
  heroText: { fontSize: 12, lineHeight: 18, color: '#CBD5E1', marginTop: 5 },
  label: { fontSize: 12, fontWeight: '900', color: '#475569', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  chipTextActive: { color: '#fff' },
  sourceGrid: { flexDirection: 'row', gap: 8 },
  source: { flex: 1, minHeight: 112, padding: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  sourceIcon: { fontSize: 25, color: '#2563EB', fontWeight: '900', marginBottom: 7 },
  sourceSymbol: { marginBottom: 7 },
  pdf: { fontSize: 13, color: '#DC2626', backgroundColor: '#FEF2F2', paddingHorizontal: 7, paddingVertical: 6, borderRadius: 7 },
  sourceTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  sourceText: { fontSize: 9, color: '#94A3B8', marginTop: 3, textAlign: 'center' },
  previewCard: { marginTop: 8, padding: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbnail: { width: 58, height: 68, borderRadius: 11, backgroundColor: '#E2E8F0' },
  pdfPreview: { width: 58, height: 68, borderRadius: 11, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  pdfPreviewText: { color: '#DC2626', fontWeight: '900' },
  previewInfo: { flex: 1 },
  ready: { fontSize: 9, color: '#047857', fontWeight: '900', letterSpacing: 0.7 },
  fileName: { fontSize: 13, lineHeight: 17, color: '#0F172A', fontWeight: '900', marginTop: 4 },
  fileSize: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  remove: { color: '#DC2626', fontSize: 12, fontWeight: '900', padding: 6 },
  primary: { backgroundColor: '#2563EB', padding: 16, borderRadius: 15, alignItems: 'center' },
  save: { marginTop: 12, backgroundColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  notice: { fontSize: 10, color: '#94A3B8', lineHeight: 16, textAlign: 'center', marginTop: 3 },
});
