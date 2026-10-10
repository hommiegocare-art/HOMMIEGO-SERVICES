// src/hooks/useNotificationReactor.ts
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { reactToNewNotifications } from "@/lib/notificationReactor";

const POLL_MS = 15_000;

export function useNotificationReactor() {
    const { user } = useSession();
    const userId = user?.id ?? null;

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        const tick = () => {
            if (cancelled) return;
            void reactToNewNotifications(userId);
        };

        // 1) Initial run — sets the baseline silently
        tick();

        // 2) Poll on interval
        const intervalId = window.setInterval(tick, POLL_MS);

        // 3) Catch up when the tab regains focus
        const onFocus = () => tick();
        window.addEventListener("focus", onFocus);

        // 4) Catch up when the tab becomes visible (iOS Safari doesn't
        //    reliably fire `focus` after app-switch)
        const onVisibility = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisibility);

        // 5) Catch up after network comes back
        const onOnline = () => tick();
        window.addEventListener("online", onOnline);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("online", onOnline);
        };
    }, [userId]);
}