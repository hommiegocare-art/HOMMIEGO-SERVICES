// src/pages/Jobs.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Inbox, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Booking, BookingStatus } from "@/types/db";

const PENDING: BookingStatus[] = ["paid_escrow"];
const ACTIVE: BookingStatus[] = ["accepted", "en_route", "arrived", "in_progress"];

function statusLabel(s: BookingStatus) {
    return s.replace(/_/g, " ");
}

function statusTone(s: BookingStatus): { bg: string; fg: string } {
    if (s === "completed") return { bg: "bg-success/10", fg: "text-success" };
    if (s === "disputed") return { bg: "bg-destructive/10", fg: "text-destructive" };
    if (s === "cancelled" || s === "refunded" || s === "pending_payment")
        return { bg: "bg-muted", fg: "text-muted-foreground" };
    return { bg: "bg-primary/10", fg: "text-primary" };
}

export default function Jobs() {
    const { user } = useSession();

    const pendingQ = useQuery({
        queryKey: ["jobs", "pending", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async (): Promise<Booking[]> => {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("caregiver_id", user!.id)
                .in("status", PENDING)
                .order("scheduled_at", { ascending: true, nullsFirst: false })
                .limit(20);
            if (error) throw error;
            return (data ?? []) as Booking[];
        },
    });

    const activeQ = useQuery({
        queryKey: ["jobs", "active", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async (): Promise<Booking[]> => {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("caregiver_id", user!.id)
                .in("status", ACTIVE)
                .order("scheduled_at", { ascending: true, nullsFirst: false })
                .limit(50);
            if (error) throw error;
            return (data ?? []) as Booking[];
        },
    });

    const earningsQ = useQuery({
        queryKey: ["jobs", "earnings-pending", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<number> => {
            const { data, error } = await supabase
                .from("payouts")
                .select("amount")
                .eq("caregiver_id", user!.id)
                .in("status", ["pending", "processing"])
                .limit(200);
            if (error) return 0;
            return (data ?? []).reduce(
                (s, r) => s + Number((r as { amount: number }).amount ?? 0),
                0
            );
        },
    });

    const stats = useMemo(() => {
        const list = activeQ.data ?? [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const todayCount = list.filter((b) => {
            if (!b.scheduled_at) return false;
            const d = new Date(b.scheduled_at);
            return d >= startOfToday && d < endOfToday;
        }).length;

        const weekCount = list.filter((b) => {
            if (!b.scheduled_at) return false;
            const d = new Date(b.scheduled_at);
            return d >= startOfToday && d < endOfWeek;
        }).length;

        return { todayCount, weekCount };
    }, [activeQ.data]);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
            <div className="mb-5">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Jobs
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Your requests and active visits.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard
                    icon={<Calendar className="w-4 h-4 text-primary" />}
                    label="Today"
                    value={stats.todayCount}
                    loading={activeQ.isLoading}
                />
                <StatCard
                    icon={<Clock className="w-4 h-4 text-primary" />}
                    label="This week"
                    value={stats.weekCount}
                    loading={activeQ.isLoading}
                />
                <StatCard
                    icon={<Wallet className="w-4 h-4 text-primary" />}
                    label="Pending"
                    value={`KES ${Math.round(earningsQ.data ?? 0).toLocaleString()}`}
                    loading={earningsQ.isLoading}
                />
            </div>

            <JobsSection
                title="Booking requests"
                subtitle="Paid into escrow — accept to confirm."
                empty="No pending requests."
                loading={pendingQ.isLoading}
                rows={pendingQ.data ?? []}
            />

            <JobsSection
                title="Active jobs"
                subtitle="Accepted, en route, arrived, or in progress."
                empty="No active jobs right now."
                loading={activeQ.isLoading}
                rows={activeQ.data ?? []}
                className="mt-8"
            />
        </div>
    );
}

function JobsSection({
    title,
    subtitle,
    empty,
    loading,
    rows,
    className = "",
}: {
    title: string;
    subtitle: string;
    empty: string;
    loading: boolean;
    rows: Booking[];
    className?: string;
}) {
    return (
        <section className={className}>
            <div className="mb-3">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
                    {title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>

            {loading ? (
                <div className="space-y-2">
                    <div className="h-20 rounded-2xl skeleton-shimmer" />
                    <div className="h-20 rounded-2xl skeleton-shimmer" />
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-2xl bg-card px-4 py-10 text-center">
                    <Inbox className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{empty}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((b) => (
                        <JobCard key={b.id} b={b} />
                    ))}
                </div>
            )}
        </section>
    );
}

function JobCard({ b }: { b: Booking }) {
    const tone = statusTone(b.status);
    return (
        <Link
            to={`/bookings/${b.id}`}
            className="block rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                        {b.scheduled_at
                            ? new Date(b.scheduled_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })
                            : "Unscheduled"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {b.duration_minutes ? `${b.duration_minutes} min · ` : ""}
                        KES {Math.round(b.total_amount).toLocaleString()}
                        {b.notes ? ` · ${b.notes}` : ""}
                    </p>
                </div>
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${tone.bg} ${tone.fg}`}
                >
                    {statusLabel(b.status)}
                </span>
            </div>
        </Link>
    );
}

function StatCard({
    icon,
    label,
    value,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    loading: boolean;
}) {
    return (
        <div className="rounded-2xl bg-card px-3 py-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                {icon}
                {label}
            </div>
            <div className="mt-1.5 text-lg font-black text-foreground">
                {loading ? (
                    <span className="inline-block w-12 h-5 rounded skeleton-shimmer" />
                ) : (
                    value
                )}
            </div>
        </div>
    );
}