import { getRandomBytesAsync } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hexToBytes, bytesToHex } from '@noble/ciphers/utils.js';

const KEY_NAME = 'health_tracker_document_key_v1';
const MAGIC = new TextEncoder().encode('HTE1');
const AAD = new TextEncoder().encode('health-tracker-document-v1');

export function locateStoredDocument(filePath: string) {
  const original = new File(filePath);
  if (original.exists) return original;
  const encodedName = filePath.split('/').filter(Boolean).at(-1);
  const name = encodedName ? decodeURIComponent(encodedName) : '';
  if (!name) return original;
  const current = new File(new Directory(Paths.document, 'medical-documents'), name);
  return current.exists ? current : original;
}

async function documentKey() {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    key = bytesToHex(await getRandomBytesAsync(32));
    await SecureStore.setItemAsync(KEY_NAME, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return hexToBytes(key);
}

function isEncrypted(bytes: Uint8Array) {
  return MAGIC.every((value, index) => bytes[index] === value);
}

async function seal(bytes: Uint8Array) {
  const nonce = await getRandomBytesAsync(24);
  const encrypted = xchacha20poly1305(await documentKey(), nonce, AAD).encrypt(bytes);
  const result = new Uint8Array(MAGIC.length + nonce.length + encrypted.length);
  result.set(MAGIC);
  result.set(nonce, MAGIC.length);
  result.set(encrypted, MAGIC.length + nonce.length);
  return result;
}

async function open(bytes: Uint8Array) {
  if (!isEncrypted(bytes)) return bytes;
  const nonce = bytes.slice(MAGIC.length, MAGIC.length + 24);
  const payload = bytes.slice(MAGIC.length + 24);
  return xchacha20poly1305(await documentKey(), nonce, AAD).decrypt(payload);
}

/** Encrypts a stored document in-place. Existing encrypted files are left unchanged. */
export async function protectStoredDocument(filePath: string) {
  const file = locateStoredDocument(filePath);
  const bytes = await file.bytes();
  if (isEncrypted(bytes)) return file;
  file.write(await seal(bytes));
  return file;
}

/**
 * Returns a temporary plaintext URI for native preview/OCR. Legacy plaintext files are
 * encrypted in-place during this first access.
 */
export async function materializeDocument(filePath: string, displayName: string) {
  const source = locateStoredDocument(filePath);
  if (!source.exists) throw new Error('File tài liệu không còn trên thiết bị.');
  const sourceBytes = await source.bytes();
  const plaintext = await open(sourceBytes);

  if (!isEncrypted(sourceBytes)) source.write(await seal(sourceBytes));

  const directory = new Directory(Paths.cache, 'medical-document-preview');
  directory.create({ idempotent: true, intermediates: true });
  const safeName = displayName.replace(/[^a-zA-Z0-9._-]+/g, '-') || 'document';
  const target = new File(directory, `${Date.now()}-${safeName}`);
  target.create({ overwrite: true, intermediates: true });
  target.write(plaintext);
  return target.uri;
}

export async function storedDocumentIsEncrypted(filePath: string) {
  const file = locateStoredDocument(filePath);
  if (!file.exists) return false;
  return isEncrypted(await file.bytes());
}

export function clearMaterializedDocuments() {
  const directory = new Directory(Paths.cache, 'medical-document-preview');
  if (directory.exists) directory.delete();
}
