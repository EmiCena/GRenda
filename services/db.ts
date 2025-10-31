import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Lesson, Progress, User } from '../types';
import { lessons as mockLessons } from '../data/mockData';

const DB_NAME = 'GuaraniRendaDB';
const DB_VERSION = 1;

// Define the database schema
interface GuaraniRendaDB extends DBSchema {
  lessons: {
    key: string;
    value: Lesson;
  };
  progress: {
    key: string; // lessonId
    value: { score: number; completed: boolean };
  };
  user: {
    key: 'currentUser';
    value: User;
  };
}

let dbPromise: Promise<IDBPDatabase<GuaraniRendaDB>>;

const getDb = (): Promise<IDBPDatabase<GuaraniRendaDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<GuaraniRendaDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress');
        }
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
      },
    });
  }
  return dbPromise;
};

// Seed initial data if necessary
export const initDB = async () => {
  const db = await getDb();
  const tx = db.transaction('lessons', 'readonly');
  const count = await tx.store.count();
  await tx.done;

  if (count === 0) {
    const writeTx = db.transaction('lessons', 'readwrite');
    await Promise.all(mockLessons.map(lesson => writeTx.store.put(lesson)));
    await writeTx.done;
  }
};

// --- User Functions ---
export const dbGetUser = async (): Promise<User | undefined> => {
  const db = await getDb();
  return db.get('user', 'currentUser');
};

export const dbSetUser = async (user: User): Promise<void> => {
  const db = await getDb();
  await db.put('user', user, 'currentUser');
};

export const dbDeleteUser = async (): Promise<void> => {
  const db = await getDb();
  await db.delete('user', 'currentUser');
};

// --- Lesson Functions ---
export const dbGetAllLessons = async (): Promise<Lesson[]> => {
  const db = await getDb();
  return db.getAll('lessons');
};

export const dbAddLesson = async (lesson: Lesson): Promise<void> => {
  const db = await getDb();
  await db.put('lessons', lesson);
};

export const dbUpdateLesson = async (lesson: Lesson): Promise<void> => {
  const db = await getDb();
  await db.put('lessons', lesson);
};

export const dbDeleteLesson = async (lessonId: string): Promise<void> => {
  const db = await getDb();
  await db.delete('lessons', lessonId);
};

// --- Progress Functions ---
export const dbGetAllProgress = async (): Promise<Progress> => {
    const db = await getDb();
    const progressStore = db.transaction('progress').store;
    const allProgress: Progress = {};
    let cursor = await progressStore.openCursor();
    while (cursor) {
        allProgress[cursor.key] = cursor.value;
        cursor = await cursor.continue();
    }
    return allProgress;
};

export const dbUpdateProgress = async (lessonId: string, data: { score: number; completed: boolean }): Promise<void> => {
  const db = await getDb();
  await db.put('progress', data, lessonId);
};
