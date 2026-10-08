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

let cachedProfile: Profile | null = null;
let cachedUserId: string | null = null;

export function useSession(): SessionState {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<SessionUser | null>(cachedProfile);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadProfile(userId: string) {
            if (cachedUserId === userId && cachedProfile) {
                if (mounted) {
                    setUser(cachedProfile);
                    setLoading(false);
                }
                return;
            }
            const { data, error: qErr } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (!mounted) return;
            if (qErr) {
                setError(qErr.message);
                setUser(null);
            } else {
                cachedProfile = (data as Profile) ?? null;
                cachedUserId = userId;
                setUser(cachedProfile);
            }
            setLoading(false);
        }

        supabase.auth.getSession().then(({ data, error: sErr }) => {
            if (!mounted) return;
            if (sErr) {
                setError(sErr.message);
                setLoading(false);
                return;
            }
            setSession(data.session);
            if (data.session?.user) {
                loadProfile(data.session.user.id);
            } else {
                cachedProfile = null;
                cachedUserId = null;
                setUser(null);
                setLoading(false);
            }
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (!mounted) return;
            setSession(newSession);
            if (newSession?.user) {
                setLoading(true);
                loadProfile(newSession.user.id);
            } else {
                cachedProfile = null;
                cachedUserId = null;
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    return { user, session, loading, error };
}

export async function signOut() {
    cachedProfile = null;
    cachedUserId = null;
    await supabase.auth.signOut();
}

export function invalidateSessionCache() {
    cachedProfile = null;
    cachedUserId = null;
}