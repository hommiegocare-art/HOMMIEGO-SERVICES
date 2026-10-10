// src/lib/seenNotifications.ts

/**
 * Remembers, per user, the timestamp of the newest notification this
 * browser has already reacted to (played sound + toast).
 *
 * Stored in localStorage so it survives reloads.
 */

const KEY = "notif:last-reacted-at";

export function getLastReactedAt(userId: string): string {
    try {
        const v = localStorage.getItem(`${KEY}:${userId}`);
        return v ?? new Date(0).toISOString(); // epoch = "nothing seen yet"
    } catch {
        return new Date(0).toISOString();
    }
}

export function setLastReactedAt(userId: string, iso: string): void {
    try {
        localStorage.setItem(`${KEY}:${userId}`, iso);
    } catch {
        /* quota — ignore */
    }
}

export function resetLastReactedAt(userId: string): void {
    try {
        localStorage.removeItem(`${KEY}:${userId}`);
    } catch { }
}