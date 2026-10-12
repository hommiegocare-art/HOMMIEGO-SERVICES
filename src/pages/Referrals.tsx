// src/pages/Referrals.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    ChevronRight,
    Clock,
    Loader2,
    MoreVertical,
    Phone,
    Plus,
    Send,
    X,
    MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// ---- types -----------------------------------------------------------------

type ReferralServiceType =
    | "home_nursing" | "wound_care" | "medication_admin" | "physiotherapy"
    | "elderly_care" | "postnatal" | "transport" | "lab_delivery" | "other";

type ReferralStatus =
    | "pending" | "accepted" | "declined" | "expired" | "converted";

type ReferralRow = {
    id: string;
    patient_phone: string;
    patient_name: string | null;
    services_needed: ReferralServiceType[];
    urgency: string;
    recommended_start_date: string | null;
    recommended_end_date: string | null;
    status: ReferralStatus;
    consent_sent_at: string | null;
    consent_granted_at: string | null;
    declined_at: string | null;
    expires_at: string;
    converted_booking_id: string | null;
    created_at: string;
    hospital: { id: string; name: string } | null;
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

const SERVICE_LABEL: Record<ReferralServiceType, string> = {
    home_nursing: "Home nursing",
    wound_care: "Wound care",
    medication_admin: "Medication administration",
    physiotherapy: "Physiotherapy",
    elderly_care: "Elderly care",
    postnatal: "Postnatal care",
    transport: "Transport",
    lab_delivery: "Lab sample / result delivery",
    other: "Other",
};

const STATUS_LABEL: Record<ReferralStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
    converted: "Converted",
};

type FilterKey = "all" | "pending" | "accepted" | "converted" | "closed";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "converted", label: "Converted" },
    { key: "closed", label: "Closed" },
];

// ---- fetch -----------------------------------------------------------------

async function fetchReferrals(userId: string): Promise<ReferralRow[]> {
    const { data, error } = await supabase
        .from("referrals")
        .select(
            "id, patient_phone, patient_name, services_needed, urgency, recommended_start_date, recommended_end_date, status, consent_sent_at, consent_granted_at, declined_at, expires_at, converted_booking_id, created_at, hospital:hospitals(id, name)"
        )
        .eq("referring_user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as ReferralRow[];
}

// ---- WhatsApp helpers ------------------------------------------------------

function normalisePhone(raw: string): string {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("0")) return "+254" + digits.slice(1);
    if (digits.startsWith("254")) return "+" + digits;
    return "+254" + digits;
}

function toWaNumber(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    return digits;
}

function buildWhatsAppLink(number: string, message: string): string {
    return `https://wa.me/${toWaNumber(number)}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(link: string): boolean {
    try {
        const w = window.open(link, "_blank", "noopener,noreferrer");
        return !!w;
    } catch {
        return false;
    }
}

function buildResendMessage(referral: ReferralRow, link: string): string {
    const greeting = referral.patient_name
        ? `Hello ${referral.patient_name},`
        : "Hello,";

    const who = referral.hospital?.name
        ? `at ${referral.hospital.name}`
        : null;

    const lines: string[] = [greeting, ""];

    if (who) {
        lines.push(
            `Your care team ${who} has recommended home care for you after discharge.`
        );
    } else {
        lines.push(
            "A clinician has recommended home care for you after discharge."
        );
    }

    lines.push("");
    if (referral.services_needed.length > 0) {
        lines.push(
            `Services: ${referral.services_needed
                .map((s) => SERVICE_LABEL[s])
                .join(", ")}`
        );
    }
    const urgencyLine =
        referral.urgency === "urgent"
            ? "Urgent"
            : referral.urgency === "soon"
                ? "Within 48 hours"
                : "Routine";
    lines.push(`Urgency: ${urgencyLine}`);

    const start = referral.recommended_start_date ?? "";
    const end = referral.recommended_end_date ?? "";
    if (start || end) {
        lines.push(`Care window: ${[start, end].filter(Boolean).join(" → ")}`);
    }

    lines.push("");
    lines.push("Tap to review and accept:");
    lines.push(link);
    lines.push("");
    lines.push("— HommieCare");

    return lines.join("\n");
}

// ---- page ------------------------------------------------------------------

export default function Referrals() {
    const { user } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [filter, setFilter] = useState<FilterKey>("all");
    const [menuFor, setMenuFor] = useState<ReferralRow | null>(null);

    const query = useQuery({
        queryKey: ["referrals", "mine", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: () => fetchReferrals(user!.id),
    });

    const all = query.data ?? [];

    const filtered = useMemo(() => {
        if (filter === "all") return all;
        if (filter === "closed")
            return all.filter((r) => r.status === "declined" || r.status === "expired");
        return all.filter((r) => r.status === filter);
    }, [all, filter]);

    const grouped = useMemo(() => {
        const g: Record<ReferralStatus, ReferralRow[]> = {
            pending: [],
            accepted: [],
            converted: [],
            declined: [],
            expired: [],
        };
        for (const r of filtered) g[r.status].push(r);
        return g;
    }, [filtered]);

    const counts = useMemo(() => {
        const c: Record<FilterKey, number> = {
            all: all.length,
            pending: 0,
            accepted: 0,
            converted: 0,
            closed: 0,
        };
        for (const r of all) {
            if (r.status === "pending") c.pending += 1;
            else if (r.status === "accepted") c.accepted += 1;
            else if (r.status === "converted") c.converted += 1;
            else c.closed += 1;
        }
        return c;
    }, [all]);

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-4 pb-3 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        Referrals
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Patients you've sent home with a care plan
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/referrals/new")}
                    className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New
                </button>
            </header>

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
                <EmptyState
                    filter={filter}
                    onNew={() => navigate("/referrals/new")}
                />
            ) : (
                <div className="space-y-5">
                    {grouped.pending.length > 0 && (
                        <Group title="Pending">
                            {grouped.pending.map((r) => (
                                <ReferralCard
                                    key={r.id}
                                    referral={r}
                                    onOpen={() => navigate(`/referral/${r.id}`)}
                                    onMenu={() => setMenuFor(r)}
                                />
                            ))}
                        </Group>
                    )}

                    {grouped.accepted.length > 0 && (
                        <Group title="Accepted">
                            {grouped.accepted.map((r) => (
                                <ReferralCard
                                    key={r.id}
                                    referral={r}
                                    onOpen={() => navigate(`/referral/${r.id}`)}
                                    onMenu={() => setMenuFor(r)}
                                />
                            ))}
                        </Group>
                    )}

                    {grouped.converted.length > 0 && (
                        <Group title="Converted">
                            {grouped.converted.map((r) => (
                                <ReferralCard
                                    key={r.id}
                                    referral={r}
                                    onOpen={() => {
                                        if (r.converted_booking_id) {
                                            navigate(`/bookings/${r.converted_booking_id}`);
                                        } else {
                                            navigate(`/referral/${r.id}`);
                                        }
                                    }}
                                    onMenu={() => setMenuFor(r)}
                                />
                            ))}
                        </Group>
                    )}

                    {(grouped.declined.length > 0 || grouped.expired.length > 0) && (
                        <Group title="History">
                            {[...grouped.declined, ...grouped.expired].map((r) => (
                                <ReferralCard
                                    key={r.id}
                                    referral={r}
                                    onOpen={() => navigate(`/referral/${r.id}`)}
                                    onMenu={() => setMenuFor(r)}
                                />
                            ))}
                        </Group>
                    )}
                </div>
            )}

            {menuFor && (
                <ActionSheet
                    referral={menuFor}
                    onClose={() => setMenuFor(null)}
                    onResent={() => {
                        qc.invalidateQueries({
                            queryKey: ["referrals", "mine", user?.id],
                        });
                        setMenuFor(null);
                    }}
                />
            )}
        </div>
    );
}

// ---- group -----------------------------------------------------------------

function Group({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                {title}
            </h2>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

// ---- card ------------------------------------------------------------------

function ReferralCard({
    referral,
    onOpen,
    onMenu,
}: {
    referral: ReferralRow;
    onOpen: () => void;
    onMenu: () => void;
}) {
    const status = referral.status;
    const phone = referral.patient_phone;

    return (
        <div className="rounded-2xl bg-card p-3 sm:p-4">
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={onOpen}
                    className="min-w-0 flex-1 text-left active:opacity-80 transition-opacity"
                >
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-foreground truncate">
                            {referral.patient_name || formatPhone(phone)}
                        </p>
                        <StatusChip status={status} />
                    </div>

                    {referral.patient_name && (
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {formatPhone(phone)}
                        </p>
                    )}

                    {referral.hospital?.name && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {referral.hospital.name}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                        {referral.services_needed.slice(0, 4).map((s) => (
                            <span
                                key={s}
                                className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                            >
                                {SERVICE_SHORT[s]}
                            </span>
                        ))}
                        {referral.services_needed.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                +{referral.services_needed.length - 4}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relative(referral.created_at)}
                        </span>
                        {status === "pending" && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires {relativeFuture(referral.expires_at)}
                            </span>
                        )}
                        {status === "accepted" && referral.consent_granted_at && (
                            <span className="inline-flex items-center gap-1 text-success">
                                Accepted {relative(referral.consent_granted_at)}
                            </span>
                        )}
                    </div>
                </button>

                <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={onMenu}
                        aria-label="More"
                        className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}

function StatusChip({ status }: { status: ReferralStatus }) {
    const cls =
        status === "pending"
            ? "bg-muted text-foreground"
            : status === "accepted"
                ? "bg-primary/10 text-primary"
                : status === "converted"
                    ? "bg-success/10 text-success"
                    : status === "declined"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground";
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}

// ---- action sheet ----------------------------------------------------------

function ActionSheet({
    referral,
    onClose,
    onResent,
}: {
    referral: ReferralRow;
    onClose: () => void;
    onResent: () => void;
}) {
    const [busy, setBusy] = useState<"resend" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [opened, setOpened] = useState(false);

    const link =
        typeof window !== "undefined"
            ? `${window.location.origin}/referral/${referral.id}`
            : `/referral/${referral.id}`;

    const canResend = referral.status === "pending";

    const waLink = buildWhatsAppLink(
        referral.patient_phone,
        buildResendMessage(referral, link)
    );

    const onResend = async () => {
        setError(null);
        setBusy("resend");
        try {
            const ok = openWhatsApp(waLink);
            setOpened(true);
            if (!ok) {
                setError(
                    "Couldn't open WhatsApp automatically. Use the link below."
                );
            }

            // Mark that we attempted to share. Best-effort.
            if (!referral.consent_sent_at) {
                await supabase
                    .from("referrals")
                    .update({ consent_sent_at: new Date().toISOString() })
                    .eq("id", referral.id);
            }

            onResent();
        } catch (e) {
            setError((e as Error)?.message ?? "Could not open WhatsApp.");
        } finally {
            setBusy(null);
        }
    };

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(waLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center">
            <div onClick={onClose} className="absolute inset-0" aria-hidden />
            <div
                className="relative w-full max-w-3xl bg-background rounded-t-3xl animate-slide-up"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="pt-3 pb-2 flex justify-center">
                    <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>

                <div className="px-4 sm:px-6 pb-6">
                    <div className="flex items-start gap-3 pb-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                                {referral.patient_name ||
                                    formatPhone(referral.patient_phone)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {STATUS_LABEL[referral.status]} ·{" "}
                                {new Date(referral.created_at).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" }
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {canResend && (
                            <button
                                type="button"
                                onClick={onResend}
                                disabled={busy !== null}
                                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {busy === "resend" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MessageCircle className="w-4 h-4" />
                                )}
                                {opened
                                    ? "Open WhatsApp again"
                                    : "Resend via WhatsApp"}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onCopy}
                            className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {copied ? "Copied!" : "Copy WhatsApp link"}
                        </button>

                        <Link
                            to={`/referral/${referral.id}`}
                            onClick={onClose}
                            className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                        >
                            Open landing page
                        </Link>
                    </div>

                    {error && (
                        <p className="text-xs text-destructive mt-3 text-center">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---- states ----------------------------------------------------------------

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                            <div className="h-3 rounded skeleton-shimmer w-1/2" />
                            <div className="h-2.5 rounded skeleton-shimmer w-1/3" />
                            <div className="h-2.5 rounded skeleton-shimmer w-2/3" />
                        </div>
                        <div className="h-9 w-9 rounded-full skeleton-shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({
    filter,
    onNew,
}: {
    filter: FilterKey;
    onNew: () => void;
}) {
    const copy =
        filter === "all"
            ? "You haven't sent any referrals yet."
            : `No ${filter} referrals.`;
    return (
        <div className="py-16 text-center animate-fade-in">
            <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{copy}</p>
            {filter === "all" && (
                <button
                    type="button"
                    onClick={onNew}
                    className="mt-5 inline-flex h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold items-center justify-center gap-2 active:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Send first referral
                </button>
            )}
        </div>
    );
}

// ---- helpers ---------------------------------------------------------------

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