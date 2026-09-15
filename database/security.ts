import { getRandomBytesAsync } from 'expo-crypto';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { bytesToHex } from '@noble/ciphers/utils.js';
import { migrateDb } from '@/database/migrations';

const DB_NAME='health-tracker.db';
const KEY_NAME='health_tracker_database_key_v1';
const READY_NAME='health_tracker_sqlcipher_ready_v1';

async function databaseKey(){let key=await SecureStore.getItemAsync(KEY_NAME);if(!key){key=bytesToHex(await getRandomBytesAsync(32));await SecureStore.setItemAsync(KEY_NAME,key,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});}return key;}
const sqlString=(value:string)=>value.replace(/'/g,"''");

export async function prepareDatabaseEncryption(){
 const probe=await openDatabaseAsync(DB_NAME);
 const cipher=await probe.getFirstAsync<{cipher_version?:string}>('PRAGMA cipher_version');
 await probe.closeAsync();
 if(!cipher?.cipher_version)return false;
 const key=await databaseKey();
 if(await SecureStore.getItemAsync(READY_NAME)){
   const db=await openDatabaseAsync(DB_NAME);
   await db.execAsync(`PRAGMA key = "x'${key}'"`);
   await db.getFirstAsync('SELECT count(*) AS total FROM sqlite_master');
   await db.closeAsync();return true;
 }
 const db=await openDatabaseAsync(DB_NAME);
 try{await db.getFirstAsync('SELECT count(*) AS total FROM sqlite_master');}catch{
   await db.closeAsync();
   const encryptedDb=await openDatabaseAsync(DB_NAME);
   await encryptedDb.execAsync(`PRAGMA key = "x'${key}'"`);await encryptedDb.getFirstAsync('SELECT count(*) AS total FROM sqlite_master');
   await SecureStore.setItemAsync(READY_NAME,'1');await encryptedDb.closeAsync();return true;
 }
 await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
 const encryptedPath=`${db.databasePath}.encrypted`;
 const staleEncrypted=new File(encryptedPath);if(staleEncrypted.exists)staleEncrypted.delete();
 const version=await db.getFirstAsync<{user_version:number}>('PRAGMA user_version');
 await db.execAsync(`ATTACH DATABASE '${sqlString(encryptedPath)}' AS encrypted KEY "x'${key}'"; SELECT sqlcipher_export('encrypted'); PRAGMA encrypted.user_version=${version?.user_version??0}; DETACH DATABASE encrypted;`);
 await db.closeAsync();
 const original=new File(db.databasePath);const backup=new File(`${db.databasePath}.plaintext-backup`);const encrypted=new File(encryptedPath);
 if(backup.exists)backup.delete();await original.copy(backup);await encrypted.move(original,{overwrite:true});
 const verify=await openDatabaseAsync(DB_NAME);await verify.execAsync(`PRAGMA key = "x'${key}'"`);await verify.getFirstAsync('SELECT count(*) AS total FROM sqlite_master');await verify.closeAsync();
 backup.delete();await SecureStore.setItemAsync(READY_NAME,'1');return true;
}

export async function initializeDatabase(db:SQLiteDatabase){
 const key=await databaseKey();
 await db.execAsync(`PRAGMA key = "x'${key}'"`);
 await migrateDb(db);
}
