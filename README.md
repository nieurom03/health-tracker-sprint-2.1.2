# Health Tracker

Bản này sửa lỗi dependency của Expo SDK 57 và lỗi `RNSSafeAreaView`.

## Các fix chính

- Pin React / React DOM cùng phiên bản `19.2.3`.
- Pin `react-native-reanimated` về `4.5.1` theo Expo SDK 57.
- Pin `react-native-worklets` về `0.10.1` để khớp Reanimated 4.5.x của SDK 57.
- Thêm `react-native-gesture-handler ~2.32.0`.
- Thêm `react-native-web ~0.21.0` để dependency tree của Expo Router không tự kéo React DOM sai phiên bản.
- Giữ `react-native-safe-area-context ~5.7.0`.
- Bọc root app bằng `SafeAreaProvider`.

## Cài sạch — bắt buộc

Không copy `node_modules` hoặc `package-lock.json` từ project cũ sang bản này.

```bash
cd health-tracker-sprint-2.1.1
rm -rf node_modules package-lock.json .expo
npm install
npx expo-doctor
npx expo start -c
```

Nếu bạn giải nén đè lên folder cũ, vẫn phải chạy lệnh xóa `node_modules` và `package-lock.json` trước `npm install`.

## Version quan trọng

```text
expo                         ~57.0.21
expo-router                  ~57.0.20
react                        19.2.3
react-dom                    19.2.3
react-native                 0.86.3
react-native-reanimated      4.5.1
react-native-worklets        0.10.1
react-native-gesture-handler ~2.32.0
react-native-safe-area-context ~5.7.0
```

## Nếu chạy Development Build

Khi đã có thư mục native `ios/` hoặc `android/` từ bản dependency cũ, regenerate lại:

```bash
npx expo prebuild --clean
npx expo run:ios
# hoặc
npx expo run:android
```

Nếu chạy Expo Go, chỉ cần `npx expo start -c` sau khi cài sạch.

## Sprint 2.1.2 fixes

- Uses the dependency versions supplied in the provided `package.json`.
- Migrated DateTimePicker from deprecated `onChange` to `onValueChange` + `onDismiss`.
- Android uses the library's recommended imperative `DateTimePickerAndroid` API.
- iOS uses `display="compact"` instead of the spinner to reduce simulator-only UIKit haptic noise.
- `SafeAreaProvider` remains at the root.

### iOS simulator log notes
`hapticpatternlibrary.plist`, `RemoteTextInput`, `TextInputUI`, and the UIKit/RCTScrollView observer messages are emitted by the iOS Simulator/UIKit/React Native internals and are not app exceptions. The app-side DateTimePicker deprecation warning is fixed in this release.

## Sprint 3 — Hồ sơ tài liệu y tế

- Document Inbox mới trong thanh tab.
- Chụp ảnh tài liệu bằng camera.
- Chọn ảnh có sẵn từ thư viện.
- Import file PDF từ trình chọn file hệ thống.
- Sao chép file vào thư mục documents riêng của ứng dụng để lưu lâu dài.
- Gắn từng tài liệu với một bệnh nhân và lọc Inbox theo bệnh nhân đang theo dõi.

## Sprint 3.1 — Xem và quản lý tài liệu

- Chạm vào tài liệu trong Inbox để mở màn hình chi tiết.
- Xem trước ảnh ngay trong ứng dụng; mở ảnh/PDF toàn màn hình bằng trình xem native.
- Đổi tên hiển thị và phân loại tài liệu.
- Lưu ngày khám/tài liệu, bệnh viện, bác sĩ và ghi chú.
- Xóa tài liệu sau bước xác nhận, gồm bản ghi SQLite và file local khi có thể.
- Tự động nâng cấp bảng `documents` hiện có mà không xóa dữ liệu Sprint 3.

Trên iOS, preview native dùng Quick Look. Trên Android, ứng dụng chuyển tài liệu sang trình xem tương thích đã cài trên thiết bị. Xem toàn bộ kế hoạch trong `ROADMAP.md`.

Preview native cần development build (`npm run ios` hoặc `npm run android`), không chạy trong Expo Go sau khi chỉ cài package JavaScript.

## Sprint 4 — OCR offline

- Nhận dạng văn bản từ ảnh và PDF ngay trên thiết bị.
- Ưu tiên tiếng Việt và tiếng Anh cho tài liệu y tế.
- PDF có lớp text được đọc trực tiếp; PDF scan được render thành ảnh để OCR.
- Lưu nguyên văn kết quả vào trường `documents.ocr_text` trong SQLite.
- Hiển thị trạng thái OCR trong Document Inbox và raw text dạng chỉ đọc trong chi tiết tài liệu.
- Cho phép quét lại sau bước xác nhận; kết quả mới thay thế kết quả cũ.
- Không gửi ảnh, PDF hoặc nội dung nhận dạng lên máy chủ.

iOS dùng Apple Vision/PDFKit. Android dùng ML Kit/PDFBox và đóng gói sẵn model Latin; build Android được hoãn đến khi hoàn thiện toàn bộ dự án theo yêu cầu.

Package OCR chưa khai báo `modulesProvider` cho React Native New Architecture trên iOS. Script `postinstall` tự bổ sung đăng ký này sau mỗi lần `npm install`; sau khi cài dependency mới cần chạy CocoaPods và rebuild development app. OCR native không chạy trong Expo Go.

## Sprint 4.1 — Review OCR

- Kết quả quét được mở dưới dạng bản nháp, chưa ghi đè nội dung đã lưu.
- Cho phép sửa trực tiếp toàn bộ văn bản OCR và hiển thị số ký tự.
- Có thao tác hoàn tác về bản đã lưu và quét lại từ file gốc.
- Cảnh báo trước khi thoát hoặc quét lại nếu có chỉnh sửa chưa lưu.
- Chỉ cập nhật SQLite khi người dùng bấm **Lưu nội dung đã review**.

## Sprint 5–5.1 — Medical Parser và mapping

- Parser chạy hoàn toàn local, nhận dạng tên xét nghiệm tiếng Anh/tiếng Việt và các alias thường gặp.
- Hỗ trợ Glucose, HbA1c, Creatinine, AST, ALT, Cholesterol, LDL-C, HDL-C, Triglyceride và CBC chính: WBC, RBC, Hemoglobin, Hematocrit, Platelet, MCV, MCH, MCHC.
- Đọc ngày xét nghiệm, giá trị, đơn vị, khoảng tham chiếu và cờ cao/thấp từ nội dung OCR.
- Chuẩn hóa đơn vị và quy đổi có kiểm soát cho mg/dL, g/dL và L/L sang đơn vị chuẩn của ứng dụng.
- Loại trừ một số kết quả dễ nhầm như glucose niệu và tránh map LDL/HDL thành cholesterol toàn phần.

## Sprint 6 — Scan → Tracker tự động

- Sau review OCR, ứng dụng tự mở màn hình review các chỉ số tìm thấy.
- Cho phép chọn/bỏ chọn, sửa giá trị, đơn vị, reference range và ngày xét nghiệm.
- Hiển thị độ tin cậy, dòng OCR gốc, thông tin quy đổi và trạng thái cao/thấp để đối chiếu.
- Tạo đồng thời các kết quả đã chọn và gắn chúng với tài liệu nguồn qua `document_id`.
- Chạy lại cùng tài liệu sẽ yêu cầu xác nhận và thay thế nhóm chỉ số cũ, tránh tạo trùng.
- Dashboard, Timeline và Trend tự đọc các chỉ số mới từ SQLite.

Parser có smoke test bằng `npm run test:parser`; toàn bộ logic smoke test chạy bằng `npm test`.

## Sprint 7–7.1 — Bệnh án và thuốc

- Hồ sơ bệnh án mở rộng lưu chẩn đoán, tiền sử, dị ứng, toa thuốc và lần khám, kèm ngày, bệnh viện, bác sĩ và diễn giải.
- Medication Tracker quản lý tên thuốc, liều, lịch uống, ngày bắt đầu/kết thúc, trạng thái đang dùng/đã ngưng, tác dụng phụ và ghi chú.
- Chạm một mục để chỉnh sửa; giữ để xóa sau bước xác nhận.

## Sprint 8–8.1 — Insights và báo cáo

- Insights chạy bằng quy tắc offline, so sánh lần gần nhất và đánh dấu giá trị ngoài khoảng tham chiếu đã lưu.
- Báo cáo theo 1/3/6/12 tháng gồm biểu đồ xu hướng, bảng chỉ số, thuốc, hồ sơ bệnh án và cảnh báo không thay thế chẩn đoán.

## Sprint 9–9.1 — Bảo mật và backup

- Khóa ứng dụng bằng Face ID/Touch ID với fallback mật mã thiết bị và thời gian tự khóa tùy chọn.
- SQLite được mã hóa bằng SQLCipher; khóa ngẫu nhiên được bảo vệ bằng SecureStore.
- Ảnh/PDF được mã hóa XChaCha20-Poly1305. Preview/OCR dùng bản giải mã trong cache và xóa cache khi ứng dụng ra nền.
- Backup gom toàn bộ SQLite và tài liệu vào file `.healthbackup` được mã hóa bằng mật khẩu; restore yêu cầu xác nhận trước khi thay dữ liệu.

## Sprint 10 — Export

- PDF để đọc/in, CSV để mở dạng bảng và ZIP chứa cả hai định dạng.
- Bảng chia sẻ hệ điều hành chỉ mở sau thao tác của người dùng; ứng dụng nhắc dùng người nhận và kênh tin cậy.

## Sprint 11 — Nhắc lịch

- Local notification cho uống thuốc, đo huyết áp/đường huyết, tái khám và xét nghiệm.
- Hỗ trợ một lần, hằng ngày, hằng tuần và hằng tháng; có thể tắt/bật hoặc xóa.
- Không cần backend; quyền thông báo chỉ được yêu cầu khi người dùng tạo hoặc bật lời nhắc.

Mở tab **Thêm** để truy cập các tính năng Sprint 7–11 và xem diễn giải ngắn ngay trong từng màn hình. Chi tiết phạm vi nằm trong `ROADMAP.md`.

## Safe-area header fix

Các tab dùng header tùy biến (Dashboard, Timeline và Document Inbox) được bọc theo safe area, tránh nội dung bị status bar hoặc Dynamic Island che khuất.

> Expo SDK 57 cần Node.js `>=20.19.4`. Node 18 không thể chạy Metro của phiên bản này.
