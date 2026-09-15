# Health Tracker roadmap

Mỗi sprint là một phạm vi độc lập. Chỉ triển khai sprint hiện tại; không đưa trước tính năng của sprint sau nếu chưa được yêu cầu.

| Sprint | Mục tiêu chính | Nội dung |
| --- | --- | --- |
| 1 | Nền tảng dữ liệu | Tạo project, SQLite local, nhiều bệnh nhân, CRUD hồ sơ bệnh nhân, nhập chỉ số thủ công |
| 2 | Theo dõi sức khỏe | Dashboard, Timeline, Trend chart, so sánh lần đo gần nhất |
| 2.1 | Hoàn thiện trải nghiệm nhập liệu | UI đẹp hơn, Date/Time picker, Edit/Delete chỉ số, filter Timeline, demo data |
| 2.1.1–2.1.2 | Ổn định dependency | Fix Expo SDK 57, React/React DOM, Reanimated/Worklets, SafeArea, DateTimePicker warnings |
| 3 | Hồ sơ tài liệu y tế | Chụp giấy, chọn ảnh, import PDF, lưu file local, Document Inbox, gắn tài liệu với bệnh nhân |
| 3.1 | Xem & quản lý tài liệu | Preview ảnh/PDF, đổi tên, phân loại, ngày khám, bệnh viện, bác sĩ, ghi chú, xóa tài liệu |
| 4 | OCR offline | OCR ảnh/PDF hoàn toàn trên máy, extract text từ phiếu xét nghiệm, lưu raw OCR text |
| 4.1 | Review OCR | Cho người dùng kiểm tra và sửa text OCR trước khi lưu |
| 5 | Medical Parser | Nhận dạng Glucose, HbA1c, AST, ALT, Creatinine, Cholesterol, LDL, HDL, Triglyceride, CBC… |
| 5.1 | Mapping thông minh | Chuẩn hóa tên xét nghiệm, đơn vị, reference range, ngày xét nghiệm và giá trị bất thường |
| 6 | Scan → Tracker tự động | PDF/ảnh → OCR → parser → review → measurement → Dashboard/Trend |
| 7 | Hồ sơ bệnh án mở rộng | Chẩn đoán, tiền sử bệnh, dị ứng, toa thuốc, lần khám, bác sĩ/bệnh viện |
| 7.1 | Medication Tracker | Liều dùng, lịch uống, start/end date, đang dùng/ngưng, tác dụng phụ |
| 8 | Health Insights | Phát hiện xu hướng, so sánh kỳ trước và chỉ số ngoài reference range |
| 8.1 | Báo cáo sức khỏe | Báo cáo 1/3/6/12 tháng, chỉ số, biểu đồ, thuốc và lịch sử khám |
| 9 | Bảo mật | Face ID/Touch ID, SQLCipher, mã hóa file y tế, auto-lock |
| 9.1 | Backup/Restore | Export backup có mật khẩu, restore toàn bộ SQLite + documents |
| 10 | Export & chia sẻ | Export hồ sơ thành PDF, CSV, ZIP; chia sẻ qua Files/AirDrop |
| 11 | Reminder | Nhắc uống thuốc, đo huyết áp/đường huyết, tái khám, xét nghiệm định kỳ |
| 12 | Production hardening | Migration DB, crash handling, validation, accessibility, performance, TestFlight/Play Store build |

## Diễn giải Sprint 7–11

### Sprint 7 — Hồ sơ bệnh án mở rộng

- **Chẩn đoán:** lưu tên bệnh hoặc kết luận y khoa để nhìn lại lịch sử bệnh theo thời gian.
- **Tiền sử bệnh:** ghi các bệnh và vấn đề sức khỏe từng có, giúp cung cấp bối cảnh cho lần khám sau.
- **Dị ứng:** lưu tác nhân và phản ứng dị ứng để người chăm sóc dễ kiểm tra trước khi dùng thuốc.
- **Toa thuốc:** ghi lại nội dung toa được bác sĩ kê; đây là hồ sơ tham khảo, không tự đưa ra chỉ định.
- **Lần khám:** lưu ngày, cơ sở y tế, bác sĩ và diễn giải của từng lần thăm khám.

### Sprint 7.1 — Medication Tracker

- **Liều dùng:** lượng thuốc dùng mỗi lần, ví dụ `500 mg`.
- **Lịch uống:** tần suất hoặc thời điểm dùng, ví dụ `sau ăn sáng và tối`.
- **Ngày bắt đầu/kết thúc:** khoảng thời gian bệnh nhân dự kiến dùng thuốc.
- **Trạng thái:** phân biệt thuốc đang dùng với thuốc đã ngưng mà không làm mất lịch sử.
- **Tác dụng phụ:** ghi lại phản ứng người dùng quan sát được để trao đổi với nhân viên y tế.

### Sprint 8–8.1 — Insights và báo cáo

- **Xu hướng:** so sánh hai lần đo gần nhất; thay đổi từ 3% trở lên được diễn giải là tăng hoặc giảm.
- **Ngoài khoảng tham chiếu:** đánh dấu khi giá trị mới nhất thấp hơn `reference_min` hoặc cao hơn `reference_max` đã lưu.
- **Giới hạn y khoa:** insight chỉ mô tả dữ liệu, không chẩn đoán và không đề nghị thay đổi điều trị.
- **Kỳ báo cáo:** chọn 1, 3, 6 hoặc 12 tháng để giới hạn chỉ số được tổng hợp.
- **Nội dung báo cáo:** gồm biểu đồ xu hướng, bảng chỉ số, thuốc và hồ sơ bệnh án.

### Sprint 9–9.1 — Bảo mật và backup

- **Khóa ứng dụng:** dùng Face ID/Touch ID, có fallback bằng mật mã thiết bị và tự khóa sau 15 giây/1 phút/5 phút.
- **Mã hóa SQLite:** SQLCipher mã hóa cơ sở dữ liệu bằng khóa ngẫu nhiên lưu trong iOS Keychain/Android Keystore qua SecureStore.
- **Mã hóa tài liệu:** ảnh/PDF được mã hóa XChaCha20-Poly1305; bản rõ tạm dùng cho preview/OCR bị xóa khi ứng dụng ra nền.
- **Backup:** toàn bộ bảng dữ liệu và tài liệu được đóng gói vào một file mã hóa bằng mật khẩu người dùng.
- **Restore:** thay dữ liệu hiện tại sau bước xác nhận, mã hóa lại tài liệu theo khóa của thiết bị mới và tạo lại lời nhắc còn bật.

### Sprint 10 — Export & chia sẻ

- **PDF:** bản dễ đọc/in, có thông tin bệnh nhân, biểu đồ, chỉ số, thuốc, lịch sử khám và lưu ý y khoa.
- **CSV:** dữ liệu chỉ số dạng bảng để mở trong Excel hoặc phần mềm phân tích.
- **ZIP:** một gói chứa PDF, CSV và hướng dẫn an toàn khi chia sẻ.
- **Quyền riêng tư:** ứng dụng chỉ mở bảng chia sẻ của hệ điều hành sau thao tác của người dùng và nhắc chọn kênh tin cậy.

### Sprint 11 — Reminder

- **Loại nhắc:** uống thuốc, đo huyết áp, đo đường huyết, tái khám hoặc xét nghiệm định kỳ.
- **Chu kỳ:** một lần, hằng ngày, hằng tuần hoặc hằng tháng.
- **Hoạt động offline:** lịch được đăng ký bằng local notification trên thiết bị, không cần máy chủ.
- **Quản lý:** có thể tắt/bật lại hoặc xóa; quyền thông báo chỉ được hỏi khi tạo hay bật lời nhắc.

## Trạng thái

- Hoàn thành theo baseline hiện tại: Sprint 1 đến Sprint 11, gồm các sprint phụ 2.1, 2.1.1–2.1.2, 3.1, 4.1, 5.1, 7.1, 8.1 và 9.1.
- Bổ sung sau baseline: người dùng có thể cập nhật hồ sơ người bệnh; ứng dụng đã có icon riêng đồng bộ cho cấu hình Expo và native iOS/Android.
- Bổ sung theo dõi: phân loại tài liệu X-quang và chỉ số sinh hiệu Chiều cao (cm), có lịch sử và biểu đồ xu hướng.
- Sprint tiếp theo khi được yêu cầu: Sprint 12 — Production hardening.
- Android build được hoãn đến khi toàn bộ dự án hoàn tất theo yêu cầu của người dùng.
