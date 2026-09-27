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
        <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>OCR</Text><Text style={styles.heroBadgeCaption}>OFFLINE</Text></View>
        <Text style={styles.heroTitle}>Quét tài liệu y tế</Text>
        <Text style={styles.heroText}>Chụp ảnh hoặc chọn PDF. Tài liệu được lưu và nhận dạng ngay trên thiết bị.</Text>
      </View>

      <View style={styles.sectionHeading}><Text style={styles.label}>BỆNH NHÂN</Text><Text style={styles.step}>1 / 2</Text></View>
      <View style={styles.patientCard}>
        <Text style={styles.patientPrompt}>Tài liệu này thuộc hồ sơ nào?</Text>
        <View style={styles.chips}>
          {patients.map(patient => (
            <Pressable key={patient.id} style={[styles.chip, patientId === patient.id && styles.chipActive]} onPress={() => setPatientId(patient.id)}>
              <Text style={[styles.chipText, patientId === patient.id && styles.chipTextActive]}>{patient.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeading}><Text style={styles.label}>CHỌN NGUỒN TÀI LIỆU</Text><Text style={styles.step}>2 / 2</Text></View>
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
      <Text style={styles.notice}>Dữ liệu chỉ được lưu trên thiết bị. Sau khi lưu, bạn có thể mở tài liệu và chạy OCR để kiểm tra, chỉnh sửa trước khi tạo chỉ số.</Text>
    </ScrollView>
  );
}

const baseStyles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 44, gap: 10, backgroundColor: '#F8FAFC', minHeight: '100%' },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F8FAFC' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', lineHeight: 20 },
  hero: { backgroundColor: '#0F172A', borderRadius: 25, padding: 22, marginBottom: 5, shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: 10 },
  heroBadgeText: { color: '#0F172A', backgroundColor: '#93C5FD', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroBadgeCaption: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#93C5FD' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 5 },
  heroText: { fontSize: 12, lineHeight: 18, color: '#CBD5E1', marginTop: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.7 },
  step: { fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  patientCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 10, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  patientPrompt: { color: '#64748B', fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  chipTextActive: { color: '#fff' },
  sourceGrid: { flexDirection: 'row', gap: 8 },
  source: { flex: 1, minHeight: 122, padding: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  sourceIcon: { fontSize: 25, color: '#2563EB', fontWeight: '900', marginBottom: 7 },
  sourceSymbol: { marginBottom: 7 },
  pdf: { fontSize: 13, color: '#DC2626', backgroundColor: '#FEF2F2', paddingHorizontal: 7, paddingVertical: 6, borderRadius: 7 },
  sourceTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  sourceText: { fontSize: 9, color: '#94A3B8', marginTop: 3, textAlign: 'center' },
  previewCard: { marginTop: 8, padding: 13, borderRadius: 18, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#2563EB', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  thumbnail: { width: 58, height: 68, borderRadius: 11, backgroundColor: '#E2E8F0' },
  pdfPreview: { width: 58, height: 68, borderRadius: 11, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  pdfPreviewText: { color: '#DC2626', fontWeight: '900' },
  previewInfo: { flex: 1 },
  ready: { fontSize: 9, color: '#047857', fontWeight: '900', letterSpacing: 0.7 },
  fileName: { fontSize: 13, lineHeight: 17, color: '#0F172A', fontWeight: '900', marginTop: 4 },
  fileSize: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  remove: { color: '#DC2626', fontSize: 12, fontWeight: '900', padding: 6 },
  primary: { backgroundColor: '#2563EB', padding: 16, borderRadius: 15, alignItems: 'center' },
  save: { marginTop: 12, backgroundColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center', minHeight: 54, shadowColor: '#2563EB', shadowOpacity: 0.23, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  notice: { fontSize: 10, color: '#94A3B8', lineHeight: 16, textAlign: 'center', marginTop: 3 },
});
