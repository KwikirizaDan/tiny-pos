"use client";

const DB_NAME = "tinypos-db";
const DB_VERSION = 1;

export async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pendingSales")) {
        db.createObjectStore("pendingSales", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export async function syncToIDB(storeName: string, data: any[]) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await Promise.all([
    ...data.map((item) => store.put(item)),
    new Promise((resolve) => (tx.oncomplete = resolve)),
  ]);
}

export async function getFromIDB(storeName: string) {
  const db = await openDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingSale(sale: any) {
  const db = await openDB();
  const tx = db.transaction("pendingSales", "readwrite");
  const store = tx.objectStore("pendingSales");
  store.add(sale);
}

export async function getPendingSales() {
  return getFromIDB("pendingSales");
}

export async function clearPendingSale(id: number) {
  const db = await openDB();
  const tx = db.transaction("pendingSales", "readwrite");
  const store = tx.objectStore("pendingSales");
  store.delete(id);
}
