// src/lib/pwaUpdate.ts
type Listener = () => void;

let updateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
const listeners = new Set<Listener>();
let updateAvailable = false;

/** Called from main.tsx once registerSW gives us a handle. */
export function setUpdateFn(fn: (reloadPage?: boolean) => Promise<void>) {
    updateFn = fn;
}

/** Called from main.tsx when the plugin reports a new version. */
export function markUpdateAvailable() {
    updateAvailable = true;
    listeners.forEach((l) => l());
}

/** Components subscribe to know when an update is pending. */
export function subscribeUpdate(listener: Listener) {
    listeners.add(listener);
    // If the update is already known, fire immediately so a late-mounted
    // banner still shows.
    if (updateAvailable) listener();
    return () => listeners.delete(listener);
}

/** Trigger the actual activation + reload. */
export async function applyUpdate(reloadPage: boolean) {
    if (!updateFn) {
        // Fallback: full page reload. Works even if the SW handle is missing.
        window.location.reload();
        return;
    }
    await updateFn(reloadPage);
}

export function isUpdateAvailable() {
    return updateAvailable;
}