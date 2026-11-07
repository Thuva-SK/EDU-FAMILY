const DB_NAME = "eduFamilyFiles";
const DB_STORE = "files";

export function openFileDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFile(fileId, file) {
  const db = await openFileDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(file, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFile(fileId) {
  const db = await openFileDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const request = tx.objectStore(DB_STORE).get(fileId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getFileUrl(fileId) {
  if (!fileId) return "";
  try {
    const file = await getFile(fileId);
    return file ? URL.createObjectURL(file) : "";
  } catch (err) {
    console.warn("IndexedDB getFileUrl error:", err);
    return "";
  }
}
