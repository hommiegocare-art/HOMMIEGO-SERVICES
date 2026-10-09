// src/lib/push.ts
import { supabase } from "@/integrations/supabase/client";

// VAPID public key — generate this once (see instructions below)
// and put it in your .env file as VITE_VAPID_PUBLIC_KEY.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// ---------- Convert base64url VAPID key to Uint8Array ----------
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const rawData = atob(base64);
    const out = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
    return out;
}

// ---------- Check support ----------
export function pushSupported(): boolean {
    if (typeof window === "undefined") return false;
    return (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

// ---------- Get current permission state ----------
export function getPermission(): NotificationPermission | "unsupported" {
    if (!pushSupported()) return "unsupported";
    return Notification.permission;
}

// ---------- Register the service worker ----------
async function ensureSW(): Promise<ServiceWorkerRegistration | null> {
    if (!pushSupported()) return null;
    try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        });
        // Wait until active
        if (reg.installing) {
            await new Promise<void>((resolve) => {
                const w = reg.installing!;
                w.addEventListener("statechange", () => {
                    if (w.state === "activated") resolve();
                });
            });
        }
        return reg;
    } catch (e) {
        console.error("[push] SW registration failed", e);
        return null;
    }
}

// ---------- Subscribe (ask permission + save to DB) ----------
export async function enablePush(userId: string): Promise<{
    ok: boolean;
    reason?: string;
}> {
    if (!pushSupported()) {
        return { ok: false, reason: "This device does not support push notifications." };
    }
    if (!VAPID_PUBLIC) {
        return {
            ok: false,
            reason: "Missing VAPID key. Add VITE_VAPID_PUBLIC_KEY to your environment.",
        };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return { ok: false, reason: "Permission denied." };
    }

    const reg = await ensureSW();
    if (!reg) return { ok: false, reason: "Service worker failed to register." };

    // Subscribe
    let sub: PushSubscription;
    try {
        sub =
            (await reg.pushManager.getSubscription()) ||
            (await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
            }));
    } catch (e) {
        console.error("[push] subscribe failed", e);
        return { ok: false, reason: "Could not create subscription." };
    }

    // Save to DB
    const json = sub.toJSON();
    const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
            {
                user_id: userId,
                endpoint: json.endpoint!,
                p256dh: json.keys!.p256dh!,
                auth: json.keys!.auth!,
                user_agent: navigator.userAgent.slice(0, 200),
                is_active: true,
                last_seen_at: new Date().toISOString(),
            },
            { onConflict: "endpoint" },
        );

    if (error) {
        console.error("[push] save failed", error);
        return { ok: false, reason: "Could not save subscription." };
    }

    return { ok: true };
}

// ---------- Unsubscribe (disable push on this device) ----------
export async function disablePush(userId: string): Promise<void> {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = reg ? await reg.pushManager.getSubscription() : null;

    if (sub) {
        try {
            await sub.unsubscribe();
        } catch {
            /* ignore */
        }
        await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("user_id", userId)
            .eq("endpoint", sub.endpoint);
    }
}

// ---------- Check if the current device is subscribed ----------
export async function isPushEnabled(userId: string): Promise<boolean> {
    if (!pushSupported()) return false;
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    // Confirm it's still in the DB and active
    const { data } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("endpoint", sub.endpoint)
        .eq("is_active", true)
        .maybeSingle();
    return !!data;
}