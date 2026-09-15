import { getRandomBytesAsync } from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

const encoder=new TextEncoder();const decoder=new TextDecoder();
export function bytesToBase64(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
export function base64ToBytes(value:string){const binary=atob(value);const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}
export async function encryptWithPassword(value:string,password:string){const salt=await getRandomBytesAsync(16);const nonce=await getRandomBytesAsync(12);const key=await pbkdf2Async(sha256,password,salt,{c:210000,dkLen:32});const encrypted=gcm(key,nonce).encrypt(encoder.encode(value));return JSON.stringify({format:'health-tracker-backup',version:1,kdf:'PBKDF2-SHA256',iterations:210000,salt:bytesToBase64(salt),nonce:bytesToBase64(nonce),ciphertext:bytesToBase64(encrypted)});}
export async function decryptWithPassword(value:string,password:string){const envelope=JSON.parse(value);if(envelope?.format!=='health-tracker-backup'||envelope?.version!==1)throw new Error('Định dạng backup không hợp lệ.');const key=await pbkdf2Async(sha256,password,base64ToBytes(envelope.salt),{c:envelope.iterations,dkLen:32});return decoder.decode(gcm(key,base64ToBytes(envelope.nonce)).decrypt(base64ToBytes(envelope.ciphertext)));}
