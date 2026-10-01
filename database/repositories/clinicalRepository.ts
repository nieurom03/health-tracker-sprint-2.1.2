import type { SQLiteDatabase } from 'expo-sqlite';
import type { ClinicalEntry, ClinicalKind } from '@/types/health';

export const CLINICAL_KINDS: { key: ClinicalKind; name: string; hint: string }[] = [
  { key: 'diagnosis', name: 'Chẩn đoán', hint: 'Bệnh hoặc tình trạng đã được chẩn đoán' },
  { key: 'history', name: 'Tiền sử bệnh', hint: 'Bệnh từng mắc, phẫu thuật hoặc yếu tố gia đình' },
  { key: 'allergy', name: 'Dị ứng', hint: 'Thuốc, thức ăn hoặc tác nhân gây dị ứng' },
  { key: 'prescription', name: 'Toa thuốc', hint: 'Thông tin toa thuốc từ lần khám' },
  { key: 'visit', name: 'Lần khám', hint: 'Lý do khám và kết luận của bác sĩ' },
];

export async function listClinicalEntries(db: SQLiteDatabase, patientId: number) {
  return db.getAllAsync<ClinicalEntry>(
    `SELECT * FROM clinical_entries WHERE patient_id = ?
     ORDER BY COALESCE(event_date, created_at) DESC, id DESC`, patientId,
  );
}

export async function saveClinicalEntry(
  db: SQLiteDatabase,
  input: { id?: number; patientId: number; kind: ClinicalKind; title: string; content?: string; interpretation?: string; symptoms?: string; details?: string; eventDate?: string; facility?: string; clinician?: string },
) {
  if (input.id) {
    return db.runAsync(
      `UPDATE clinical_entries SET kind=?, title=?, content=?, interpretation=?, symptoms=?, details=?, event_date=?, facility=?, clinician=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      input.kind, input.title.trim(), input.content?.trim() || null,
      input.interpretation?.trim() || null, input.symptoms?.trim() || null,
      input.details?.trim() || null, input.eventDate || null,
      input.facility?.trim() || null, input.clinician?.trim() || null, input.id,
    );
  }
  return db.runAsync(
    `INSERT INTO clinical_entries(patient_id, kind, title, content, interpretation, symptoms, details, event_date, facility, clinician)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, input.patientId, input.kind, input.title.trim(),
    input.content?.trim() || null, input.interpretation?.trim() || null,
    input.symptoms?.trim() || null, input.details?.trim() || null,
    input.eventDate || null, input.facility?.trim() || null,
    input.clinician?.trim() || null,
  );
}

export async function upsertDocumentClinicalEntry(
  db: SQLiteDatabase,
  input: {
    documentId: number;
    patientId: number;
    title: string;
    content: string;
    interpretation?: string;
    symptoms?: string;
    details?: string;
    eventDate: string;
    facility?: string;
    clinician?: string;
  },
) {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM clinical_entries WHERE document_id = ?',
    input.documentId,
  );
  if (existing) {
    return db.runAsync(
      `UPDATE clinical_entries
       SET patient_id=?, kind='visit', title=?, content=?, interpretation=?, symptoms=?,
         details=?, event_date=?, facility=?, clinician=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      input.patientId, input.title.trim(), input.content.trim(),
      input.interpretation?.trim() || null, input.symptoms?.trim() || null,
      input.details?.trim() || null, input.eventDate,
      input.facility?.trim() || null, input.clinician?.trim() || null,
      existing.id,
    );
  }
  return db.runAsync(
    `INSERT INTO clinical_entries(
       patient_id, document_id, kind, title, content, interpretation, symptoms,
       details, event_date, facility, clinician
     ) VALUES (?, ?, 'visit', ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.patientId, input.documentId, input.title.trim(), input.content.trim(),
    input.interpretation?.trim() || null, input.symptoms?.trim() || null,
    input.details?.trim() || null, input.eventDate,
    input.facility?.trim() || null, input.clinician?.trim() || null,
  );
}

export async function deleteClinicalEntry(db: SQLiteDatabase, id: number) {
  return db.runAsync('DELETE FROM clinical_entries WHERE id=?', id);
}
