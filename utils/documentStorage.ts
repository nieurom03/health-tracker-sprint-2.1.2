import { Directory, File, Paths } from 'expo-file-system';
import { locateStoredDocument, protectStoredDocument } from '@/utils/protectedFile';

const DOCUMENTS_FOLDER = 'medical-documents';

function safeExtension(fileName: string, mimeType?: string | null) {
  const match = fileName.match(/\.([a-zA-Z0-9]{1,8})$/);
  if (match) return match[1].toLowerCase();
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'heic';
  return 'jpg';
}

function safeBaseName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'tai-lieu';
}

export async function persistDocumentFile(
  sourceUri: string,
  originalName: string,
  mimeType?: string | null,
) {
  const directory = new Directory(Paths.document, DOCUMENTS_FOLDER);
  directory.create({ idempotent: true, intermediates: true });

  const extension = safeExtension(originalName, mimeType);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName(originalName)}.${extension}`;
  const destination = new File(directory, uniqueName);
  await new File(sourceUri).copy(destination);
  await protectStoredDocument(destination.uri);
  return destination;
}

export function removeStoredDocument(filePath: string) {
  const file = locateStoredDocument(filePath);
  if (file.exists) file.delete();
}
