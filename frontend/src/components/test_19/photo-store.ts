const DATABASE = "travel-club-test-19-photos";
const STORE = "photos";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("Хранилище фотографий недоступно в этом браузере."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Закройте другие вкладки этой страницы и попробуйте снова."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let result: T;
    let tx: IDBTransaction;
    try {
      tx = database.transaction(STORE, mode);
      const request = operation(tx.objectStore(STORE));
      request.onsuccess = () => { result = request.result; };
    } catch (error) {
      database.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => { database.close(); resolve(result); };
    tx.onabort = () => { database.close(); reject(tx.error ?? new Error("Не удалось завершить сохранение.")); };
    tx.onerror = () => { database.close(); reject(tx.error ?? new Error("Хранилище фотографий недоступно.")); };
  });
}

export async function loadPhoto(slotId: string): Promise<Blob | undefined> {
  const result = await transaction<unknown>("readonly", store => store.get(slotId));
  if (result !== undefined && !(result instanceof Blob)) throw new Error("Сохранённое фото повреждено. Верните исходное фото.");
  return result as Blob | undefined;
}

export async function savePhoto(slotId: string, blob: Blob): Promise<void> {
  await transaction("readwrite", store => store.put(blob, slotId));
}

export async function resetPhoto(slotId: string): Promise<void> {
  await transaction("readwrite", store => store.delete(slotId));
}
