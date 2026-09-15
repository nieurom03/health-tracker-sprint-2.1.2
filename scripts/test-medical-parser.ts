// @ts-nocheck -- Executed directly by Node 22 with type stripping.
import assert from "node:assert/strict";

import { parseMedicalText } from "../utils/medicalParser.ts";

const report = `Ngày xét nghiệm: 14/09/2026
Glucose 126 mg/dL 70 - 99 H
HbA1c 6,2 % 4,0 - 5,6
Creatinine 1.1 mg/dL 0.7 - 1.3
AST 32 U/L 0 - 40
ALT 46 U/L 0 - 41 H
Cholesterol toàn phần 210 mg/dL < 200
LDL-C 130 mg/dL < 100
HDL-C 52 mg/dL > 40
Triglyceride 177 mg/dL < 150
WBC 7.5 x10^9/L 4.0 - 10.0
RBC 4.8 x10^12/L 4.2 - 5.8
HGB 14.5 g/dL 13 - 17
HCT 0.43 L/L 0.4 - 0.5
PLT 250 x10^9/L 150 - 450
MCV 90 fL 80 - 100
MCH 30 pg 27 - 33
MCHC 33.5 g/dL 32 - 36`;

const parsed = parseMedicalText(report);
assert.equal(parsed.results.length, 17);
assert.equal(new Date(parsed.detectedDate!).getUTCFullYear(), 2026);

const glucose = parsed.results.find((result) => result.key === "glucose")!;
assert.equal(glucose.unit, "mmol/L");
assert.equal(glucose.value, 6.993);
assert.equal(glucose.status, "high");
assert.equal(glucose.converted, true);

const hct = parsed.results.find((result) => result.key === "hct")!;
assert.equal(hct.value, 43);
assert.equal(hct.referenceMin, 40);
assert.equal(hct.referenceMax, 50);

const wrapped = parseMedicalText("Creatinine\n102 µmol/L 62 - 106");
assert.equal(wrapped.results[0]?.key, "creatinine");
assert.equal(wrapped.results[0]?.value, 102);

const specificity = parseMedicalText("LDL Cholesterol 3.4 mmol/L < 3.0\nGlucose niệu 2.0 mmol/L");
assert.deepEqual(specificity.results.map((result) => result.key), ["ldl"]);

console.log(`Medical parser OK: ${parsed.results.length} chỉ số, ngày và đơn vị đã chuẩn hóa.`);
