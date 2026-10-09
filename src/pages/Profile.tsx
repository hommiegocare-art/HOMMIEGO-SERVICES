// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { OwnProfile } from "@/components/profile/OwnProfile";
import { MedicalProfileCard } from "@/components/profile/MedicalProfileCard";
import { supabase } from "@/integrations/supabase/client";

// Returns true only when `caregiverId` has an accepted connection to `clientId`
function useIsConnectedCaregiver(
    caregiverId: string | undefined,
    clientId: string | undefined,
) {
    return useQuery({
        queryKey: ["connected", caregiverId, clientId],
        enabled: !!caregiverId && !!clientId,
        staleTime: 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("connections")
                .select("id")
                .eq("caregiver_id", caregiverId!)
                .eq("client_id", clientId!)
                .eq("status", "accepted")
                .is("deleted_at", null)
                .maybeSingle();
            if (error) return false;
            return !!data;
        },
    });
}

export default function Profile() {
    const { userId } = useParams<{ userId?: string }>();
    const { user, loading } = useSession();
    const { hash } = useLocation();

    // Only caregivers viewing a *client* should we bother checking the connection
    const checkConnection =
        !!user &&
        user.role === "caregiver" &&
        !!userId &&
        userId !== user.id;

    const connected = useIsConnectedCaregiver(
        checkConnection ? user?.id : undefined,
        checkConnection ? userId : undefined,
    );

    const showMedical =
        checkConnection && connected.data === true;

    // Scroll-to-anchor (kept for the optional #medical-record hash)
    useEffect(() => {
        if (hash !== "#medical-record") return;
        if (!showMedical) return;

        let cancelled = false;
        let attempts = 0;

        const tryScroll = () => {
            if (cancelled) return;
            const el = document.getElementById("medical-record");
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            if (attempts++ < 20) setTimeout(tryScroll, 100);
        };
        tryScroll();
        return () => {
            cancelled = true;
        };
    }, [hash, userId, showMedical]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
                <div className="h-24 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    if (!user) return null;

    // Viewing own profile
    if (userId && userId === user.id) return <OwnProfile />;

    // Viewing someone else
    if (!userId) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <PublicProfile userId={userId} />

            {/* Embedded medical record — only for connected caregivers */}
            {showMedical && (
                <div id="medical-record" className="mt-4 scroll-mt-24">
                    <MedicalProfileCard clientId={userId} />
                </div>
            )}
        </div>
    );
}