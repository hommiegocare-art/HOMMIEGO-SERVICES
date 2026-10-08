// src/pages/Earnings.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, Clock, CheckCircle2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Payout, PayoutStatus } from "@/types/db";

const PENDING: PayoutStatus[] = ["pending", "processing"];
const PAID: PayoutStatus[] = ["paid"];
const OTHER: PayoutStatus[] = ["failed"];

function statusTone(s: PayoutStatus) {
    if (s === "paid") return { bg: "bg-success/10", fg: "text-success" };
    if (s === "failed") return { bg: "bg-destructive/10", fg: "text-destructive" };
    return { bg: "bg-primary/10", fg: "text-primary" };
}

export default function Earnings() {
    const { user } = useSession();

    const { data: rows = [], isLoading, error } = useQuery({
        queryKey: ["earnings", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<Payout[]> => {
            const { data, error } = await supabase
                .from("payouts")
                .select("*")
                .eq("caregiver_id", user!.id)
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return (data ?? []) as Payout[];
        },
    });

    const grouped = useMemo(() => {
        const pending = rows.filter((p) => PENDING.includes(p.status));
        const paid = rows.filter((p) => PAID.includes(p.status));
        const other = rows.filter((p) => OTHER.includes(p.status));
        const sum = (arr: Payout[]) =>
            arr.reduce((s, p) => s + Number(p.amount ?? 0), 0);
        return {
            pending,
            paid,
            other,
            pendingTotal: sum(pending),
            paidTotal: sum(paid),
            lifetime: sum(pending) + sum(paid),
        };
    }, [rows]);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
            <div className="mb-5">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Earnings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Payouts from completed bookings.
                </p>
            </div>

            {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 mb-4">
                    <p className="text-sm text-destructive">
                        {(error as Error).message}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
                <SummaryCard
                    icon={<Clock className="w-4 h-4 text-primary" />}
                    label="Pending"
                    value={
                        isLoading
                            ? null
                            : `KES ${Math.round(grouped.pendingTotal).toLocaleString()}`
                    }
                    hint={`${grouped.pending.length} payout${grouped.pending.length === 1 ? "" : "s"}`}
                />
                <SummaryCard
                    icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
                    label="Paid"
                    value={
                        isLoading
                            ? null
                            : `KES ${Math.round(grouped.paidTotal).toLocaleString()}`
                    }
                    hint={`${grouped.paid.length} payout${grouped.paid.length === 1 ? "" : "s"}`}
                />
                <SummaryCard
                    icon={<TrendingUp className="w-4 h-4 text-primary" />}
                    label="Lifetime"
                    value={
                        isLoading
                            ? null
                            : `KES ${Math.round(grouped.lifetime).toLocaleString()}`
                    }
                    hint={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
                />
            </div>

            <Group
                title="Pending"
                subtitle="Awaiting release after the booking completes."
                loading={isLoading}
                empty="No pending payouts."
                rows={grouped.pending}
            />

            <Group
                title="Paid"
                subtitle="Released to your M-Pesa account."
                loading={isLoading}
                empty="No paid payouts yet."
                rows={grouped.paid}
                className="mt-8"
            />

            {grouped.other.length > 0 && (
                <Group
                    title="Failed"
                    subtitle="Contact support if any of these look wrong."
                    loading={false}
                    empty=""
                    rows={grouped.other}
                    className="mt-8"
                />
            )}
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    hint,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | null;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl bg-card px-3 py-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                {icon}
                {label}
            </div>
            <div className="mt-1.5 text-lg font-black text-foreground">
                {value === null ? (
                    <span className="inline-block w-20 h-5 rounded skeleton-shimmer" />
                ) : (
                    value
                )}
            </div>
            {hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}

function Group({
    title,
    subtitle,
    loading,
    empty,
    rows,
    className = "",
}: {
    title: string;
    subtitle: string;
    loading: boolean;
    empty: string;
    rows: Payout[];
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
                    <div className="h-16 rounded-2xl skeleton-shimmer" />
                    <div className="h-16 rounded-2xl skeleton-shimmer" />
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-2xl bg-card px-4 py-10 text-center">
                    <Inbox className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{empty}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((p) => (
                        <PayoutRow key={p.id} p={p} />
                    ))}
                </div>
            )}
        </section>
    );
}

function PayoutRow({ p }: { p: Payout }) {
    const tone = statusTone(p.status);
    const dateStr = p.completed_at ?? p.created_at;

    const body = (
        <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">
                        KES {Math.round(p.amount).toLocaleString()}
                    </p>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${tone.bg} ${tone.fg}`}
                    >
                        {p.status}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(dateStr).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                    })}
                </p>
            </div>
        </div>
    );

    if (p.booking_id) {
        return (
            <Link
                to={`/bookings/${p.booking_id}`}
                className="block rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
            >
                {body}
            </Link>
        );
    }

    return (
        <div className="rounded-2xl bg-card px-4 py-3">{body}</div>
    );
}