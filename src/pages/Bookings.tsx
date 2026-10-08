// src/pages/Bookings.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
    CalendarCheck,
    ChevronRight,
    Clock,
    AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Booking, BookingStatus, Profile } from "@/types/db";
import { Link } from "react-router-dom";
const PAGE_SIZE = 20;

type BookingRow = Booking & {
    counterparty:
    | Pick<Profile, "id" | "display_name" | "avatar_url">
    | null;
};

const ACTIVE_STATUSES: BookingStatus[] = [
    "pending_payment",
    "paid_escrow",
    "accepted",
    "en_route",
    "arrived",
    "in_progress",
];

const PAST_STATUSES: BookingStatus[] = ["completed", "cancelled", "refunded"];

/* ---------- fetch ---------- */

async function fetchBookings(
    userId: string,
    role: "client" | "caregiver",
    cursor: string | null
): Promise<{ rows: BookingRow[]; nextCursor: string | null }> {
    const filterCol = role === "client" ? "client_id" : "caregiver_id";
    const counterpartyCol = role === "client" ? "caregiver_id" : "client_id";

    let q = supabase
        .from("bookings")
        .select("*")
        .eq(filterCol, userId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

    if (cursor) q = q.lt("created_at", cursor);

    const { data: rows, error } = await q;
    if (error) throw error;
    const list = (rows ?? []) as Booking[];
    if (list.length === 0) return { rows: [], nextCursor: null };

    const ids = Array.from(new Set(list.map((b) => b[counterpartyCol])));
    const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids)
        .limit(ids.length);
    if (pErr) throw pErr;

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    const enriched: BookingRow[] = list.map((b) => ({
        ...b,
        counterparty: byId.get(b[counterpartyCol]) ?? null,
    }));

    const last = list[list.length - 1];
    return {
        rows: enriched,
        nextCursor: list.length === PAGE_SIZE ? last.created_at : null,
    };
}

/* ---------- helpers ---------- */

type Bucket = "all" | "active" | "completed" | "cancelled";

function bucketOf(status: BookingStatus): Bucket {
    if (status === "completed") return "completed";
    if (status === "cancelled" || status === "refunded") return "cancelled";
    if (status === "disputed") return "cancelled";
    return "active";
}

function statusLabel(s: BookingStatus) {
    return s.replace(/_/g, " ");
}

function statusTone(s: BookingStatus): {
    bg: string;
    fg: string;
} {
    if (s === "completed") return { bg: "bg-success/10", fg: "text-success" };
    if (s === "disputed") return { bg: "bg-destructive/10", fg: "text-destructive" };
    if (s === "cancelled" || s === "refunded" || s === "pending_payment") {
        return { bg: "bg-muted", fg: "text-muted-foreground" };
    }
    return { bg: "bg-primary/10", fg: "text-primary" };
}

/* ---------- page ---------- */

export default function Bookings() {
    const { user } = useSession();
    const role = (user?.role === "caregiver" ? "caregiver" : "client") as
        | "client"
        | "caregiver";

    const [bucket, setBucket] = useState<Bucket>("all");

    const query = useInfiniteQuery({
        queryKey: ["bookings", user?.id, role],
        enabled: !!user,
        initialPageParam: null as string | null,
        queryFn: ({ pageParam }) => fetchBookings(user!.id, role, pageParam),
        getNextPageParam: (last) => last.nextCursor,
        staleTime: 30_000,
    });

    const allRows = useMemo(
        () => query.data?.pages.flatMap((p) => p.rows) ?? [],
        [query.data]
    );

    const filtered = useMemo(() => {
        if (bucket === "all") return allRows;
        return allRows.filter((b) => bucketOf(b.status) === bucket);
    }, [allRows, bucket]);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    query.hasNextPage &&
                    !query.isFetchingNextPage
                ) {
                    query.fetchNextPage();
                }
            },
            { rootMargin: "600px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [query]);

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <h1 className="text-2xl font-black tracking-tight text-foreground mb-4">
                {role === "caregiver" ? "Jobs" : "Bookings"}
            </h1>

            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-4">
                {(["all", "active", "completed", "cancelled"] as Bucket[]).map((b) => (
                    <BucketChip
                        key={b}
                        label={b === "all" ? "All" : b === "cancelled" ? "Cancelled" : b[0].toUpperCase() + b.slice(1)}
                        active={bucket === b}
                        onClick={() => setBucket(b)}
                    />
                ))}
            </div>

            {query.isLoading ? (
                <ListSkeleton />
            ) : filtered.length === 0 ? (
                <EmptyState role={role} bucket={bucket} />
            ) : (
                <>
                    <div className="space-y-2">
                        {filtered.map((b) => (
                            <Link
                                key={b.id}
                                to={`/bookings/${b.id}`}
                                className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <BookingCard b={b} role={role} />
                            </Link>
                        ))}
                    </div>
                    <div ref={sentinelRef} className="h-10" />
                    {query.isFetchingNextPage && (
                        <p className="text-center text-xs text-muted-foreground py-4">
                            Loading more…
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

/* ---------- pieces ---------- */

function BucketChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 h-11 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
                }`}
        >
            {label}
        </button>
    );
}

function BookingCard({
    b,
    role,
}: {
    b: BookingRow;
    role: "client" | "caregiver";
}) {
    const tone = statusTone(b.status);
    const name =
        b.counterparty?.display_name ||
        (role === "client" ? "Caregiver" : "Client");
    const initial = name[0]?.toUpperCase() ?? "?";

    return (
        <div className="rounded-2xl bg-card px-4 py-3">
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-primary/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {b.counterparty?.avatar_url ? (
                        <img
                            src={b.counterparty.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-primary font-black">{initial}</span>
                    )}
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground truncate">
                            {name}
                        </p>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${tone.bg} ${tone.fg}`}
                        >
                            {statusLabel(b.status)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.scheduled_at
                            ? new Date(b.scheduled_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "Not scheduled"}
                    </p>
                </div>

                <div className="text-right shrink-0">
                    <p className="text-sm font-black text-foreground">
                        KES {Math.round(b.total_amount).toLocaleString()}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1" />
                </div>
            </div>

            {b.status === "disputed" && (
                <div className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                        This booking is under dispute. Support will reach out.
                    </p>
                </div>
            )}
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full skeleton-shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 rounded skeleton-shimmer w-1/2" />
                            <div className="h-2.5 rounded skeleton-shimmer w-1/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({
    role,
    bucket,
}: {
    role: "client" | "caregiver";
    bucket: Bucket;
}) {
    const text =
        bucket === "all"
            ? role === "caregiver"
                ? "No jobs yet. When a client books you, it will appear here."
                : "No bookings yet. Find a caregiver to get started."
            : bucket === "active"
                ? "Nothing active right now."
                : bucket === "completed"
                    ? "No completed bookings yet."
                    : "No cancelled bookings.";

    return (
        <div className="py-16 text-center animate-fade-in">
            <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    );
}