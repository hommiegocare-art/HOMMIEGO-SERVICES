// src/lib/notificationReactor.ts
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/types/db";
import { playNotificationSound } from "@/lib/notificationSound";
import { pushNotificationToast } from "@/components/notifications/NotificationToastHost";
import { getActiveChatConnection } from "@/lib/activeChat";
import { getLastReactedAt, setLastReactedAt } from "@/lib/seenNotifications";

let running = false;

/**
 * Fetch any notifications newer than the last-reacted watermark for this user.
 * If new ones exist AND we've already seen a baseline before, play sound + toast.
 * Advances the watermark.
 *
 * Safe to call as often as you want — dedupes concurrent calls.
 * Returns the number of new notifications processed.
 */
export async function reactToNewNotifications(userId: string): Promise<number> {
    if (running) return 0;
    running = true;
    try {
        const since = getLastReactedAt(userId);

        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .gt("created_at", since)
            .order("created_at", { ascending: true })
            .limit(20);

        if (error || !data || data.length === 0) return 0;

        const rows = data as Notification[];
        const newest = rows[rows.length - 1].created_at;

        // If watermark is epoch, this is the very first fetch after mount.
        // Just record where we are — don't sound off for the backlog.
        const isFirstFetch = since === new Date(0).toISOString();
        if (isFirstFetch) {
            setLastReactedAt(userId, newest);
            return 0;
        }

        // Filter out rows the user is actively looking at
        // (e.g. chat message notification while already in that chat).
        const toReact = rows.filter((n) => {
            if (n.type !== "chat_message") return true;
            const m = n.link?.match(/^\/chats\/([^/]+)/);
            if (!m) return true;
            return getActiveChatConnection() !== m[1];
        });

        if (toReact.length > 0) {
            playNotificationSound();
            toReact.forEach(pushNotificationToast);
        }

        setLastReactedAt(userId, newest);
        return toReact.length;
    } finally {
        running = false;
    }
}