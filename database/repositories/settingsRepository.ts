import type { SQLiteDatabase } from 'expo-sqlite';
export async function getSetting(db:SQLiteDatabase,key:string){return (await db.getFirstAsync<{value:string|null}>('SELECT value FROM app_settings WHERE key=?',key))?.value??null;}
export async function setSetting(db:SQLiteDatabase,key:string,value:string|null){if(value===null)return db.runAsync('DELETE FROM app_settings WHERE key=?',key);return db.runAsync(`INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,key,value);}
