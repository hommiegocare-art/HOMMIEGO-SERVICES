// src/hooks/useSession.ts
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/db";

export type SessionUser = Profile;

type SessionState = {
    user: SessionUser | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
};

// ============================================================
// Persisted cache — survives hard reloads
// ============================================================
const PROFILE_CACHE_KEY = "hommiecare:cached-profile";
const PROFILE_CACHE_USER_KEY = "hommiecare:cached-profile-user-id";

function readCachedProfile(): Profile | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Profile;
        if (!parsed || typeof parsed !== "object" || !parsed.id || !parsed.role) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function readCachedUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(PROFILE_CACHE_USER_KEY);
    } catch {
        return null;
    }
}

function writeCachedProfile(p: Profile | null) {
    if (typeof window === "undefined") return;
    try {
        if (p) {
            window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
            window.localStorage.setItem(PROFILE_CACHE_USER_KEY, p.id);
        } else {
            window.localStorage.removeItem(PROFILE_CACHE_KEY);
            window.localStorage.removeItem(PROFILE_CACHE_USER_KEY);
        }
    } catch {
        /* quota errors — ignore */
    }
}

// ============================================================
// Module-level store
// ============================================================
let cachedProfile: Profile | null = readCachedProfile();
let cachedUserId: string | null = readCachedUserId();
let cachedSession: Session | null = null;
let inflightProfile: Promise<Profile | null> | null = null;

// subscribers = every mounted useSession() caller
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((fn) => fn());
}

async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return (data as Profile) ?? null;
}

async function loadProfile(userId: string, force = false) {
    if (!force && cachedUserId === userId && cachedProfile) {
        return cachedProfile;
    }
    // de-dupe concurrent fetches for the same user
    if (!force && inflightProfile && cachedUserId === userId) {
        return inflightProfile;
    }
    cachedUserId = userId;
    inflightProfile = fetchProfile(userId)
        .then((p) => {
            cachedProfile = p;
            cachedUserId = p?.id ?? userId;
            writeCachedProfile(p);
            inflightProfile = null;
            emit();
            return p;
        })
        .catch((e) => {
            inflightProfile = null;
            throw e;
        });
    return inflightProfile;
}

/**
 * Force a re-fetch of the current user's profile and notify all subscribers.
 * Call this after updating `profiles` so BottomNav / Header / etc. re-render.
 */
export async function refreshSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return;
    cachedSession = data.session;
    if (data.session?.user) {
        try {
            await loadProfile(data.session.user.id, /* force */ true);
        } catch {
            /* swallow; hook will surface error next render */
        }
    }
    emit();
}

export function invalidateSessionCache() {
    cachedProfile = null;
    cachedUserId = null;
    cachedSession = null;
    inflightProfile = null;
    writeCachedProfile(null);
    emit();
}

export function useSession(): SessionState {
    const [, force] = useState(0);
    const [session, setSession] = useState<Session | null>(cachedSession);
    const [user, setUser] = useState<SessionUser | null>(cachedProfile);
    // Loading starts false when we already have a cached profile —
    // so the avatar renders on the first paint, no "U" flash.
    const [loading, setLoading] = useState<boolean>(cachedProfile === null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // subscribe to store changes so profile updates propagate
        const rerender = () => {
            if (!mounted) return;
            setUser(cachedProfile);
            setSession(cachedSession);
            setLoading(false);
        };
        listeners.add(rerender);

        async function bootstrap() {
            const { data, error: sErr } = await supabase.auth.getSession();
            if (!mounted) return;
            if (sErr) {
                setError(sErr.message);
                setLoading(false);
                return;
            }
            cachedSession = data.session;
            setSession(data.session);

            if (data.session?.user) {
                // If the cached profile belongs to a *different* user,
                // wipe it before fetching — prevents showing the wrong name.
                if (cachedUserId && cachedUserId !== data.session.user.id) {
                    cachedProfile = null;
                    cachedUserId = null;
                    writeCachedProfile(null);
                    if (mounted) setUser(null);
                }
                try {
                    const p = await loadProfile(data.session.user.id);
                    if (!mounted) return;
                    setUser(p);
                } catch (e) {
                    if (!mounted) return;
                    setError(e instanceof Error ? e.message : "Failed to load profile");
                    // keep cached profile visible on error; don't blank the UI
                }
            } else {
                cachedProfile = null;
                cachedUserId = null;
                writeCachedProfile(null);
                setUser(null);
            }
            if (mounted) setLoading(false);
        }

        bootstrap();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (!mounted) return;
            cachedSession = newSession;
            setSession(newSession);
            if (newSession?.user) {
                // auth state changed → bypass cache, refetch
                loadProfile(newSession.user.id, true)
                    .then((p) => mounted && setUser(p))
                    .catch((e) => mounted && setError(e?.message ?? "Failed"));
            } else {
                cachedProfile = null;
                cachedUserId = null;
                writeCachedProfile(null);
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            listeners.delete(rerender);
            sub.subscription.unsubscribe();
        };
    }, []);

    return { user, session, loading, error };
}

export async function signOut() {
    // 1. Clear the in-memory + persisted profile cache FIRST
    cachedProfile = null;
    cachedUserId = null;
    cachedSession = null;
    inflightProfile = null;
    writeCachedProfile(null);

    // 2. Remove all hommiecare + supabase keys from localStorage
    if (typeof window !== "undefined") {
        try {
            const toRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (!k) continue;
                if (k === "theme") continue;                // keep theme
                if (k.startsWith("sb-")) toRemove.push(k);  // supabase auth
                if (k.startsWith("hommiecare:")) toRemove.push(k);
            }
            toRemove.forEach((k) => window.localStorage.removeItem(k));
        } catch { /* ignore */ }

        try { window.sessionStorage.clear(); } catch { /* ignore */ }
    }

    // 3. Notify all subscribers so UI re-renders as signed-out
    emit();

    // 4. Tell Supabase to sign out (global so other tabs/devices too)
    try {
        await supabase.auth.signOut({ scope: "global" });
    } catch {
        try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
    }
}