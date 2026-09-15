import type { SQLiteDatabase } from 'expo-sqlite';
import type { Medication } from '@/types/health';

export async function listMedications(db: SQLiteDatabase, patientId: number) {
  return db.getAllAsync<Medication>(
    `SELECT * FROM medications WHERE patient_id=?
     ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, COALESCE(start_date, created_at) DESC`, patientId,
  );
}

export async function saveMedication(
  db: SQLiteDatabase,
  input: { id?: number; patientId: number; name: string; dosage?: string; frequency?: string; startDate?: string; endDate?: string; status: 'active' | 'stopped'; sideEffects?: string; notes?: string },
) {
  if (input.id) {
    return db.runAsync(
      `UPDATE medications SET name=?, dosage=?, frequency=?, start_date=?, end_date=?, status=?, side_effects=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      input.name.trim(), input.dosage?.trim() || null, input.frequency?.trim() || null,
      input.startDate || null, input.endDate || null, input.status, input.sideEffects?.trim() || null,
      input.notes?.trim() || null, input.id,
    );
  }
  return db.runAsync(
    `INSERT INTO medications(patient_id, name, dosage, frequency, start_date, end_date, status, side_effects, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, input.patientId, input.name.trim(),
    input.dosage?.trim() || null, input.frequency?.trim() || null, input.startDate || null,
    input.endDate || null, input.status, input.sideEffects?.trim() || null, input.notes?.trim() || null,
  );
}

export async function deleteMedication(db: SQLiteDatabase, id: number) {
  return db.runAsync('DELETE FROM medications WHERE id=?', id);
}
