// src/pages/ReferralDashboard.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Phone,
    Send,
    Stethoscope,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// ---- types -----------------------------------------------------------------

type ReferralServiceType =
    | "home_nursing" | "wound_care" | "medication_admin" | "physiotherapy"
    | "elderly_care" | "postnatal" | "transport" | "lab_delivery" | "other";

type ReferralStatus =
    | "pending" | "accepted" | "declined" | "expired" | "converted";

type BookingStatus =
    | "pending_payment" | "paid_escrow" | "accepted" | "en_route" | "arrived"
    | "in_progress" | "completed" | "cancelled" | "disputed" | "refunded";

type PaymentStatus = "unpaid" | "held" | "released" | "refunded" | "failed";

type BookingLite = {
    id: string;
    referral_id: string | null;
    status: BookingStatus;
    payment_status: PaymentStatus;
    scheduled_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    total_amount: number;
    caregiver_id: string;
};

type CaregiverLite = {
    id: string;
    display_name: string | null;
};

type ReferralRow = {
    id: string;
    patient_phone: string;
    patient_name: string | null;
    patient_user_id: string | null;
    services_needed: ReferralServiceType[];
    urgency: string;
    status: ReferralStatus;
    consent_granted_at: string | null;
    expires_at: string;
    converted_booking_id: string | null;
    converted_at: string | null;
    created_at: string;
    booking: BookingLite | null;
    caregiver: CaregiverLite | null;
};

const SERVICE_SHORT: Record<ReferralServiceType, string> = {
    home_nursing: "Nursing",
    wound_care: "Wound",
    medication_admin: "Meds",
    physiotherapy: "Physio",
    elderly_care: "Elderly",
    postnatal: "Postnatal",
    transport: "Transport",
    lab_delivery: "Lab",
    other: "Other",
};

type AdherenceBucket =
    | "awaiting-patient"  // pending, not yet accepted
    | "awaiting-booking"  // accepted, no booking yet
    | "booked"            // booking exists, not started
    | "in-flight"         // en_route/arrived/in_progress
    | "completed"         // booking completed
    | "problem";          // declined, expired, cancelled, disputed, refunded

function bucketFor(row: ReferralRow): AdherenceBucket {
    if (row.status === "declined" || row.status === "expired") return "problem";

    const b = row.booking;
    if (!b) {
        return row.status === "pending" ? "awaiting-patient" : "awaiting-booking";
    }
    if (b.status === "cancelled" || b.status === "disputed" || b.status === "refunded")
        return "problem";
    if (b.status === "completed") return "completed";
    if (b.status === "en_route" || b.status === "arrived" || b.status === "in_progress")
        return "in-flight";
    return "booked";
}

const BUCKET_META: Record<
    AdherenceBucket,
    { label: string; tone: "primary" | "muted" | "success" | "destructive" }
> = {
    "awaiting-patient": { label: "Awaiting patient", tone: "muted" },
    "awaiting-booking": { label: "Accepted, not booked", tone: "primary" },
    booked: { label: "Booked", tone: "primary" },
    "in-flight": { label: "In progress", tone: "primary" },
    completed: { label: "Completed", tone: "success" },
    problem: { label: "Did not proceed", tone: "destructive" },
};

type FilterKey =
    | "all" | "awaiting-patient" | "awaiting-booking"
    | "booked" | "in-flight" | "completed" | "problem";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "awaiting-patient", label: "Awaiting patient" },
    { key: "awaiting-booking", label: "Not booked" },
    { key: "booked", label: "Booked" },
    { key: "in-flight", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "problem", label: "Problems" },
];

// ---- fetch (two-step) ------------------------------------------------------

async function fetchDashboard(userId: string): Promise<ReferralRow[]> {
    // Step 1: fetch referrals.
    const { data: refRows, error: refErr } = await supabase
        .from("referrals")
        .select(
            `id, patient_phone, patient_name, patient_user_id, services_needed,
             urgency, status, consent_granted_at, expires_at,
             converted_booking_id, converted_at, created_at`
        )
        .eq("referring_user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
    if (refErr) throw refErr;

    const referrals = (refRows ?? []) as Omit<ReferralRow, "booking" | "caregiver">[];
    if (referrals.length === 0) return [];

    // Step 2: fetch bookings tied to those referrals, in one shot.
    const ids = referrals.map((r) => r.id);
    const { data: bookRows, error: bookErr } = await supabase
        .from("bookings")
        .select(
            "id, referral_id, status, payment_status, scheduled_at, completed_at, cancelled_at, total_amount, caregiver_id"
        )
        .in("referral_id", ids);
    if (bookErr) {
        // Not fatal — RLS may deny bookings to the doctor. Degrade gracefully.
        return referrals.map((r) => ({ ...r, booking: null, caregiver: null }));
    }

    const bookings = (bookRows ?? []) as BookingLite[];

    // Step 3: fetch caregiver profiles for those bookings.
    const caregiverIds = Array.from(
        new Set(bookings.map((b) => b.caregiver_id).filter(Boolean))
    );
    let caregiverMap = new Map<string, CaregiverLite>();
    if (caregiverIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", caregiverIds);
        if (!profErr && profiles) {
            caregiverMap = new Map(
                (profiles as CaregiverLite[]).map((p) => [p.id, p])
            );
        }
    }

    // Step 4: stitch together. A booking belongs to exactly one referral
    // via bookings.referral_id. Only the latest one matters.
    const bookingByReferral = new Map<string, BookingLite>();
    for (const b of bookings) {
        if (!b.referral_id) continue;
        // If multiple bookings exist for one referral (rare), keep the newest.
        const existing = bookingByReferral.get(b.referral_id);
        if (!existing) bookingByReferral.set(b.referral_id, b);
    }

    return referrals.map((r) => {
        const b = bookingByReferral.get(r.id) ?? null;
        return {
            ...r,
            booking: b,
            caregiver: b ? caregiverMap.get(b.caregiver_id) ?? null : null,
        };
    });
}

// ---- page ------------------------------------------------------------------

export default function ReferralDashboard() {
    const { user } = useSession();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterKey>("all");

    const query = useQuery({
        queryKey: ["referrals", "dashboard", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: () => fetchDashboard(user!.id),
    });

    const rows = query.data ?? [];

    const withBuckets = useMemo(
        () => rows.map((r) => ({ row: r, bucket: bucketFor(r) })),
        [rows]
    );

    const counts = useMemo(() => {
        const c: Record<FilterKey, number> = {
            all: withBuckets.length,
            "awaiting-patient": 0,
            "awaiting-booking": 0,
            booked: 0,
            "in-flight": 0,
            completed: 0,
            problem: 0,
        };
        for (const { bucket } of withBuckets) c[bucket] += 1;
        return c;
    }, [withBuckets]);

    const filtered = useMemo(() => {
        if (filter === "all") return withBuckets;
        return withBuckets.filter((x) => x.bucket === filter);
    }, [withBuckets, filter]);

    const adherencePct = useMemo(() => {
        const total = withBuckets.length;
        if (total === 0) return null;
        const good = withBuckets.filter(
            (x) => x.bucket === "booked" || x.bucket === "in-flight" || x.bucket === "completed"
        ).length;
        return Math.round((good / total) * 100);
    }, [withBuckets]);

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-4 pb-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigate("/referrals")}
                    aria-label="Back"
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-xl font-black tracking-tight text-foreground">
                        Adherence
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Did your patients get the care you recommended?
                    </p>
                </div>
            </header>

            {adherencePct !== null && (
                <div className="rounded-2xl bg-card p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                            Adherence rate
                        </p>
                    </div>
                    <div className="flex items-end gap-3 mt-2">
                        <p className="text-3xl font-black text-foreground">
                            {adherencePct}%
                        </p>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            {counts.booked + counts["in-flight"] + counts.completed} of{" "}
                            {counts.all} referrals booked or completed
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    const n = counts[f.key];
                    return (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={
                                "h-9 px-3 rounded-full text-xs font-bold transition-colors shrink-0 inline-flex items-center gap-1.5 " +
                                (active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground active:bg-secondary")
                            }
                        >
                            {f.label}
                            <span
                                className={
                                    "text-[10px] " +
                                    (active ? "opacity-80" : "text-muted-foreground")
                                }
                            >
                                {n}
                            </span>
                        </button>
                    );
                })}
            </div>

            {query.isLoading ? (
                <ListSkeleton />
            ) : filtered.length === 0 ? (
                <EmptyState filter={filter} />
            ) : (
                <ul className="space-y-2">
                    {filtered.map(({ row, bucket }) => (
                        <li key={row.id}>
                            <ReferralCard
                                row={row}
                                bucket={bucket}
                                onOpenReferral={() => navigate(`/referral/${row.id}`)}
                                onOpenBooking={
                                    row.converted_booking_id
                                        ? () => navigate(`/bookings/${row.converted_booking_id}`)
                                        : undefined
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ---- card ------------------------------------------------------------------

function ReferralCard({
    row,
    bucket,
    onOpenReferral,
    onOpenBooking,
}: {
    row: ReferralRow;
    bucket: AdherenceBucket;
    onOpenReferral: () => void;
    onOpenBooking?: () => void;
}) {
    const meta = BUCKET_META[bucket];
    const services = row.services_needed.slice(0, 3);
    const extra = row.services_needed.length - services.length;

    const toneCls =
        meta.tone === "success"
            ? "bg-success/10 text-success"
            : meta.tone === "primary"
                ? "bg-primary/10 text-primary"
                : meta.tone === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground";

    const booking = row.booking;
    const caregiver = row.caregiver;

    return (
        <div className="rounded-2xl bg-card p-3 sm:p-4">
            <button
                type="button"
                onClick={onOpenReferral}
                className="w-full text-left active:opacity-80 transition-opacity"
            >
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground truncate">
                                {row.patient_name || formatPhone(row.patient_phone)}
                            </p>
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneCls}`}
                            >
                                {meta.label}
                            </span>
                        </div>

                        {row.patient_name && (
                            <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {formatPhone(row.patient_phone)}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                            {services.map((s) => (
                                <span
                                    key={s}
                                    className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                                >
                                    {SERVICE_SHORT[s]}
                                </span>
                            ))}
                            {extra > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                    +{extra}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                Sent {relative(row.created_at)}
                            </span>
                            {row.consent_granted_at && (
                                <span className="inline-flex items-center gap-1 text-success">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Accepted {relative(row.consent_granted_at)}
                                </span>
                            )}
                            {row.status === "pending" && !row.consent_granted_at && (
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Expires {relativeFuture(row.expires_at)}
                                </span>
                            )}
                        </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
            </button>

            {booking?.status && (
                <div className="mt-3 pt-3 border-t border-border/40">
                    <button
                        type="button"
                        onClick={onOpenBooking ?? onOpenReferral}
                        className="w-full text-left rounded-xl bg-muted px-3 py-2.5 active:bg-secondary transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate">
                                    {caregiver?.display_name ?? "Caregiver"}
                                    <span className="font-normal text-muted-foreground">
                                        {" · "}
                                        {bookingStatusLabel(booking.status)}
                                    </span>
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {paymentLabel(booking.payment_status)}
                                    {booking.scheduled_at
                                        ? ` · ${new Date(booking.scheduled_at).toLocaleDateString(
                                            undefined,
                                            { month: "short", day: "numeric" }
                                        )}`
                                        : ""}
                                    {booking.total_amount
                                        ? ` · KES ${Number(booking.total_amount).toLocaleString()}`
                                        : ""}
                                </p>
                            </div>
                            {booking.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            ) : booking.status === "cancelled" ||
                                booking.status === "refunded" ||
                                booking.status === "disputed" ? (
                                <XCircle className="w-4 h-4 text-destructive shrink-0" />
                            ) : (
                                <Activity className="w-4 h-4 text-primary shrink-0" />
                            )}
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

// ---- states ----------------------------------------------------------------

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card p-4">
                    <div className="space-y-2">
                        <div className="h-3 rounded skeleton-shimmer w-1/2" />
                        <div className="h-2.5 rounded skeleton-shimmer w-1/3" />
                        <div className="h-2.5 rounded skeleton-shimmer w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ filter }: { filter: FilterKey }) {
    return (
        <div className="py-16 text-center animate-fade-in">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
                {filter === "all"
                    ? "No referrals yet."
                    : `No referrals in this bucket.`}
            </p>
        </div>
    );
}

// ---- helpers ---------------------------------------------------------------

function bookingStatusLabel(s: BookingStatus | undefined | null): string {
    if (!s) return "—";
    return String(s).replace(/_/g, " ");
}

function paymentLabel(s: PaymentStatus | undefined | null): string {
    switch (s) {
        case "unpaid":
            return "Unpaid";
        case "held":
            return "In escrow";
        case "released":
            return "Released";
        case "refunded":
            return "Refunded";
        case "failed":
            return "Payment failed";
        default:
            return "—";
    }
}

function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "");
    if (d.startsWith("254") && d.length >= 12)
        return `+254 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
    if (d.startsWith("0") && d.length >= 10)
        return `0${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    return raw;
}

function relative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function relativeFuture(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "now";
    const h = Math.floor(diff / 3_600_000);
    if (h < 24) return `in ${h}h`;
    const d = Math.floor(h / 24);
    return `in ${d}d`;
}