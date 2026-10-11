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

    // Real count from bookings — same source the milestone trigger uses.
    // Never trust the denormalized `completed_bookings` column for logic;
    // it can drift if a trigger missed a row.
    const { data: completedCount = 0 } = useQuery({
        queryKey: ["dashboard", "caregiver", "completed-count", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: "always",
        queryFn: async (): Promise<number> => {
            const { count, error } = await supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("caregiver_id", user!.id)
                .eq("status", "completed");
            if (error) return 0;
            return count ?? 0;
        },
    });

    // Total milestones earned — read from the real table the trigger writes to
    const { data: milestonesEarned = 0 } = useQuery({
        queryKey: ["dashboard", "caregiver", "milestones", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<number> => {
            const { count, error } = await supabase
                .from("service_milestones")
                .select("id", { count: "exact", head: true })
                .eq("caregiver_id", user!.id);
            if (error) return 0;
            return count ?? 0;
        },
    });

    // Total CPD points — read from the aggregate view
    const { data: cpdPoints = 0 } = useQuery({
        queryKey: ["dashboard", "caregiver", "cpd-points", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<number> => {
            const { data, error } = await supabase
                .from("caregiver_cpd_totals")
                .select("cpd_points")
                .eq("caregiver_id", user!.id)
                .maybeSingle();
            if (error || !data) return 0;
            return Number(data.cpd_points ?? 0);
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

    // Milestone math — using the real count, not the cached column
    const completed = completedCount;
    const withinCycle = completed % 10;
    const toNextMilestone = withinCycle === 0 && completed > 0 ? 10 : 10 - withinCycle;
    const progress = withinCycle === 0 && completed > 0 ? 100 : (withinCycle / 10) * 100;

    return (
        <div className="space-y-5 animate-fade-in">
            <AvailabilityToggle />

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
                    value={String(Math.round(cpdPoints))}
                    icon={<Award className="w-4 h-4 text-primary" />}
                />
            </div>

            {/* Milestone progress — now linked to /certificates */}
            <Link
                to="/certificates"
                className="block rounded-2xl bg-card px-4 py-4 active:bg-muted transition-colors"
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground">
                        Certificates
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {milestonesEarned > 0
                            ? `${milestonesEarned} earned`
                            : "None yet"}
                    </p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-primary transition-transform duration-150 origin-left"
                        style={{ transform: `scaleX(${progress / 100})` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {withinCycle === 0 && completed > 0
                        ? `Milestone ${completed} achieved — tap to download.`
                        : `${withinCycle}/10 services toward your next certificate.`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {toNextMilestone === 10 && withinCycle === 0 && completed === 0
                        ? "Complete 10 services to earn your first certificate."
                        : `Complete ${toNextMilestone} more to earn your next certificate.`}
                </p>
            </Link>

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