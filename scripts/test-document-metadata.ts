// @ts-nocheck -- Executed directly by Node 22 with type stripping.
import assert from "node:assert/strict";

import { parseDocumentMetadata } from "../utils/documentMetadataParser.ts";

const dhaReport = `PHÒNG KHÁM ĐA KHOA DHA HEALTHCARE 221-221 Bis Nguyễn Thị Minh Khai, P. Nguyễn Cư Trinh, Q. 01, TP.HCM Hotline: 19001115
PHIẾU KẾT QUẢ XÉT NGHIỆM
Họ và tên: VÕ VĂN NIÊU Năm sinh: 1984
Bác sĩ chỉ định:
Người kiểm tra: Phan Thị Thu Diễm
Ngày 12 tháng 07 năm 2025`;
assert.deepEqual(parseDocumentMetadata(dhaReport), {
  documentDate: "2025-07-12",
  hospital: "PHÒNG KHÁM ĐA KHOA DHA HEALTHCARE",
  doctor: null,
});

const visitNote = `BỆNH VIỆN CHỢ RẪY
Địa chỉ: 201B Nguyễn Chí Thanh
Ngày khám: 26/09/2026
Bác sĩ khám: BS.CKI Nguyễn Văn An
Chẩn đoán: Theo dõi sức khỏe`;
assert.deepEqual(parseDocumentMetadata(visitNote), {
  documentDate: "2026-09-26",
  hospital: "BỆNH VIỆN CHỢ RẪY",
  doctor: "BS.CKI Nguyễn Văn An",
});

const flattened = parseDocumentMetadata(
  "PHÒNG KHÁM HOÀN MỸ Hotline: 028123456 Ngày sinh: 01/02/1980 Ngày xét nghiệm: 15/08/2026 Bác sĩ chỉ định: Trần Thị Bình Chất lượng mẫu: Đạt",
);
assert.equal(flattened.documentDate, "2026-08-15");
assert.equal(flattened.hospital, "PHÒNG KHÁM HOÀN MỸ");
assert.equal(flattened.doctor, "Trần Thị Bình");

console.log("Document metadata parser OK: ngày khám, cơ sở và bác sĩ.");
