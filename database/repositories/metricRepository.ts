import type { SQLiteDatabase } from 'expo-sqlite';
import type { MetricPoint, MetricSource } from '@/types/health';

export const VITAL_TYPES = [
  { key: 'blood_pressure', name: 'Huyết áp', unit: 'mmHg', hasSecond: true, placeholder: '120', placeholder2: '80', icon: '♥' },
  { key: 'heart_rate', name: 'Nhịp tim', unit: 'bpm', hasSecond: false, placeholder: '72', icon: '♡' },
  { key: 'weight', name: 'Cân nặng', unit: 'kg', hasSecond: false, placeholder: '60', icon: '⚖' },
  { key: 'height', name: 'Chiều cao', unit: 'cm', hasSecond: false, placeholder: '165', icon: 'cm' },
  { key: 'temperature', name: 'Nhiệt độ', unit: '°C', hasSecond: false, placeholder: '36.7', icon: '°' },
  { key: 'spo2', name: 'SpO₂', unit: '%', hasSecond: false, placeholder: '98', icon: 'O₂' }
] as const;

export const LAB_TYPES = [
  { key: 'glucose', name: 'Glucose', unit: 'mmol/L', placeholder: '6.8', icon: 'G' },
  { key: 'hba1c', name: 'HbA1c', unit: '%', placeholder: '6.2', icon: 'A1' },
  { key: 'creatinine', name: 'Creatinine', unit: 'µmol/L', placeholder: '102', icon: 'Cr' },
  { key: 'egfr', name: 'eGFR', unit: 'mL/phút/1.73 m²', placeholder: '90', icon: 'eG' },
  { key: 'uric_acid', name: 'Uric acid', unit: 'µmol/L', placeholder: '350', icon: 'UA' },
  { key: 'ast', name: 'AST', unit: 'U/L', placeholder: '32', icon: 'AS' },
  { key: 'alt', name: 'ALT', unit: 'U/L', placeholder: '46', icon: 'AL' },
  { key: 'ggt', name: 'GGT', unit: 'U/L', placeholder: '40', icon: 'GG' },
  { key: 'cholesterol', name: 'Cholesterol', unit: 'mmol/L', placeholder: '5.6', icon: 'C' },
  { key: 'non_hdl', name: 'Non-HDL Cholesterol', unit: 'mmol/L', placeholder: '2.4', icon: 'N' },
  { key: 'ldl', name: 'LDL-C', unit: 'mmol/L', placeholder: '3.2', icon: 'LD' },
  { key: 'hdl', name: 'HDL-C', unit: 'mmol/L', placeholder: '1.3', icon: 'HD' },
  { key: 'triglyceride', name: 'Triglyceride', unit: 'mmol/L', placeholder: '1.7', icon: 'TG' },
  { key: 'wbc', name: 'WBC', unit: '10^9/L', placeholder: '7.5', icon: 'W' },
  { key: 'neu_percent', name: 'NEUT %', unit: '%', placeholder: '57', icon: 'N%' },
  { key: 'neu_abs', name: 'NEUT #', unit: '10^9/L', placeholder: '5.1', icon: 'N#' },
  { key: 'lym_percent', name: 'LYM %', unit: '%', placeholder: '30', icon: 'L%' },
  { key: 'lym_abs', name: 'LYM #', unit: '10^9/L', placeholder: '2.7', icon: 'L#' },
  { key: 'mono_percent', name: 'MONO %', unit: '%', placeholder: '7.5', icon: 'M%' },
  { key: 'mono_abs', name: 'MONO #', unit: '10^9/L', placeholder: '0.7', icon: 'M#' },
  { key: 'eos_percent', name: 'EOS %', unit: '%', placeholder: '1.9', icon: 'E%' },
  { key: 'eos_abs', name: 'EOS #', unit: '10^9/L', placeholder: '0.2', icon: 'E#' },
  { key: 'baso_percent', name: 'BASO %', unit: '%', placeholder: '0.3', icon: 'B%' },
  { key: 'baso_abs', name: 'BASO #', unit: '10^9/L', placeholder: '0.03', icon: 'B#' },
  { key: 'luc_percent', name: 'LUC %', unit: '%', placeholder: '2.5', icon: 'U%' },
  { key: 'luc_abs', name: 'LUC #', unit: '10^9/L', placeholder: '0.22', icon: 'U#' },
  { key: 'ig_percent', name: 'IG %', unit: '%', placeholder: '0.5', icon: 'I%' },
  { key: 'ig_abs', name: 'IG #', unit: '10^9/L', placeholder: '0.05', icon: 'I#' },
  { key: 'rbc', name: 'RBC', unit: '10^12/L', placeholder: '4.8', icon: 'R' },
  { key: 'hgb', name: 'Hemoglobin (Hb)', unit: 'g/L', placeholder: '145', icon: 'Hb' },
  { key: 'hct', name: 'Hematocrit', unit: '%', placeholder: '43', icon: 'Ht' },
  { key: 'plt', name: 'Platelet', unit: '10^9/L', placeholder: '250', icon: 'P' },
  { key: 'mcv', name: 'MCV', unit: 'fL', placeholder: '90', icon: 'MC' },
  { key: 'mch', name: 'MCH', unit: 'pg', placeholder: '30', icon: 'MH' },
  { key: 'mchc', name: 'MCHC', unit: 'g/L', placeholder: '335', icon: 'M3' }
  ,{ key: 'chcm', name: 'CHCM', unit: 'g/L', placeholder: '324', icon: 'CH' }
  ,{ key: 'rdw', name: 'RDW', unit: '%', placeholder: '13.2', icon: 'RD' }
  ,{ key: 'hdw', name: 'HDW', unit: 'g/L', placeholder: '23.3', icon: 'HD' }
  ,{ key: 'ch', name: 'CH', unit: 'pg', placeholder: '28', icon: 'CH' }
  ,{ key: 'mdw', name: 'MDW', unit: '%', placeholder: '55', icon: 'MD' }
  ,{ key: 'nrbc_percent', name: 'NRBC %', unit: '%', placeholder: '0', icon: 'NR%' }
  ,{ key: 'nrbc_abs', name: 'NRBC #', unit: '10^9/L', placeholder: '0', icon: 'NR#' }
  ,{ key: 'mpv', name: 'MPV', unit: 'fL', placeholder: '7.2', icon: 'MP' }
  ,{ key: 'pdw', name: 'PDW', unit: '%', placeholder: '55', icon: 'PD' }
  ,{ key: 'pct', name: 'PCT', unit: '%', placeholder: '0.2', icon: 'PC' }
  ,{ key: 'afp', name: 'Alpha FP (AFP)', unit: 'IU/mL', placeholder: '1.7', icon: 'AFP' }
  ,{ key: 'hbv_viral_load', name: 'HBV tải lượng', unit: 'copies/mL', placeholder: '782', icon: 'HBV' }
  ,{ key: 'hbv_log10', name: 'HBV Log10', unit: 'Log10', placeholder: '2.89', icon: 'LOG' }
] as const;

export function metricDefinition(source: MetricSource, key: string) {
  const defs: readonly { key: string; name: string; unit: string; icon?: string }[] = source === 'vital' ? VITAL_TYPES : LAB_TYPES;
  return defs.find(x => x.key === key);
}

export async function addVital(db: SQLiteDatabase, input: { patientId: number; type: string; value1: number; value2?: number; unit: string; measuredAt: string; notes?: string }) {
  return db.runAsync(
    `INSERT INTO vital_signs(patient_id, type, value1, value2, unit, measured_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.patientId, input.type, input.value1, input.value2 ?? null, input.unit, input.measuredAt, input.notes || null
  );
}

export async function addLab(db: SQLiteDatabase, input: { patientId: number; testCode: string; testName: string; value: number; unit: string; testedAt: string; notes?: string; documentId?: number; referenceMin?: number; referenceMax?: number; referenceText?: string; sourceLine?: string }) {
  return db.runAsync(
    `INSERT INTO lab_results(patient_id, document_id, test_code, test_name, value, unit, reference_min, reference_max, reference_text, tested_at, notes, source_line) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.patientId, input.documentId ?? null, input.testCode, input.testName, input.value, input.unit,
    input.referenceMin ?? null, input.referenceMax ?? null, input.referenceText || null, input.testedAt, input.notes || null,
    input.sourceLine || null,
  );
}

export type DocumentLabInput = {
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  notes?: string;
  sourceLine?: string;
};

export async function countDocumentLabResults(db: SQLiteDatabase, documentId: number) {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM lab_results WHERE document_id = ?',
    documentId,
  );
  return row?.total ?? 0;
}

export async function replaceDocumentLabResults(
  db: SQLiteDatabase,
  input: {
    documentId: number;
    patientId: number;
    testedAt: string;
    results: DocumentLabInput[];
  },
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM lab_results WHERE document_id = ?', input.documentId);
    for (const result of input.results) {
      await addLab(db, {
        patientId: input.patientId,
        documentId: input.documentId,
        testCode: result.testCode,
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        referenceMin: result.referenceMin,
        referenceMax: result.referenceMax,
        referenceText: result.referenceText,
        testedAt: input.testedAt,
        notes: result.notes,
        sourceLine: result.sourceLine,
      });
    }
  });
}

export async function getTimeline(db: SQLiteDatabase, patientId: number, limit = 200, filter: 'all' | MetricSource = 'all') {
  const vitalClause = filter === 'lab' ? 'AND 1=0' : '';
  const labClause = filter === 'vital' ? 'AND 1=0' : '';
  return db.getAllAsync<MetricPoint>(
    `SELECT id, patient_id, type AS metric_key,
       CASE type WHEN 'blood_pressure' THEN 'Huyết áp' WHEN 'heart_rate' THEN 'Nhịp tim' WHEN 'weight' THEN 'Cân nặng' WHEN 'height' THEN 'Chiều cao' WHEN 'temperature' THEN 'Nhiệt độ' WHEN 'spo2' THEN 'SpO₂' ELSE type END AS metric_name,
       value1 AS value, value2, unit, measured_at, 'vital' AS source, notes,
       NULL AS document_id, NULL AS document_name, NULL AS source_line, NULL AS reference_min, NULL AS reference_max, NULL AS reference_text
     FROM vital_signs WHERE patient_id = ? ${vitalClause}
     UNION ALL
     SELECT l.id, l.patient_id, COALESCE(l.test_code, lower(l.test_name)) AS metric_key, l.test_name AS metric_name,
       l.value, NULL AS value2, l.unit, l.tested_at AS measured_at, 'lab' AS source, l.notes,
       l.document_id, d.file_name AS document_name, l.source_line, l.reference_min, l.reference_max, l.reference_text
     FROM lab_results l LEFT JOIN documents d ON d.id = l.document_id WHERE l.patient_id = ? ${labClause}
     ORDER BY measured_at DESC LIMIT ?`, patientId, patientId, limit
  );
}

export async function getLatestMetrics(db: SQLiteDatabase, patientId: number) {
  const all = await getTimeline(db, patientId, 500);
  const map = new Map<string, MetricPoint>();
  for (const item of all) if (!map.has(item.metric_key)) map.set(item.metric_key, item);
  return Array.from(map.values());
}

export async function getMetricHistory(db: SQLiteDatabase, patientId: number, metricKey: string) {
  const vital = await db.getAllAsync<MetricPoint>(
    `SELECT id, patient_id, type AS metric_key,
       CASE type WHEN 'blood_pressure' THEN 'Huyết áp' WHEN 'heart_rate' THEN 'Nhịp tim' WHEN 'weight' THEN 'Cân nặng' WHEN 'height' THEN 'Chiều cao' WHEN 'temperature' THEN 'Nhiệt độ' WHEN 'spo2' THEN 'SpO₂' ELSE type END AS metric_name,
       value1 AS value, value2, unit, measured_at, 'vital' AS source, notes,
       NULL AS document_id, NULL AS document_name, NULL AS source_line, NULL AS reference_min, NULL AS reference_max, NULL AS reference_text
     FROM vital_signs WHERE patient_id = ? AND type = ? ORDER BY measured_at ASC`, patientId, metricKey
  );
  if (vital.length) return vital;
  return db.getAllAsync<MetricPoint>(
    `SELECT l.id, l.patient_id, COALESCE(l.test_code, lower(l.test_name)) AS metric_key, l.test_name AS metric_name,
       l.value, NULL AS value2, l.unit, l.tested_at AS measured_at, 'lab' AS source, l.notes,
       l.document_id, d.file_name AS document_name, l.source_line, l.reference_min, l.reference_max, l.reference_text
     FROM lab_results l LEFT JOIN documents d ON d.id = l.document_id WHERE l.patient_id = ? AND COALESCE(l.test_code, lower(l.test_name)) = ? ORDER BY l.tested_at ASC`, patientId, metricKey
  );
}

export async function getMetricRecord(db: SQLiteDatabase, source: MetricSource, id: number) {
  if (source === 'vital') {
    return db.getFirstAsync<MetricPoint>(
      `SELECT id, patient_id, type AS metric_key,
       CASE type WHEN 'blood_pressure' THEN 'Huyết áp' WHEN 'heart_rate' THEN 'Nhịp tim' WHEN 'weight' THEN 'Cân nặng' WHEN 'height' THEN 'Chiều cao' WHEN 'temperature' THEN 'Nhiệt độ' WHEN 'spo2' THEN 'SpO₂' ELSE type END AS metric_name,
       value1 AS value, value2, unit, measured_at, 'vital' AS source, notes,
       NULL AS document_id, NULL AS document_name, NULL AS source_line, NULL AS reference_min, NULL AS reference_max, NULL AS reference_text FROM vital_signs WHERE id = ?`, id
    );
  }
  return db.getFirstAsync<MetricPoint>(
    `SELECT l.id, l.patient_id, COALESCE(l.test_code, lower(l.test_name)) AS metric_key, l.test_name AS metric_name,
     l.value, NULL AS value2, l.unit, l.tested_at AS measured_at, 'lab' AS source, l.notes,
     l.document_id, d.file_name AS document_name, l.source_line, l.reference_min, l.reference_max, l.reference_text FROM lab_results l LEFT JOIN documents d ON d.id = l.document_id WHERE l.id = ?`, id
  );
}

export async function updateMetric(db: SQLiteDatabase, source: MetricSource, id: number, input: { value: number; value2?: number; measuredAt: string; notes?: string }) {
  if (source === 'vital') {
    return db.runAsync(`UPDATE vital_signs SET value1=?, value2=?, measured_at=?, notes=? WHERE id=?`, input.value, input.value2 ?? null, input.measuredAt, input.notes || null, id);
  }
  return db.runAsync(`UPDATE lab_results SET value=?, tested_at=?, notes=? WHERE id=?`, input.value, input.measuredAt, input.notes || null, id);
}

export async function deleteMetric(db: SQLiteDatabase, source: MetricSource, id: number) {
  return db.runAsync(source === 'vital' ? `DELETE FROM vital_signs WHERE id=?` : `DELETE FROM lab_results WHERE id=?`, id);
}

function isoDaysAgo(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export async function seedDemoData(db: SQLiteDatabase, patientId: number) {
  const count = await db.getFirstAsync<{ total: number }>(
    `SELECT (SELECT COUNT(*) FROM vital_signs WHERE patient_id=?) + (SELECT COUNT(*) FROM lab_results WHERE patient_id=?) AS total`, patientId, patientId
  );
  if ((count?.total ?? 0) > 0) return false;
  await db.withTransactionAsync(async () => {
    for (const x of [
      [21, 128, 82], [14, 125, 80], [7, 123, 79], [0, 121, 78]
    ] as const) await addVital(db, { patientId, type: 'blood_pressure', value1: x[1], value2: x[2], unit: 'mmHg', measuredAt: isoDaysAgo(x[0], 7, 30), notes: 'Dữ liệu demo' });
    for (const x of [[18, 7.4], [12, 7.1], [6, 6.9], [0, 6.8]] as const) await addLab(db, { patientId, testCode: 'glucose', testName: 'Glucose', value: x[1], unit: 'mmol/L', testedAt: isoDaysAgo(x[0], 8), notes: 'Dữ liệu demo' });
    for (const x of [[30, 6.5], [15, 6.3], [0, 6.2]] as const) await addLab(db, { patientId, testCode: 'hba1c', testName: 'HbA1c', value: x[1], unit: '%', testedAt: isoDaysAgo(x[0], 8), notes: 'Dữ liệu demo' });
    await addVital(db, { patientId, type: 'heart_rate', value1: 72, unit: 'bpm', measuredAt: isoDaysAgo(0, 7, 35), notes: 'Dữ liệu demo' });
    await addVital(db, { patientId, type: 'spo2', value1: 98, unit: '%', measuredAt: isoDaysAgo(0, 7, 36), notes: 'Dữ liệu demo' });
    await addLab(db, { patientId, testCode: 'creatinine', testName: 'Creatinine', value: 102, unit: 'µmol/L', testedAt: isoDaysAgo(0, 8, 5), notes: 'Dữ liệu demo' });
    await addLab(db, { patientId, testCode: 'alt', testName: 'ALT', value: 46, unit: 'U/L', testedAt: isoDaysAgo(0, 8, 5), notes: 'Dữ liệu demo' });
  });
  return true;
}
