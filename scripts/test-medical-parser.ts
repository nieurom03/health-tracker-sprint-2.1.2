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

const dhaRows = `Ngày 12 tháng 07 năm 2025
WBC 5.29 4 - 11 10^9/L
NEUT# 2.66 2 - 7.7 10^9/L
LYM# 1.74 1 - 4.8 10^9/L
MONO# 0.71 0.1 - 1 10^9/L
EOS# 0.12 0 - 0.7 10^9/L
BASO# 0.02 0 - 0.2 10^9/L
NEUT% 50.4 40 - 74 %
LYM% 32.9 20 - 45 %
MONO% 13.4 4 - 10 %
EOS% 2.3 0 - 7.3 %
BASO% 0.3 0 - 7 %
RBC 5.00 4 - 5.8 10^12/L
HGB 15.2 12.5 - 16 g/dL
HCT 43.5 36 - 54 %
MCV 87.0 80 - 97 fL
MCH 30.3 26 - 32 pg
MCHC 34.9 31 - 36 g/dL
RDW 13.4 11.5 - 14.5 %CV
PLT 187 150 - 450 10^9/L
MPV 9.1 0.1 - 11 fL
PDW 16.6 9 - 21 %
PCT 0.17 0.11 - 0.28 %`;
const dhaParsed = parseMedicalText(dhaRows);
assert.equal(dhaParsed.results.length, 22);
assert.equal(dhaParsed.results.find((result) => result.key === "wbc")?.value, 5.29);
assert.equal(dhaParsed.results.find((result) => result.key === "neu_abs")?.value, 2.66);
assert.equal(dhaParsed.results.find((result) => result.key === "mono_percent")?.status, "high");
assert.equal(dhaParsed.results.find((result) => result.key === "hgb")?.value, 152);
assert.equal(dhaParsed.results.find((result) => result.key === "pct")?.value, 0.17);
assert.equal(new Date(dhaParsed.detectedDate!).getUTCFullYear(), 2025);

const labels = [
  "WBC", "NEUT#", "LYM#", "MONO#", "EOS#", "BASO#",
  "NEUT%", "LYM%", "MONO%", "EOS%", "BASO%",
  "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "RDW", "PLT", "MPV", "PDW", "PCT",
];
const values = [
  "5.29", "2.66", "1.74", "0.71", "0.12", "0.02", "50.4", "32.9", "13.4", "2.3", "0.3",
  "5.00", "15.2", "43.5", "87.0", "30.3", "34.9", "13.4", "187", "9.1", "16.6", "0.17",
];
const ranges = [
  "4 - 11", "2 - 7.7", "1 - 4.8", "0.1 - 1", "0 - 0.7", "0 - 0.2", "40 - 74", "20 - 45", "4 - 10", "0 - 7.3", "0 - 7",
  "4 - 5.8", "12.5 - 16", "36 - 54", "80 - 97", "26 - 32", "31 - 36", "11.5 - 14.5", "150 - 450", "0.1 - 11", "9 - 21", "0.11 - 0.28",
];
const units = [
  "10⁹/L", "10⁹/L", "10⁹/L", "10⁹/L", "10⁹/L", "10⁹/L", "%", "%", "%", "%", "%",
  "10¹²/L", "g/dL", "%", "fL", "pg", "g/dL", "%CV", "10⁹/L", "fL", "%", "%",
];
const columnar = parseMedicalText([
  ...labels,
  "KẾT QUẢ",
  ...values,
  "GIÁ TRỊ THAM CHIẾU",
  ...ranges,
  "ĐƠN VỊ",
  ...units,
].join("\n"));
assert.equal(columnar.results.length, labels.length);
assert.equal(columnar.results.find((result) => result.key === "wbc")?.value, 5.29);
assert.equal(columnar.results.find((result) => result.key === "neu_abs")?.value, 2.66);
assert.equal(columnar.results.find((result) => result.key === "mono_percent")?.referenceMax, 10);
assert.equal(columnar.results.find((result) => result.key === "hgb")?.value, 152);
assert.equal(columnar.results.find((result) => result.key === "pct")?.referenceMin, 0.11);

const flattenedColumnar = parseMedicalText([
  "PHÒNG KHÁM ĐA KHOA DHA HEALTHCARE 221-221 Bis Nguyễn Thị Minh Khai",
  ...labels,
  "KẾT QUẢ",
  ...values,
  "GIÁ TRỊ THAM CHIẾU",
  ...ranges,
  "ĐƠN VỊ",
  ...units,
].join(" "));
assert.equal(flattenedColumnar.results.length, labels.length);
assert.equal(flattenedColumnar.results.find((result) => result.key === "wbc")?.value, 5.29);
assert.equal(flattenedColumnar.results.find((result) => result.key === "mono_percent")?.value, 13.4);
assert.equal(flattenedColumnar.results.find((result) => result.key === "mono_percent")?.referenceMin, 4);
assert.equal(flattenedColumnar.results.find((result) => result.key === "mono_abs")?.value, 0.71);
assert.equal(flattenedColumnar.results.find((result) => result.key === "hgb")?.value, 152);
assert.equal(flattenedColumnar.results.find((result) => result.key === "pct")?.value, 0.17);

const noParentChildMixup = parseMedicalText("WBC\nNEUT# 2.66 2 - 7.7 10^9/L");
assert.equal(noParentChildMixup.results.find((result) => result.key === "wbc"), undefined);
assert.equal(noParentChildMixup.results.find((result) => result.key === "neu_abs")?.value, 2.66);

console.log(`Medical parser OK: ${dhaParsed.results.length} chỉ số DHA, gồm bảng OCR theo cột.`);
