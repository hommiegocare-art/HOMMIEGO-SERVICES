// src/components/dashboard/CaregiverDashboard.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Star,
    CheckCircle2,
    Award,
    Users,
    ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { StatCard } from "./StatCard";
import { AvailabilityToggle } from "./AvailabilityToggle";
import type { CaregiverProfile, Connection } from "@/types/db";

export function CaregiverDashboard({ greeting }: { greeting: string }) {
    const { user } = useSession();

    const { data: profile } = useQuery({
        queryKey: ["dashboard", "caregiver", "profile", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<CaregiverProfile | null> => {
            const { data, error } = await supabase
                .from("caregiver_profiles")
                .select("*")
                .eq("user_id", user!.id)
                .maybeSingle();
            if (error) return null;
            return (data as CaregiverProfile) ?? null;
        },
    });

    const { data: pending = [] } = useQuery({
        queryKey: ["dashboard", "caregiver", "pending", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async (): Promise<Connection[]> => {
            const { data, error } = await supabase
                .from("connections")
                .select("*")
                .eq("caregiver_id", user!.id)
                .eq("status", "pending")
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(5);
            if (error) return [];
            return (data ?? []) as Connection[];
        },
    });

    const completed = profile?.completed_bookings ?? 0;
    const toNextMilestone = completed === 0 ? 10 : 10 - (completed % 10 || 10);
    const progress = completed === 0 ? 0 : (completed % 10 === 0 ? 100 : ((10 - toNextMilestone) / 10) * 100);

    return (
        <div className="space-y-5 animate-fade-in">
            <AvailabilityToggle isAvailable={profile?.is_available ?? false} />

            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Rating"
                    value={
                        profile && profile.average_rating > 0
                            ? profile.average_rating.toFixed(1)
                            : "—"
                    }
                    icon={<Star className="w-4 h-4 fill-current text-primary" />}
                />
                <StatCard
                    label="Reviews"
                    value={String(profile?.total_reviews ?? 0)}
                />
                <StatCard
                    label="Completed"
                    value={String(completed)}
                    icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
                />
                <StatCard
                    label="CPD pts"
                    value="0"
                    icon={<Award className="w-4 h-4 text-primary" />}
                />
            </div>

            <section className="rounded-2xl bg-card px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground">
                        Next certificate
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {completed % 10 === 0 && completed > 0
                            ? "Awarded"
                            : `${completed % 10}/10 services`}
                    </p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-primary transition-transform duration-150 origin-left"
                        style={{ transform: `scaleX(${progress / 100})` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Complete {toNextMilestone} more to earn your next certificate.
                </p>
            </section>

            <section>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                        Connection requests
                    </h2>
                    <Link to="/connections" className="text-xs text-primary font-semibold">
                        View all
                    </Link>
                </div>
                {pending.length === 0 ? (
                    <div className="rounded-2xl bg-card px-4 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No pending requests.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pending.map((c) => (
                            <Link
                                key={c.id}
                                to="/connections"
                                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            New connection request
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}