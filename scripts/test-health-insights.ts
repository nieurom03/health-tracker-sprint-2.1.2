// @ts-nocheck -- Executed directly by Node 22 with type stripping.
import assert from 'node:assert/strict';
import { buildHealthInsights } from '../utils/healthInsights.ts';
import type { MetricPoint } from '../types/health.ts';

const base: MetricPoint = { id: 1, patient_id: 1, source: 'lab', metric_key: 'glucose', metric_name: 'Glucose', value: 6, unit: 'mmol/L', value2: null, reference_min: 3.9, reference_max: 6.1, measured_at: '2026-09-01T08:00:00.000Z', notes: null };
assert.match(buildHealthInsights([{ ...base, value: 7 }])[0].title, /cao hơn/);
assert.match(buildHealthInsights([{ ...base, id: 2, value: 6, measured_at: '2026-09-02T08:00:00.000Z' }, { ...base, value: 5 }]).find(x => x.key === 'glucose-trend')?.title ?? '', /tăng/);
assert.equal(buildHealthInsights([{ ...base, value: 6 }])[0].tone, 'positive');
console.log('Health insights: 3 checks passed.');
