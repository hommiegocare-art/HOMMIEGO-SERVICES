// src/components/dashboard/AvailabilityToggle.tsx
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

const ONLINE_WINDOW_MS = 3 * 60_000; // 3 minutes

function isVisible(lastSeenAt: string | null): boolean {
    if (!lastSeenAt) return false;
    return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

export function AvailabilityToggle() {
    const { user } = useSession();
    const qc = useQueryClient();
    const [now, setNow] = useState(() => Date.now());

    // Tick every 30s so "visible/hidden" updates without a page reload
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(id);
    }, []);

    // Self-heal: ping the heartbeat once when this component mounts.
    // Ensures last_seen_at is fresh even if usePresence() somehow isn't mounted.
    useEffect(() => {
        if (!user || user.role !== "caregiver") return;
        supabase.rpc("caregiver_heartbeat").then(
            () => {
                qc.invalidateQueries({ queryKey: ["presence", "self", user.id] });
            },
            () => undefined,
        );
    }, [user, qc]);

    const { data: lastSeenAt } = useQuery({
        queryKey: ["presence", "self", user?.id],
        enabled: !!user && user.role === "caregiver",
        staleTime: 20_000,
        refetchInterval: 30_000,
        queryFn: async (): Promise<string | null> => {
            const { data, error } = await supabase
                .from("caregiver_profiles")
                .select("last_seen_at")
                .eq("user_id", user!.id)
                .maybeSingle();
            if (error) return null;
            return (data?.last_seen_at as string | null) ?? null;
        },
    });

    const visible = isVisible(lastSeenAt ?? null);

    // Keep `now` referenced so the component re-renders every tick
    void now;

    return (
        <div className="rounded-2xl bg-card px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                    {visible && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    )}
                    <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${visible ? "bg-success" : "bg-muted-foreground/40"
                            }`}
                    />
                </span>
                <div>
                    <p className="text-sm font-bold text-foreground">
                        {visible ? "Visible to clients" : "Not visible to clients"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {visible
                            ? "You appear in Explore right now."
                            : "Browse around the app to reappear. You go hidden automatically when you leave."}
                    </p>
                </div>
            </div>
        </div>
    );
}