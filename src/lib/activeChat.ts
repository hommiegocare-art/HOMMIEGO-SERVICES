// src/lib/activeChat.ts

/**
 * Tracks which chat connectionId the user is currently viewing.
 *
 * ChatWindow sets this when it mounts and clears it when it unmounts.
 * Anything that plays a notification sound reads it to decide whether
 * to stay silent (user is already looking at the chat) or make noise.
 */

let activeConnectionId: string | null = null;

export function setActiveChatConnection(id: string | null): void {
    activeConnectionId = id;
}

export function getActiveChatConnection(): string | null {
    // If the tab isn't visible, treat nothing as active — the user
    // can't be "looking at" a chat they can't see.
    if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
    ) {
        return null;
    }
    return activeConnectionId;
}