// src/hooks/usePresence.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const HEARTBEAT_INTERVAL_MS = 60_000; // 60s
const VISIBILITY_RESUME_MS = 5_000;   // if tab was hidden > 5s, ping on return

/**
 * Automatic presence. Call once at the app root (inside Shell) for signed-in
 * caregivers. Pings `caregiver_heartbeat()` on mount, on a 60s interval, and
 * when the tab regains visibility. Does nothing for clients.
 */
export function usePresence() {
    const { user } = useSession();
    const lastPingRef = useRef<number>(0);
    const hiddenAtRef = useRef<number | null>(null);

    useEffect(() => {
        if (!user || user.role !== "caregiver") return;

        let cancelled = false;
        let intervalId: number | null = null;

        const ping = async () => {
            if (cancelled) return;
            const now = Date.now();
            // Avoid double-fire if a visibility event and interval collide
            if (now - lastPingRef.current < 5_000) return;
            lastPingRef.current = now;

            const { error } = await supabase.rpc("caregiver_heartbeat");
            if (error) {
                // Silent failure — presence is best-effort, never blocking
                console.warn("[presence] heartbeat failed:", error.message);
            }
        };

        // 1. Immediate ping on mount
        ping();

        // 2. Interval ping while tab is visible
        intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                ping();
            }
        }, HEARTBEAT_INTERVAL_MS);

        // 3. Ping when tab becomes visible again (if it was hidden for a while)
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                const hiddenFor =
                    hiddenAtRef.current !== null ? Date.now() - hiddenAtRef.current : 0;
                hiddenAtRef.current = null;
                if (hiddenFor > VISIBILITY_RESUME_MS) {
                    ping();
                }
            } else {
                hiddenAtRef.current = Date.now();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // 4. Best-effort ping on page unload (not reliable; the 3-min timeout
        //    handles the true close case anyway).
        const onBeforeUnload = () => {
            // Fire-and-forget; browsers may or may not deliver it
            supabase.rpc("caregiver_heartbeat").then(() => undefined, () => undefined);
        };
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            cancelled = true;
            if (intervalId !== null) window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [user]);
}