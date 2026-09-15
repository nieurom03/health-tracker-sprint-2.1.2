import type { SQLiteDatabase } from 'expo-sqlite';
import type { HealthReminder, ReminderKind, RepeatRule } from '@/types/health';

export const REMINDER_KINDS: { key: ReminderKind; name: string }[] = [
  { key: 'medication', name: 'Uống thuốc' },
  { key: 'blood_pressure', name: 'Đo huyết áp' },
  { key: 'glucose', name: 'Đo đường huyết' },
  { key: 'appointment', name: 'Tái khám' },
  { key: 'lab', name: 'Xét nghiệm định kỳ' },
];

export async function listReminders(db: SQLiteDatabase, patientId?: number) {
  const where = patientId ? 'WHERE r.patient_id=?' : '';
  return db.getAllAsync<HealthReminder>(
    `SELECT r.*, p.name AS patient_name FROM reminders r JOIN patients p ON p.id=r.patient_id
     ${where} ORDER BY r.enabled DESC, r.scheduled_at ASC`, ...(patientId ? [patientId] : []),
  );
}

export async function createReminder(db: SQLiteDatabase, input: { patientId: number; kind: ReminderKind; title: string; notes?: string; scheduledAt: string; repeatRule: RepeatRule; notificationId?: string }) {
  return db.runAsync(
    `INSERT INTO reminders(patient_id, kind, title, notes, scheduled_at, repeat_rule, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, input.patientId, input.kind, input.title.trim(),
    input.notes?.trim() || null, input.scheduledAt, input.repeatRule, input.notificationId || null,
  );
}

export async function setReminderEnabled(db: SQLiteDatabase, id: number, enabled: boolean, notificationId?: string | null) {
  return db.runAsync(
    `UPDATE reminders SET enabled=?, notification_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    enabled ? 1 : 0, notificationId || null, id,
  );
}

export async function deleteReminder(db: SQLiteDatabase, id: number) {
  return db.runAsync('DELETE FROM reminders WHERE id=?', id);
}
