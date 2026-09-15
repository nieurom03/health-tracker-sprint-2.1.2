# Health Tracker project context

## Product

- Vietnamese-first, portrait mobile health-tracking app for multiple patients.
- Follow `ROADMAP.md` and implement one requested sprint at a time. Do not pull features from later sprints into the current sprint without explicit user approval.
- All health data is stored locally on the device in SQLite (`health-tracker.db`); there is currently no backend, authentication, sync, analytics, or cloud storage.
- Main workflows: create/select/delete a patient, add/edit/delete vital signs and lab results, view latest metrics, timeline, and per-metric trends.
- This app displays a disclaimer and must not present its trends as medical diagnosis.

## Stack and conventions

- Node: v22.23.1
- Expo SDK 57, React Native 0.86, React 19, TypeScript in strict mode.
- Expo Router file-based navigation under `app/`; typed routes are enabled.
- `expo-sqlite` provides persistence through `SQLiteProvider` in `app/_layout.tsx`.
- Use the `@/` path alias for project-root imports.
- UI copy and date formatting are Vietnamese (`vi-VN`). Preserve the current visual language: slate backgrounds, white cards, blue primary actions, rounded corners, and heavy headings.
- Keep iOS and Android behavior aligned. `DateTimeField` intentionally uses Android's imperative picker API and iOS `display="compact"`.

## Architecture map

- `app/_layout.tsx`: root providers, database migration, and stack routes.
- `app/(tabs)/index.tsx`: dashboard for the selected patient and latest metrics.
- `app/(tabs)/patients.tsx`: patient list, selection, and deletion.
- `app/(tabs)/timeline.tsx`: filterable combined vital/lab history.
- `app/(tabs)/documents.tsx`: local Document Inbox across patients or filtered to the selected patient.
- `app/patients/*`: create and view patient details.
- `app/records/*`: create/edit metric records via shared `MetricForm`.
- `app/documents/new.tsx`: capture an image, choose an image, or import a PDF and attach it to a patient.
- `app/documents/[id].tsx`: preview, edit metadata, and delete a stored document.
- `app/documents/ocr-review.tsx`: run OCR into an editable draft, warn about unsaved changes, and save only after user review.
- `app/documents/medical-review.tsx`: review parsed lab results, units, reference ranges, test date, selection, and batch-create measurements linked to a document.
- `app/trends/[metric].tsx`: history, delta, and SVG trend chart.
- `app/(tabs)/more.tsx`: hub for clinical records, medications, insights, reports, reminders, security, and encrypted backup/restore.
- `app/clinical/index.tsx`: diagnosis, history, allergy, prescription, and visit records.
- `app/medications/index.tsx`: medication dosage, schedule, dates, status, side effects, and notes.
- `app/insights.tsx` / `app/reports.tsx`: offline trend insights and 1/3/6/12-month PDF/CSV/ZIP reporting.
- `app/reminders.tsx`: local health notification scheduling and management.
- `components/form/DocumentDateField.tsx`: optional document/visit date input with platform-native date pickers.
- `database/migrations.ts`: SQLite schema and indexes.
- `database/repositories/`: all patient and metric SQL/data access.
- `types/health.ts`: core `Patient`, `MetricPoint`, and `MetricSource` types.
- `utils/format.ts`: Vietnamese date/time and metric formatting.
- `utils/documentStorage.ts` / `utils/protectedFile.ts`: persistent local document copying, authenticated encryption, legacy path rebasing, and temporary preview materialization.
- `utils/medicalParser.ts`: deterministic offline medical parser, alias mapping, unit conversion, date/range extraction, and abnormal-status calculation.
- `database/security.ts`: SQLCipher key management and in-place plaintext-to-encrypted database migration.
- `utils/backup.ts`, `utils/reportExport.ts`, `utils/notifications.ts`: encrypted backup/restore, local exports, and local reminders.

## Data model

- Core tables: `patients`, `vital_signs`, `lab_results`, `documents`, `medications`, `clinical_entries`, `reminders`, and `app_settings`.
- All core tables have an active UI/repository workflow. Security preferences and `selected_patient_id` live in `app_settings`.
- Vital types: blood pressure, heart rate, weight, temperature, and SpO2.
- Lab types: glucose, HbA1c, creatinine, AST, ALT, and cholesterol.
- Documents store a display name, file type/path, category, document date, hospital, doctor, notes, raw OCR text, and created/updated timestamps.
- Deleting a patient cascades to their health records. Destructive actions should retain confirmation prompts.

## Commands and verified caveats

- Start: `npm start`; native builds: `npm run ios` / `npm run android`; web: `npm run web`.
- Static check: `npm run typecheck`.
- Expo SDK 57 requires Node `>=20.19.4`; Node 18 cannot start Metro because modern array APIs are unavailable. Node 20.20.0 and 22.23.1 are installed under the local nvm directory on this machine.
- TypeScript 6 deprecation reporting for the Expo-compatible `baseUrl` alias is silenced with `ignoreDeprecations: "6.0"` so `npm run typecheck` can validate the project.
- `README.md` records the dependency fixes and the completed document workflows through Sprint 3.1.
- Native folders and installed/generated dependencies are present (`ios/Pods`, `node_modules`). Do not inspect or edit generated dependency code unless the task specifically requires it.
- Native document preview uses `@magrinj/expo-quick-look`: iOS presents Quick Look, while Android delegates to a compatible installed viewer. Images also have an in-app preview.
- Offline document OCR uses `@dariyd/react-native-text-recognition`: Apple Vision/PDFKit on iOS and ML Kit/PDFBox on Android. The Android Gradle dependency substitutes the downloadable Latin recognizer with its bundled equivalent so first-run OCR does not require a model download.
- React Native 0.86 New Architecture needs an iOS `modulesProvider` entry that the OCR package does not currently publish. `npm install` runs `scripts/patch-ocr-registration.js` to add it before CocoaPods/codegen; after a fresh install, run `pod install`/rebuild the iOS development app rather than using Expo Go.
- Dashboard, Timeline, and Document Inbox use `SafeAreaView` on their custom-header tab screens so content stays below status bars and Dynamic Island cutouts.
- Per user preference, do not run Android builds after each sprint. Run one Android build when the overall project is complete unless the user explicitly asks earlier.
- This directory currently has no active Git repository metadata; do not assume Git history or rollback is available.
- Sprints 7–11 are complete. The next unimplemented scope is Sprint 12 production hardening.
- SQLCipher is enabled through the Expo SQLite config plugin. Database/document keys are random and stored with SecureStore; documents use XChaCha20-Poly1305 and backup files use password-derived AES-GCM.
- iOS may change the absolute app-container UUID after reinstalling a development build. `locateStoredDocument` rebases legacy document paths by filename into the current app documents directory.
- Do not use Expo Go for OCR, Quick Look, SQLCipher, Local Authentication, Notifications, Print, or Sharing. Run CocoaPods and rebuild the native development app after dependency changes.
- Parser smoke test: `npm run test:parser` under Node 22. It covers 17 chemistry/CBC analytes, dates, ranges, aliases, specificity, abnormal flags, wrapped OCR lines, and unit conversion.
- Full logic smoke test: `npm test`; static validation: `npm run typecheck`.
