# Project Memory — Health Tracker

## Mục tiêu sản phẩm

Health Tracker là ứng dụng theo dõi sức khỏe ưu tiên tiếng Việt, chạy trên
điện thoại theo chiều dọc và lưu dữ liệu cục bộ trên thiết bị. Ứng dụng hỗ trợ
nhiều bệnh nhân, hồ sơ bệnh nhân, sinh hiệu, xét nghiệm, tài liệu y tế, thuốc,
lịch khám, insight, báo cáo, nhắc lịch và backup/restore.

Ứng dụng chỉ mô tả dữ liệu và xu hướng; không chẩn đoán bệnh, không tự đề nghị
thay đổi điều trị. Dữ liệu y tế không rời khỏi thiết bị trong các luồng offline.

## Trạng thái phạm vi

- Đã hoàn thành Sprint 1–11 và các sprint phụ tương ứng theo `ROADMAP.md`.
- Phạm vi tiếp theo khi được yêu cầu là Sprint 12 — production hardening.
- Android build được hoãn đến khi toàn bộ dự án hoàn tất, trừ khi người dùng yêu cầu sớm.
- Không đưa tính năng của sprint sau vào sprint hiện tại nếu chưa được yêu cầu.

## Các luồng chính

- Tạo, chọn, sửa và xóa bệnh nhân; dữ liệu bệnh nhân xóa theo cascade.
- Nhập, sửa, xóa sinh hiệu và xét nghiệm; xem Dashboard, Timeline và trend.
- Import/chụp ảnh/PDF tài liệu, lưu mã hóa cục bộ, preview và quản lý metadata.
- OCR offline → review text → parser chỉ số → review giá trị → lưu measurement.
- Medical parser lưu từng chỉ số riêng, đơn vị, reference min/max, tham chiếu nguyên
  bản, dòng OCR nguồn và tài liệu nguồn.
- Báo cáo, backup/restore mã hóa, local reminders và khóa ứng dụng.

## Quyết định OCR hiện tại

- OCR phải chạy trong development build native, không dùng Expo Go.
- PDF dùng nhận dạng theo dòng; ngôn ngữ tự động; có fallback DPI cao hơn và
  preprocessing cho PDF scan/ảnh khi lần đầu thất bại hoặc kết quả quá ngắn.
- Luôn lưu toàn bộ raw OCR text để người dùng kiểm tra và sửa trước khi phân tích.
- Parser hỗ trợ văn bản Việt/Anh, tên viết tắt, đơn vị, khoảng tham chiếu và các
  dạng `<`, `>`, khoảng số; chỉ số không được suy đoán từ mã hồ sơ, ngày giờ hay
  số quy trình.
- Mỗi measurement từ tài liệu phải liên kết `document_id`, tên file, `source_line`,
  reference min/max và `reference_text` nếu có.

## Giao diện và theme

- Giao diện tiếng Việt, slate background, card bo góc, heading đậm, nút chính xanh.
- Dark/light mode phải đồng bộ cho page background, card, input, header, tab bar,
  text và border; tự theo theme hệ thống.
- OCR Review phải ưu tiên dễ đọc trên điện thoại: card tài liệu, trạng thái quét,
  vùng text chỉnh sửa, trạng thái chưa lưu, hoàn tác/quét lại/lưu.

## Bảo mật và dữ liệu

- SQLite dùng SQLCipher; khóa DB và khóa tài liệu lưu trong SecureStore.
- Ảnh/PDF dùng XChaCha20-Poly1305; bản rõ tạm chỉ dùng cho preview/OCR và được
  dọn khi ứng dụng ra nền.
- Khóa sinh trắc học có fallback mật mã thiết bị; tùy chọn tự khóa gồm 15 giây,
  1 phút, 5 phút và Không khóa.
- Backup mặc định dùng password-derived AES-GCM; người dùng có thêm tùy chọn
  backup không mật khẩu (file plain, có cảnh báo rõ ràng). Restore tự nhận biết
  backup mã hóa hoặc không mã hóa và vẫn gồm cả database và tài liệu.

## Quy ước kỹ thuật

- Expo SDK 57, React Native 0.86, React 19, TypeScript strict, Expo Router.
- SQLite truy cập qua repository; schema thay đổi phải có migration an toàn cho DB cũ.
- UI copy và ngày giờ dùng `vi-VN`; import alias dùng `@/`.
- Sau thay đổi logic chạy `npm run typecheck` và các test liên quan; không sửa code
  sinh tự động trong `ios/Pods` hoặc `node_modules` nếu không thật sự cần.

## Tài liệu định hướng

- Phạm vi sprint và trạng thái: `ROADMAP.md`.
- Quy ước môi trường và kiến trúc: `AGENTS.md`.
