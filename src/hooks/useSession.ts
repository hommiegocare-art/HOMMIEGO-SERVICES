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

// ---- module-level store ----
let cachedProfile: Profile | null = null;
let cachedUserId: string | null = null;
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
    emit();
}

export function useSession(): SessionState {
    const [, force] = useState(0);
    const [session, setSession] = useState<Session | null>(cachedSession);
    const [user, setUser] = useState<SessionUser | null>(cachedProfile);
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
                try {
                    const p = await loadProfile(data.session.user.id);
                    if (!mounted) return;
                    setUser(p);
                } catch (e) {
                    if (!mounted) return;
                    setError(e instanceof Error ? e.message : "Failed to load profile");
                    setUser(null);
                }
            } else {
                cachedProfile = null;
                cachedUserId = null;
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
    cachedProfile = null;
    cachedUserId = null;
    cachedSession = null;
    inflightProfile = null;
    emit();
    await supabase.auth.signOut();
}