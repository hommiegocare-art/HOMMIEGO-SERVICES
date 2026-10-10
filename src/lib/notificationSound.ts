// src/lib/notificationSound.ts
const SRC = "/Notification.mp3";

let audio: HTMLAudioElement | null = null;
let unlocked = false;
let lastPlayed = 0;
const MIN_GAP_MS = 800;

let muted = false;

/* ---------------- mute toggle ---------------- */

export function setSoundMuted(v: boolean) {
    muted = v;
    try {
        localStorage.setItem("notif_sound_muted", v ? "1" : "0");
    } catch { }
}

export function isSoundMuted(): boolean {
    if (muted) return true;
    try {
        return localStorage.getItem("notif_sound_muted") === "1";
    } catch {
        return false;
    }
}

/* ---------------- audio singleton ---------------- */

function getAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!audio) {
        audio = new Audio(SRC);
        audio.preload = "auto";
        audio.volume = 0.6;
        audio.muted = false;
    }
    return audio;
}

/* ---------------- autoplay unlock ---------------- */

/**
 * Call once on the first user gesture (click, tap, keypress).
 * Browsers refuse to play audio until the user has interacted.
 */
export function unlockNotificationSound() {
    if (unlocked) return;
    const a = getAudio();
    if (!a) return;

    a.muted = true;
    a.play()
        .then(() => {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
            unlocked = true;
        })
        .catch(() => {
            a.muted = false;
        });
}

/* ---------------- play ---------------- */

export function playNotificationSound() {
    if (isSoundMuted()) return;

    const a = getAudio();
    if (!a) return;

    const now = Date.now();
    if (now - lastPlayed < MIN_GAP_MS) return;
    lastPlayed = now;

    a.muted = false;
    if (a.volume === 0) a.volume = 0.6;

    try {
        a.currentTime = 0;
        void a.play().catch(() => { });
    } catch {
        /* noop */
    }
}