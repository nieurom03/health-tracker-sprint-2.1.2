import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      blood_type TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT,
      file_name TEXT,
      file_path TEXT,
      ocr_text TEXT,
      document_date TEXT,
      category TEXT,
      hospital TEXT,
      doctor TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lab_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      document_id INTEGER,
      test_code TEXT,
      test_name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      reference_min REAL,
      reference_max REAL,
      tested_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS vital_signs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      value1 REAL NOT NULL,
      value2 REAL,
      unit TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      side_effects TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clinical_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      document_id INTEGER,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      interpretation TEXT,
      symptoms TEXT,
      details TEXT,
      event_date TEXT,
      facility TEXT,
      clinician TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      scheduled_at TEXT NOT NULL,
      repeat_rule TEXT NOT NULL DEFAULT 'none',
      notification_id TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_lab_patient_date
      ON lab_results(patient_id, tested_at DESC);
    CREATE INDEX IF NOT EXISTS idx_vital_patient_date
      ON vital_signs(patient_id, measured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_created
      ON documents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_patient
      ON documents(patient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clinical_patient_date
      ON clinical_entries(patient_id, event_date DESC);
    CREATE INDEX IF NOT EXISTS idx_reminders_patient_date
      ON reminders(patient_id, scheduled_at);
  `);

  const documentColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(documents)');
  const existingColumns = new Set(documentColumns.map(column => column.name));
  const additions = [
    ['category', 'TEXT'],
    ['hospital', 'TEXT'],
    ['doctor', 'TEXT'],
    ['notes', 'TEXT'],
    ['updated_at', 'TEXT'],
  ] as const;

  for (const [name, definition] of additions) {
    if (!existingColumns.has(name)) {
      await db.execAsync(`ALTER TABLE documents ADD COLUMN ${name} ${definition}`);
    }
  }
  await db.execAsync('UPDATE documents SET updated_at = COALESCE(updated_at, created_at)');

  const labColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lab_results)');
  const existingLabColumns = new Set(labColumns.map(column => column.name));
  const labAdditions = [
    ['document_id', 'INTEGER REFERENCES documents(id) ON DELETE SET NULL'],
    ['reference_min', 'REAL'],
    ['reference_max', 'REAL'],
    ['reference_text', 'TEXT'],
    ['source_line', 'TEXT'],
  ] as const;

  for (const [name, definition] of labAdditions) {
    if (!existingLabColumns.has(name)) {
      await db.execAsync(`ALTER TABLE lab_results ADD COLUMN ${name} ${definition}`);
    }
  }
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_lab_document ON lab_results(document_id)',
  );

  const medicationColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(medications)');
  const existingMedicationColumns = new Set(medicationColumns.map(column => column.name));
  const medicationAdditions = [
    ['status', "TEXT NOT NULL DEFAULT 'active'"],
    ['side_effects', 'TEXT'],
    ['updated_at', 'TEXT'],
  ] as const;
  for (const [name, definition] of medicationAdditions) {
    if (!existingMedicationColumns.has(name)) {
      await db.execAsync(`ALTER TABLE medications ADD COLUMN ${name} ${definition}`);
    }
  }
  await db.execAsync('UPDATE medications SET updated_at = COALESCE(updated_at, created_at)');
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_medications_patient_status ON medications(patient_id, status)',
  );

  const clinicalColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(clinical_entries)',
  );
  const existingClinicalColumns = new Set(
    clinicalColumns.map(column => column.name),
  );
  const clinicalAdditions = [
    ['document_id', 'INTEGER REFERENCES documents(id) ON DELETE SET NULL'],
    ['content', 'TEXT'],
    ['interpretation', 'TEXT'],
    ['symptoms', 'TEXT'],
  ] as const;
  for (const [name, definition] of clinicalAdditions) {
    if (!existingClinicalColumns.has(name)) {
      await db.execAsync(
        `ALTER TABLE clinical_entries ADD COLUMN ${name} ${definition}`,
      );
    }
  }
  await db.execAsync(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_document ON clinical_entries(document_id) WHERE document_id IS NOT NULL',
  );
}
