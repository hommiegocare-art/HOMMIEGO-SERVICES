// src/pages/BookingDetail.tsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    Clock,
    MapPin,
    User as UserIcon,
    ScanLine,
    Check,
    Play,
    Navigation,
    XCircle,
    AlertTriangle,
    CheckCircle2,
    FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";
import { QRDisplay } from "@/components/booking/QRDisplay";
import { QRScanner } from "@/components/booking/QRScanner";
import { PayButton } from "@/components/booking/PayButton";
import { VisitNotesList } from "@/components/VisitNotesList";
import RatingPanel from "@/components/RatingPanel";
import type {
    Booking,
    BookingStatus,
    BookingStatusHistory,
    Profile,
} from "@/types/db";

type BookingFull = Booking & {
    client: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
    caregiver: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
    caregiverVerified: boolean;
};

const TIMELINE: BookingStatus[] = [
    "paid_escrow",
    "accepted",
    "en_route",
    "arrived",
    "in_progress",
    "completed",
];

const NEXT: Partial<Record<BookingStatus, BookingStatus>> = {
    paid_escrow: "accepted",
    accepted: "en_route",
    en_route: "arrived",
    arrived: "in_progress",
    in_progress: "completed",
};

function label(s: BookingStatus) {
    return s.replace(/_/g, " ");
}

/* ---------- data ---------- */

async function fetchBooking(id: string): Promise<BookingFull | null> {
    const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const b = data as Booking;
    const ids = Array.from(new Set([b.client_id, b.caregiver_id]));

    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids)
        .limit(ids.length);

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Check caregiver verification (batched single query)
    const { data: cg } = await supabase
        .from("caregiver_profiles")
        .select("verification_status")
        .eq("user_id", b.caregiver_id)
        .maybeSingle();

    return {
        ...b,
        client: byId.get(b.client_id) ?? null,
        caregiver: byId.get(b.caregiver_id) ?? null,
        caregiverVerified: cg?.verification_status === "verified",
    };
}

async function fetchHistory(id: string): Promise<BookingStatusHistory[]> {
    const { data, error } = await supabase
        .from("booking_status_history")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: false })
        .limit(30);
    if (error) return [];
    return (data ?? []) as BookingStatusHistory[];
}

async function fetchQrToken(
    bookingId: string
): Promise<{ token: string; expiresAt: string } | null> {
    const { data } = await supabase
        .from("booking_qr_tokens")
        .select("token, expires_at, consumed_at")
        .eq("booking_id", bookingId)
        .maybeSingle();

    if (data && !data.consumed_at && new Date(data.expires_at) > new Date()) {
        return { token: data.token as string, expiresAt: data.expires_at as string };
    }

    const { data: fresh, error } = await supabase.rpc("ensure_qr_token", {
        p_booking_id: bookingId,
    });
    if (error || !fresh) return null;

    const { data: reread } = await supabase
        .from("booking_qr_tokens")
        .select("token, expires_at")
        .eq("booking_id", bookingId)
        .maybeSingle();
    if (!reread) return null;
    return {
        token: reread.token as string,
        expiresAt: reread.expires_at as string,
    };
}

/* ---------- page ---------- */

export default function BookingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useSession();
    const qc = useQueryClient();
    const [scanOpen, setScanOpen] = useState(false);

    const bookingQ = useQuery({
        queryKey: ["booking", id],
        enabled: !!id,
        queryFn: () => fetchBooking(id!),
    });

    const historyQ = useQuery({
        queryKey: ["booking", id, "history"],
        enabled: !!id,
        queryFn: () => fetchHistory(id!),
    });

    const qrQ = useQuery({
        queryKey: ["booking", id, "qr"],
        enabled: !!id && !!bookingQ.data,
        queryFn: () => fetchQrToken(id!),
    });

    const update = useMutation({
        mutationFn: async (next: BookingStatus) => {
            if (!id) return;
            const patch: Record<string, unknown> = { status: next };
            if (next === "arrived") patch.arrived_at = new Date().toISOString();
            if (next === "in_progress" && !bookingQ.data?.started_at) {
                patch.started_at = new Date().toISOString();
            }
            if (next === "completed") patch.completed_at = new Date().toISOString();
            if (next === "cancelled") patch.cancelled_at = new Date().toISOString();

            const { error } = await supabase
                .from("bookings")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["booking", id] });
            qc.invalidateQueries({ queryKey: ["booking", id, "history"] });
            qc.invalidateQueries({ queryKey: ["bookings"] });
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    if (bookingQ.isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-8 w-32 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
                <div className="h-24 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    const b = bookingQ.data;
    if (!b || !user) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">Booking not found.</p>
                <button
                    onClick={() => navigate("/bookings")}
                    className="mt-4 text-primary text-sm font-semibold h-11"
                >
                    Back to bookings
                </button>
            </div>
        );
    }

    const role: "client" | "caregiver" =
        user.id === b.caregiver_id ? "caregiver" : "client";
    const other = role === "caregiver" ? b.client : b.caregiver;
    const otherName =
        other?.display_name || (role === "caregiver" ? "Client" : "Caregiver");

    // Only show the verified badge when the viewer is the client
    // (i.e., the counterparty is a caregiver).
    const showBadge = role === "client" && b.caregiverVerified;

    const canCancel =
        role === "client" &&
        ["paid_escrow", "accepted", "en_route"].includes(b.status);

    const showScanButton =
        role === "caregiver" && (b.status === "accepted" || b.status === "en_route");

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="rounded-2xl bg-card px-4 py-4 mb-4">
                <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {other?.avatar_url ? (
                            <img
                                src={other.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-primary font-black">
                                {otherName[0]?.toUpperCase() ?? "?"}
                            </span>
                        )}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                            {role === "caregiver" ? "Client" : "Caregiver"}
                        </p>
                        <Link
                            to={`/profile/${other?.id}`}
                            className="text-base font-black text-foreground truncate active:opacity-70 inline-flex items-center gap-1.5"
                        >
                            {otherName}
                            <VerifiedBadge
                                show={showBadge}
                                className="w-4 h-4 shrink-0"
                            />
                        </Link>
                    </div>
                    <span className="text-right">
                        <p className="text-lg font-black text-foreground">
                            KES {Math.round(b.total_amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                            {label(b.status)}
                        </p>
                    </span>
                </div>
            </div>

            <div className="rounded-2xl bg-card px-4 py-4 mb-4 space-y-3">
                <Row
                    icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                    label="Scheduled"
                    value={
                        b.scheduled_at
                            ? new Date(b.scheduled_at).toLocaleString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "Not scheduled"
                    }
                />
                {b.address_snapshot && (
                    <Row
                        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                        label="Address"
                        value={b.address_snapshot}
                    />
                )}
                {b.duration_minutes && (
                    <Row
                        icon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                        label="Duration"
                        value={`${b.duration_minutes} minutes`}
                    />
                )}
                {b.notes && (
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                            Notes
                        </p>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">
                            {b.notes}
                        </p>
                    </div>
                )}
            </div>

            <StatusTimeline current={b.status} />

            {/* PAY BUTTON — only for the client, only while awaiting payment */}
            {role === "client" && b.status === "pending_payment" && (
                <PayButton
                    bookingId={b.id}
                    defaultPhone={b.whatsapp_number ?? null}
                    amount={Number(b.total_amount ?? 0)}
                />
            )}

            {role === "client" && b.status === "completed" && (
                <div className="mb-4">
                    <RatingPanel
                        bookingId={b.id}
                        serviceId={b.service_id ?? null}
                        caregiverId={b.caregiver_id}
                    />
                </div>
            )}

            {role === "client" && (
                <div className="mb-4">
                    <VisitNotesList bookingId={b.id} />
                </div>
            )}

            {role === "client" && b.status === "accepted" && qrQ.data && (
                <QRDisplay token={qrQ.data.token} expiresAt={qrQ.data.expiresAt} />
            )}

            {showScanButton && (
                <button
                    onClick={() => setScanOpen(true)}
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base mb-4 inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                >
                    <ScanLine className="w-5 h-5" />
                    Scan client QR to confirm arrival
                </button>
            )}

            {role === "caregiver" &&
                (b.status === "in_progress" || b.status === "completed") && (
                    <Link
                        to={`/bookings/${b.id}/notes`}
                        className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-bold text-base mb-4 inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                    >
                        <FileText className="w-5 h-5" />
                        Add visit note
                    </Link>
                )}

            <ActionBar
                role={role}
                status={b.status}
                busy={update.isPending}
                onAdvance={(next) => update.mutate(next)}
                onCancel={() => update.mutate("cancelled")}
                onDispute={() => update.mutate("disputed")}
                canCancel={canCancel}
            />

            <section className="mt-6">
                <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Activity
                </h2>
                {historyQ.data && historyQ.data.length > 0 ? (
                    <div className="space-y-2">
                        {historyQ.data.map((h) => (
                            <div
                                key={h.id}
                                className="rounded-2xl bg-card px-4 py-3 flex items-center justify-between"
                            >
                                <p className="text-sm font-semibold text-foreground capitalize">
                                    {label(h.status)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(h.created_at).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">No activity yet.</p>
                )}
            </section>

            {scanOpen && (
                <QRScanner
                    onClose={() => setScanOpen(false)}
                    onSuccess={() => {
                        qc.invalidateQueries({ queryKey: ["booking", id] });
                        qc.invalidateQueries({ queryKey: ["booking", id, "history"] });
                        qc.invalidateQueries({ queryKey: ["bookings"] });
                    }}
                />
            )}
        </div>
    );
}

/* ---------- pieces ---------- */

function Row({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm text-foreground mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function StatusTimeline({ current }: { current: BookingStatus }) {
    const currentIdx = TIMELINE.indexOf(current);
    const isTerminal = ["cancelled", "refunded", "disputed"].includes(current);

    if (isTerminal) {
        return (
            <div className="rounded-2xl bg-card px-4 py-4 mb-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                </span>
                <div>
                    <p className="text-sm font-bold text-foreground capitalize">
                        {label(current)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {current === "disputed"
                            ? "Under review. Support will reach out."
                            : "This booking ended here."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-4">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                Progress
            </p>
            <ol className="flex items-center gap-1">
                {TIMELINE.map((s, i) => {
                    const done = i <= currentIdx;
                    return (
                        <li key={s} className="flex-1 flex items-center gap-1">
                            <span
                                className={`w-3 h-3 rounded-full transition-colors ${done ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                            {i < TIMELINE.length - 1 && (
                                <span
                                    className={`flex-1 h-0.5 transition-colors ${i < currentIdx ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
            <p className="text-xs text-muted-foreground mt-3 capitalize">
                Current:{" "}
                <span className="text-foreground font-semibold">{label(current)}</span>
            </p>
        </div>
    );
}

function ActionBar({
    role,
    status,
    busy,
    onAdvance,
    onCancel,
    onDispute,
    canCancel,
}: {
    role: "client" | "caregiver";
    status: BookingStatus;
    busy: boolean;
    onAdvance: (next: BookingStatus) => void;
    onCancel: () => void;
    onDispute: () => void;
    canCancel: boolean;
}) {
    const next = NEXT[status];
    const showAdvance =
        next &&
        ((role === "caregiver" &&
            ["paid_escrow", "accepted", "arrived", "in_progress"].includes(status)) ||
            (role === "client" && status === "in_progress"));

    const advanceLabel: Partial<Record<BookingStatus, string>> = {
        accepted: "Accept booking",
        en_route: "I'm on the way",
        in_progress: "Start visit",
        completed: "Mark completed",
    };

    const advanceIcon: Partial<Record<BookingStatus, React.ReactNode>> = {
        accepted: <Check className="w-5 h-5" />,
        en_route: <Navigation className="w-5 h-5" />,
        in_progress: <Play className="w-5 h-5" />,
        completed: <CheckCircle2 className="w-5 h-5" />,
    };

    return (
        <div className="space-y-2">
            {showAdvance && next && (
                <button
                    onClick={() => onAdvance(next)}
                    disabled={busy}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                >
                    {advanceIcon[next]}
                    {advanceLabel[next] ?? "Advance"}
                </button>
            )}

            <div className="flex gap-2">
                {canCancel && (
                    <button
                        onClick={onCancel}
                        disabled={busy}
                        className="flex-1 h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:bg-secondary transition-colors disabled:opacity-60"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel
                    </button>
                )}
                {(status === "in_progress" || status === "arrived") &&
                    role === "client" && (
                        <button
                            onClick={onDispute}
                            disabled={busy}
                            className="flex-1 h-11 rounded-2xl bg-destructive/10 text-destructive text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:bg-destructive/20 transition-colors disabled:opacity-60"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Raise issue
                        </button>
                    )}
            </div>
        </div>
    );
}