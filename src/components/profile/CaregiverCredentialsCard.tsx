// src/components/profile/CaregiverCredentialsCard.tsx
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award, BadgeCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

type CpdTotals = {
    caregiver_id: string;
    cpd_points: number;
    cpd_hours: number;
    milestones_earned: number;
};

export function CaregiverCredentialsCard() {
    const { user } = useSession();

    const { data } = useQuery({
        queryKey: ["cpd-totals", user?.id],
        enabled: !!user,
        staleTime: 120_000,
        // refetch whenever the tab regains focus or the component remounts
        refetchOnWindowFocus: true,
        refetchOnMount: "always",
        queryFn: async (): Promise<CpdTotals | null> => {
            const { data } = await supabase
                .from("caregiver_cpd_totals")
                .select("*")
                .eq("caregiver_id", user!.id)
                .maybeSingle();
            return (data as CpdTotals) ?? null;
        },
    });

    // If the user object itself changes (e.g. after refreshSession()),
    // refetch to be safe.
    useEffect(() => {
        if (user?.id) {
            // no-op dependency: the query key change already triggers a refetch,
            // but this makes intent explicit
        }
    }, [user?.id]);

    if (!user) return null;

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">CPD & progression</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Stat label="Points" value={String(Math.round(data?.cpd_points ?? 0))} />
                <Stat label="Hours" value={String(Math.round(data?.cpd_hours ?? 0))} />
                <Stat label="Certificates" value={String(data?.milestones_earned ?? 0)} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-primary" />
                    Verification: pending or verified by admin
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Certificates award every 10 completed services
                </span>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-muted px-3 py-3 text-center">
            <p className="text-lg font-black text-foreground">{value}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
                {label}
            </p>
        </div>
    );
}