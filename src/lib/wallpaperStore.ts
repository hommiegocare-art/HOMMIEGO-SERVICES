/**
 * Tiny IndexedDB wrapper for storing chat wallpaper images locally.
 * One object store: "images" keyed by connectionId. Value = { blob, mime, updatedAt }.
 */

const DB_NAME = "chat-wallpapers";
const DB_VERSION = 1;
const STORE = "images";

type StoredImage = {
    connectionId: string;
    blob: Blob;
    mime: string;
    updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB not available"));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "connectionId" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

function tx<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    return getDb().then(
        (db) =>
            new Promise<T>((resolve, reject) => {
                const t = db.transaction(STORE, mode);
                const store = t.objectStore(STORE);
                const req = fn(store);
                req.onsuccess = () => resolve(req.result as T);
                req.onerror = () => reject(req.error);
                t.onabort = () => reject(t.error);
            }),
    );
}

export async function putWallpaperImage(
    connectionId: string,
    file: Blob,
): Promise<void> {
    const rec: StoredImage = {
        connectionId,
        blob: file,
        mime: file.type || "image/jpeg",
        updatedAt: Date.now(),
    };
    await tx("readwrite", (store) => store.put(rec) as IDBRequest<IDBValidKey>);
}

export async function getWallpaperImage(
    connectionId: string,
): Promise<Blob | null> {
    const rec = await tx<StoredImage | undefined>("readonly", (store) =>
        store.get(connectionId) as IDBRequest<StoredImage | undefined>,
    );
    return rec?.blob ?? null;
}

export async function deleteWallpaperImage(connectionId: string): Promise<void> {
    await tx("readwrite", (store) =>
        store.delete(connectionId) as IDBRequest<undefined>,
    );
}

/**
 * Build an object URL for a stored wallpaper. Caller must revoke it when done.
 */
export async function getWallpaperObjectUrl(
    connectionId: string,
): Promise<string | null> {
    const blob = await getWallpaperImage(connectionId);
    return blob ? URL.createObjectURL(blob) : null;
}