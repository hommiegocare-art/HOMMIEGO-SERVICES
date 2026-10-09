// src/lib/medicalWindow.ts
export const MEDICAL_EDIT_WINDOW_HOURS = 24;

export function isWithinWindow(
    createdAt: string | null | undefined,
    windowHours = MEDICAL_EDIT_WINDOW_HOURS,
): boolean {
    if (!createdAt) return true;
    const t = new Date(createdAt).getTime();
    if (isNaN(t)) return true;
    return Date.now() - t < windowHours * 3600 * 1000;
}

export function hoursLeft(
    createdAt: string | null | undefined,
    windowHours = MEDICAL_EDIT_WINDOW_HOURS,
): number {
    if (!createdAt) return windowHours;
    const t = new Date(createdAt).getTime();
    if (isNaN(t)) return windowHours;
    const remaining = windowHours * 3600 * 1000 - (Date.now() - t);
    return Math.max(0, Math.floor(remaining / (3600 * 1000)));
}

export function windowExpiryLabel(createdAt: string): string {
    const d = new Date(
        new Date(createdAt).getTime() + MEDICAL_EDIT_WINDOW_HOURS * 3600 * 1000,
    );
    return d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}