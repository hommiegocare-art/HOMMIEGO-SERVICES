// src/lib/careTeamSounds.ts
//
// Central place for care team notification sounds.
//
// Current behaviour: plays a short chime when a message arrives in the
// open thread and the sender is not me. Rules for who plays what live
// here — edit this file, no other file needs to change.
//
// To change the default sound: drop a new file in `/public/sounds/` and
// point DEFAULT_SOUND at it. To give a specific thread its own sound,
// add an entry to THREAD_SOUNDS.

const DEFAULT_SOUND = "/sounds/care-team-message.mp3";

// Optional per-thread overrides. Key = care_team_threads.id.
const THREAD_SOUNDS: Record<string, string> = {
    // "3f5e8a10-...": "/sounds/urgent-team.mp3",
};

// Optional per-role overrides. Key = sender role inside the thread.
// Use this if you want doctor messages to chime differently than
// caregiver messages, for example.
const ROLE_SOUNDS: Record<string, string> = {
    // doctor: "/sounds/doctor-message.mp3",
    // caregiver: "/sounds/caregiver-message.mp3",
    // client: "/sounds/patient-message.mp3",
};

let audioEl: HTMLAudioElement | null = null;

function resolveSrc(threadId: string, senderRole: string | null): string {
    if (threadId && THREAD_SOUNDS[threadId]) return THREAD_SOUNDS[threadId];
    if (senderRole && ROLE_SOUNDS[senderRole]) return ROLE_SOUNDS[senderRole];
    return DEFAULT_SOUND;
}

/**
 * Play the incoming-message sound.
 *
 * Safe to call anywhere. Silently no-ops if:
 *   - the browser blocks autoplay (user hasn't interacted yet),
 *   - the sound file is missing,
 *   - anything else goes wrong.
 *
 * Never throws. Never blocks.
 */
export function playCareTeamIncomingSound(
    threadId: string,
    senderRole: string | null
): void {
    if (typeof window === "undefined") return;

    try {
        const src = resolveSrc(threadId, senderRole);

        // Reuse a single <audio> element so rapid successive messages don't
        // stack ten overlapping players.
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.preload = "auto";
            audioEl.volume = 0.6;
        }

        if (audioEl.src !== new URL(src, window.location.origin).href) {
            audioEl.src = src;
        }

        // Rewind if it's already playing — latest message wins.
        audioEl.currentTime = 0;

        const p = audioEl.play();
        if (p && typeof p.catch === "function") {
            p.catch(() => {
                /* autoplay blocked or file missing — silent */
            });
        }
    } catch {
        /* never throw */
    }
}

/**
 * Optionally mute/unmute globally. Wire this to a user setting later
 * if you want.
 */
let muted = false;

export function setCareTeamSoundsMuted(next: boolean): void {
    muted = next;
}

export function isCareTeamSoundsMuted(): boolean {
    return muted;
}

/**
 * Convenience wrapper that honours the muted flag.
 * Use this from the hook, not the raw function above.
 */
export function notifyCareTeamMessage(
    threadId: string,
    senderRole: string | null
): void {
    if (muted) return;
    playCareTeamIncomingSound(threadId, senderRole);
}