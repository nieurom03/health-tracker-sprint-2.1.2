import type { SQLiteDatabase } from 'expo-sqlite';
import type { Patient } from '@/types/health';

export async function listPatients(db: SQLiteDatabase) {
  return db.getAllAsync<Patient>('SELECT * FROM patients ORDER BY name COLLATE NOCASE');
}

export async function getPatient(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Patient>('SELECT * FROM patients WHERE id = ?', id);
}

export async function createPatient(
  db: SQLiteDatabase,
  input: { name: string; dob?: string; gender?: string; bloodType?: string; notes?: string }
) {
  const result = await db.runAsync(
    `INSERT INTO patients(name, dob, gender, blood_type, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    input.name.trim(), input.dob || null, input.gender || null, input.bloodType || null, input.notes || null
  );
  return Number(result.lastInsertRowId);
}

export async function updatePatient(
  db: SQLiteDatabase,
  id: number,
  input: { name: string; dob?: string; gender?: string; bloodType?: string; notes?: string }
) {
  await db.runAsync(
    `UPDATE patients
     SET name = ?, dob = ?, gender = ?, blood_type = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    input.name.trim(),
    input.dob?.trim() || null,
    input.gender?.trim() || null,
    input.bloodType?.trim().toUpperCase() || null,
    input.notes?.trim() || null,
    id
  );
}

export async function deletePatient(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM patients WHERE id = ?', id);
}

export async function getSelectedPatientId(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM app_settings WHERE key = 'selected_patient_id'`
  );
  if (row?.value) return Number(row.value);
  const first = await db.getFirstAsync<{ id: number }>('SELECT id FROM patients ORDER BY id LIMIT 1');
  return first?.id ?? null;
}

export async function setSelectedPatientId(db: SQLiteDatabase, id: number) {
  await db.runAsync(
    `INSERT INTO app_settings(key, value) VALUES('selected_patient_id', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    String(id)
  );
}
