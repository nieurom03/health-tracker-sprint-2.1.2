export type Patient = {
  id: number;
  name: string;
  dob: string | null;
  gender: string | null;
  blood_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MetricSource = 'vital' | 'lab';

export type MetricPoint = {
  id: number;
  patient_id: number;
  metric_key: string;
  metric_name: string;
  value: number;
  value2: number | null;
  unit: string;
  measured_at: string;
  source: MetricSource;
  notes?: string | null;
  document_id?: number | null;
  document_name?: string | null;
  source_line?: string | null;
  reference_min?: number | null;
  reference_max?: number | null;
  reference_text?: string | null;
};

export type HealthDocument = {
  id: number;
  patient_id: number;
  patient_name: string;
  type: 'image' | 'pdf';
  file_name: string;
  file_path: string;
  ocr_text: string | null;
  document_date: string | null;
  category: string | null;
  hospital: string | null;
  doctor: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  parsed_count?: number;
};

export type ClinicalKind = 'diagnosis' | 'history' | 'allergy' | 'prescription' | 'visit';

export type ClinicalEntry = {
  id: number;
  patient_id: number;
  document_id: number | null;
  kind: ClinicalKind;
  title: string;
  content: string | null;
  interpretation: string | null;
  symptoms: string | null;
  details: string | null;
  event_date: string | null;
  facility: string | null;
  clinician: string | null;
  created_at: string;
  updated_at: string;
};

export type Medication = {
  id: number;
  patient_id: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'stopped';
  side_effects: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReminderKind = 'medication' | 'blood_pressure' | 'glucose' | 'appointment' | 'lab';
export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export type HealthReminder = {
  id: number;
  patient_id: number;
  patient_name?: string;
  kind: ReminderKind;
  title: string;
  notes: string | null;
  scheduled_at: string;
  repeat_rule: RepeatRule;
  notification_id: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
};
