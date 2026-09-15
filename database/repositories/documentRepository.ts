import type { SQLiteDatabase } from 'expo-sqlite';

import type { HealthDocument } from '@/types/health';

export const DOCUMENT_CATEGORIES = [
  { key: 'lab_result', name: 'Phiếu xét nghiệm' },
  { key: 'prescription', name: 'Đơn thuốc' },
  { key: 'xray', name: 'X-quang' },
  { key: 'imaging', name: 'Chẩn đoán hình ảnh' },
  { key: 'visit_note', name: 'Phiếu khám' },
  { key: 'discharge', name: 'Giấy ra viện' },
  { key: 'other', name: 'Khác' },
] as const;

export function documentCategoryName(category: string | null) {
  return DOCUMENT_CATEGORIES.find(item => item.key === category)?.name ?? 'Chưa phân loại';
}

export async function listDocuments(db: SQLiteDatabase, patientId?: number | null) {
  const where = patientId ? 'WHERE d.patient_id = ?' : '';
  const params = patientId ? [patientId] : [];

  return db.getAllAsync<HealthDocument>(
    `SELECT d.id, d.patient_id, p.name AS patient_name, d.type, d.file_name,
       d.file_path, d.ocr_text, d.document_date, d.category, d.hospital,
       d.doctor, d.notes, d.created_at, d.updated_at,
       (SELECT COUNT(*) FROM lab_results l WHERE l.document_id = d.id) AS parsed_count
     FROM documents d
     JOIN patients p ON p.id = d.patient_id
     ${where}
     ORDER BY d.created_at DESC`,
    ...params,
  );
}

export async function getDocument(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<HealthDocument>(
    `SELECT d.id, d.patient_id, p.name AS patient_name, d.type, d.file_name,
       d.file_path, d.ocr_text, d.document_date, d.category, d.hospital,
       d.doctor, d.notes, d.created_at, d.updated_at,
       (SELECT COUNT(*) FROM lab_results l WHERE l.document_id = d.id) AS parsed_count
     FROM documents d
     JOIN patients p ON p.id = d.patient_id
     WHERE d.id = ?`,
    id,
  );
}

export async function createDocument(
  db: SQLiteDatabase,
  input: {
    patientId: number;
    type: 'image' | 'pdf';
    fileName: string;
    filePath: string;
  },
) {
  const result = await db.runAsync(
    `INSERT INTO documents(patient_id, type, file_name, file_path)
     VALUES (?, ?, ?, ?)`,
    input.patientId,
    input.type,
    input.fileName,
    input.filePath,
  );
  return Number(result.lastInsertRowId);
}

export async function updateDocument(
  db: SQLiteDatabase,
  id: number,
  input: {
    fileName: string;
    category?: string;
    documentDate?: string;
    hospital?: string;
    doctor?: string;
    notes?: string;
  },
) {
  return db.runAsync(
    `UPDATE documents
     SET file_name = ?, category = ?, document_date = ?, hospital = ?, doctor = ?,
       notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    input.fileName.trim(),
    input.category || null,
    input.documentDate || null,
    input.hospital?.trim() || null,
    input.doctor?.trim() || null,
    input.notes?.trim() || null,
    id,
  );
}

export async function deleteDocument(db: SQLiteDatabase, id: number) {
  return db.runAsync('DELETE FROM documents WHERE id = ?', id);
}

export async function updateDocumentOcrText(
  db: SQLiteDatabase,
  id: number,
  rawText: string,
) {
  return db.runAsync(
    `UPDATE documents
     SET ocr_text = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    rawText,
    id,
  );
}
