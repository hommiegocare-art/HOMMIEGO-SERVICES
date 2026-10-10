// src/hooks/useChatTyping.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const TYPING_TTL_MS = 6_000;   // stale after this
const TYPING_RESET_MS = 3_000; // stop signalling after this idle

interface PresenceEntry {
    user_id: string;
    typing: boolean;
    at: number;
    tab: string; // per-tab id, so multi-tab doesn't clobber itself
}

const TAB_ID =
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

export interface UseChatTyping {
    otherTyping: boolean;
    signalTyping: () => void;
    stopTyping: () => void;
}

export function useChatTyping(
    connectionId: string | undefined,
    enabled: boolean,
): UseChatTyping {
    const { user } = useSession();
    const [otherTyping, setOtherTyping] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const idleTimerRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    const clearIdleTimer = () => {
        if (idleTimerRef.current !== null) {
            window.clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    };

    const recomputeOtherTyping = useCallback(() => {
        const ch = channelRef.current;
        if (!ch || !user) {
            setOtherTyping(false);
            return;
        }
        const state = ch.presenceState() as Record<string, PresenceEntry[]>;
        const now = Date.now();
        let found = false;
        for (const key of Object.keys(state)) {
            for (const entry of state[key]) {
                // Match by user_id, not by presence key: multi-tab means
                // multiple presence keys can belong to the same user.
                if (
                    entry.user_id &&
                    entry.user_id !== user.id &&
                    entry.typing === true &&
                    now - (entry.at ?? 0) < TYPING_TTL_MS
                ) {
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        setOtherTyping(found);
    }, [user]);

    const track = useCallback(
        (typing: boolean) => {
            const ch = channelRef.current;
            if (!ch || !user) return;
            void ch.track({
                user_id: user.id,
                typing,
                at: Date.now(),
                tab: TAB_ID,
            } satisfies PresenceEntry);
        },
        [user],
    );

    const signalTyping = useCallback(() => {
        if (!channelRef.current || !user) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            track(true);
        }
        clearIdleTimer();
        idleTimerRef.current = window.setTimeout(() => {
            isTypingRef.current = false;
            track(false);
        }, TYPING_RESET_MS);
    }, [track, user]);

    const stopTyping = useCallback(() => {
        if (!isTypingRef.current) return;
        isTypingRef.current = false;
        clearIdleTimer();
        track(false);
    }, [track]);

    useEffect(() => {
        if (!enabled || !connectionId || !user) return;

        const channel = supabase.channel(`chat-typing:${connectionId}`, {
            config: { presence: { key: `${user.id}:${TAB_ID}` } },
        });

        channel
            .on("presence", { event: "sync" }, () => recomputeOtherTyping())
            .on("presence", { event: "join" }, () => recomputeOtherTyping())
            .on("presence", { event: "leave" }, () => recomputeOtherTyping())
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    track(false);
                    recomputeOtherTyping();
                }
            });

        channelRef.current = channel;

        // Tab-restore safety: if the browser suspends the tab and the
        // websocket drops, we want to re-announce on return.
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                isTypingRef.current = false;
                track(false);
                recomputeOtherTyping();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        // Stale-signal sweep.
        const sweep = window.setInterval(recomputeOtherTyping, 2_000);

        return () => {
            window.clearInterval(sweep);
            document.removeEventListener("visibilitychange", onVisible);
            clearIdleTimer();
            isTypingRef.current = false;
            channelRef.current = null;
            void supabase.removeChannel(channel);
            setOtherTyping(false);
        };
    }, [enabled, connectionId, user, recomputeOtherTyping, track]);

    return { otherTyping, signalTyping, stopTyping };
}