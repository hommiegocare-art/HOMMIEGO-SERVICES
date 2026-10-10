import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function useAdmin() {
    const { user, loading: sessionLoading } = useSession();
    const [isVerifier, setIsVerifier] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function check() {
            if (sessionLoading) return;
            if (!user) {
                if (!cancelled) {
                    setIsVerifier(false);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from("verifiers")
                .select("user_id")
                .eq("user_id", user.id)
                .eq("is_active", true)
                .limit(1)
                .maybeSingle();

            if (cancelled) return;

            if (error) {
                console.error("useAdmin: verifier lookup failed", error.message);
                setIsVerifier(false);
            } else {
                setIsVerifier(Boolean(data));
            }
            setLoading(false);
        }

        check();
        return () => {
            cancelled = true;
        };
    }, [user, sessionLoading]);

    return { isVerifier, loading: loading || sessionLoading };
}