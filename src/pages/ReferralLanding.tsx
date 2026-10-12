// src/pages/ReferralLanding.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    ShieldCheck,
    Stethoscope,
    User,
    X,
    AlertCircle,
    LogIn,
    Send,
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
    hospital_id: string;
    referring_user_id: string;
    patient_phone: string;
    patient_name: string | null;
    patient_user_id: string | null;
    services_needed: ReferralServiceType[];
    urgency: string;
    recommended_start_date: string | null;
    recommended_end_date: string | null;
    note_to_patient: string | null;
    note_to_caregiver: string | null;
    status: ReferralStatus;
    expires_at: string;
    created_at: string;
};

type HospitalLite = {
    id: string;
    name: string;
    county: string | null;
    city: string | null;
    verified: boolean;
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

// ---- fetches ---------------------------------------------------------------

async function fetchReferral(id: string): Promise<ReferralRow | null> {
    const { data, error } = await supabase
        .from("referrals")
        .select(
            "id, hospital_id, referring_user_id, patient_phone, patient_name, patient_user_id, services_needed, urgency, recommended_start_date, recommended_end_date, note_to_patient, note_to_caregiver, status, expires_at, created_at"
        )
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
    if (error) throw error;
    return (data as ReferralRow) ?? null;
}

async function fetchHospital(id: string): Promise<HospitalLite | null> {
    const { data, error } = await supabase
        .from("hospitals")
        .select("id, name, county, city, verified")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
    if (error) throw error;
    return (data as HospitalLite) ?? null;
}

async function fetchDoctorName(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
    if (error) return null;
    return (data as { display_name: string } | null)?.display_name ?? null;
}

async function fetchMyPhone(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", userId)
        .maybeSingle();
    if (error) return null;
    return (data as { phone_number: string | null } | null)?.phone_number ?? null;
}

// ---- page ------------------------------------------------------------------

export default function ReferralLanding() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { user, loading: sessionLoading } = useSession();

    const referralQuery = useQuery({
        queryKey: ["referral", id],
        enabled: !!id,
        staleTime: 30_000,
        queryFn: () => fetchReferral(id!),
    });

    const referral = referralQuery.data ?? null;

    // Is the current viewer the referring doctor?
    const isReferringDoctor =
        !!user && !!referral && user.id === referral.referring_user_id;

    // Is the current viewer the patient? (i.e. signed in, phone matches)
    const hospitalQuery = useQuery({
        queryKey: ["hospital", referral?.hospital_id],
        enabled: !!referral?.hospital_id,
        staleTime: 5 * 60_000,
        queryFn: () => fetchHospital(referral!.hospital_id),
    });

    const doctorQuery = useQuery({
        queryKey: ["profile", referral?.referring_user_id],
        enabled: !!referral?.referring_user_id && !isReferringDoctor,
        staleTime: 5 * 60_000,
        queryFn: () => fetchDoctorName(referral!.referring_user_id),
    });

    const myPhoneQuery = useQuery({
        queryKey: ["profile", "phone", user?.id],
        enabled: !!user && !isReferringDoctor,
        staleTime: 5 * 60_000,
        queryFn: () => fetchMyPhone(user!.id),
    });

    const phoneMatches = useMemo(() => {
        if (!referral || !myPhoneQuery.data) return false;
        return phonesMatch(referral.patient_phone, myPhoneQuery.data);
    }, [referral, myPhoneQuery.data]);

    const acceptMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc("accept_referral", {
                p_referral_id: id!,
            });
            if (error) throw error;
            return data as string;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["referral", id] });
            navigate(`/explore?referral=${id}`, { replace: true });
        },
    });

    const declineMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc("decline_referral", {
                p_referral_id: id!,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["referral", id] });
        },
    });

    if (sessionLoading || referralQuery.isLoading) return <PageSkeleton />;

    if (!referral) {
        return (
            <CenteredCard>
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">
                    Referral not found
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                    The link may be broken, or the referral was removed.
                </p>
            </CenteredCard>
        );
    }

    // ---- DOCTOR VIEW ------------------------------------------------------
    if (isReferringDoctor) {
        return (
            <div className="max-w-md mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
                <header className="pt-4 pb-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/referrals")}
                        aria-label="Back"
                        className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base font-black tracking-tight text-foreground truncate">
                            You referred this patient
                        </h1>
                        <p className="text-[11px] text-muted-foreground">
                            Read-only view
                        </p>
                    </div>
                </header>

                <DoctorStatusCard referral={referral} />

                <SummaryCards
                    referral={referral}
                    hospital={hospitalQuery.data ?? null}
                    showNoteToPatient={false}
                    showNoteToCaregiver={true}
                />

                <div className="mt-4 flex flex-col gap-2">
                    <Link
                        to="/referrals"
                        className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to referrals
                    </Link>
                    <Link
                        to="/referrals/dashboard"
                        className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        Adherence dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // ---- PATIENT / ANON / OTHER VIEW --------------------------------------
    return (
        <div className="max-w-md mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-6 pb-4 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
                    <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-foreground">
                    You've been referred for home care
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                    {doctorQuery.data
                        ? `${doctorQuery.data} recommended a caregiver visit`
                        : "A clinician recommended a caregiver visit"}
                </p>
            </header>

            <SummaryCards
                referral={referral}
                hospital={hospitalQuery.data ?? null}
                showNoteToPatient={true}
                showNoteToCaregiver={false}
            />

            {/* State-dependent footer ----------------------------------- */}
            {referral.status === "accepted" && (
                <>
                    <StatusCard tone="success" title="Referral accepted">
                        A care team has been created. Open the app to continue.
                    </StatusCard>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard", { replace: true })}
                        className="mt-3 w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                    >
                        <LogIn className="w-4 h-4" />
                        Open your dashboard
                    </button>
                </>
            )}
            {referral.status === "declined" && (
                <StatusCard tone="muted" title="Referral declined">
                    You declined this referral. If that was a mistake, contact the
                    hospital.
                </StatusCard>
            )}

            {referral.status === "expired" && (
                <StatusCard tone="muted" title="Referral expired">
                    This referral is past its expiry date. Ask your doctor to send a new
                    one.
                </StatusCard>
            )}

            {referral.status === "converted" && (
                <>
                    <StatusCard tone="success" title="Booking created">
                        A booking already exists for this referral. Open the app to view it.
                    </StatusCard>
                    <button
                        type="button"
                        onClick={() =>
                            referral.patient_user_id && referral.patient_user_id === user?.id
                                ? navigate("/bookings", { replace: true })
                                : navigate("/dashboard", { replace: true })
                        }
                        className="mt-3 w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                    >
                        {referral.patient_user_id && referral.patient_user_id === user?.id
                            ? "View your booking"
                            : "Open your dashboard"}
                    </button>
                </>
            )}
            {referral.status === "pending" && !user && (
                <>
                    <div className="rounded-2xl bg-muted p-3 mb-3 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground">
                            You'll need an account so we can verify your number and
                            set up the care team. Takes about a minute.
                        </p>
                    </div>

                    <Link
                        to={`/auth?mode=signup&next=${encodeURIComponent(
                            `/referral/${referral.id}`
                        )}`}
                        className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                    >
                        <LogIn className="w-4 h-4" />
                        Create an account to accept
                    </Link>

                    <button
                        type="button"
                        disabled
                        className="mt-2 w-full h-11 rounded-2xl bg-muted text-muted-foreground text-sm font-bold inline-flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                    >
                        <X className="w-4 h-4" />
                        Decline
                    </button>
                </>
            )}

            {referral.status === "pending" && user && !phoneMatches && (
                <div className="rounded-2xl bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-destructive">
                            This referral isn't for your number
                        </p>
                        <p className="text-[11px] text-destructive/80 mt-0.5">
                            The referral was sent to a different phone number. Contact
                            the hospital if this is a mistake.
                        </p>
                    </div>
                </div>
            )}

            {referral.status === "pending" && user && phoneMatches && (
                <>
                    {(acceptMutation.isError || declineMutation.isError) && (
                        <div className="rounded-2xl bg-destructive/10 p-3 mb-3 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs text-destructive">
                                {(
                                    (acceptMutation.error ??
                                        declineMutation.error) as Error
                                )?.message ?? "Something went wrong. Try again."}
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => acceptMutation.mutate()}
                        disabled={
                            acceptMutation.isPending || declineMutation.isPending
                        }
                        className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {acceptMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        Accept referral
                    </button>

                    <button
                        type="button"
                        onClick={() => declineMutation.mutate()}
                        disabled={
                            acceptMutation.isPending || declineMutation.isPending
                        }
                        className="mt-2 w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors disabled:opacity-50"
                    >
                        {declineMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                        Decline
                    </button>
                </>
            )}

            <p className="text-[11px] text-muted-foreground text-center mt-4">
                Expires{" "}
                {new Date(referral.expires_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </p>
        </div>
    );
}

// ---- shared summary cards --------------------------------------------------

function SummaryCards({
    referral,
    hospital,
    showNoteToPatient,
    showNoteToCaregiver,
}: {
    referral: ReferralRow;
    hospital: HospitalLite | null;
    showNoteToPatient: boolean;
    showNoteToCaregiver: boolean;
}) {
    return (
        <>
            <div className="rounded-2xl bg-card p-4 mb-3">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">
                            {hospital?.name ?? "Hospital"}
                        </p>
                        {(hospital?.city || hospital?.county) && (
                            <p className="text-xs text-muted-foreground">
                                {[hospital?.city, hospital?.county]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        )}
                    </div>
                    {hospital?.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                        </span>
                    )}
                </div>
            </div>

            {referral.patient_name && (
                <div className="rounded-2xl bg-card p-4 mb-3 flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Patient
                        </p>
                        <p className="text-sm font-bold text-foreground truncate">
                            {referral.patient_name}
                        </p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl bg-card p-4 mb-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                    Services recommended
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {referral.services_needed.map((s) => (
                        <span
                            key={s}
                            className="px-2.5 py-1 rounded-full bg-primary/10 text-[11px] font-bold text-primary"
                        >
                            {SERVICE_LABEL[s]}
                        </span>
                    ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <span
                        className={
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold " +
                            (referral.urgency === "urgent"
                                ? "bg-destructive/10 text-destructive"
                                : referral.urgency === "soon"
                                    ? "bg-muted text-foreground"
                                    : "bg-muted text-muted-foreground")
                        }
                    >
                        <Clock className="w-3 h-3" />
                        {referral.urgency === "urgent"
                            ? "Urgent"
                            : referral.urgency === "soon"
                                ? "Within 48 hours"
                                : "Routine"}
                    </span>
                </div>

                {(referral.recommended_start_date ||
                    referral.recommended_end_date) && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                {referral.recommended_start_date ?? "—"}
                                {referral.recommended_end_date
                                    ? ` → ${referral.recommended_end_date}`
                                    : ""}
                            </span>
                        </div>
                    )}
            </div>

            {showNoteToPatient && referral.note_to_patient && (
                <div className="rounded-2xl bg-card p-4 mb-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Note from your doctor
                    </p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {referral.note_to_patient}
                    </p>
                </div>
            )}

            {showNoteToCaregiver && referral.note_to_caregiver && (
                <div className="rounded-2xl bg-card p-4 mb-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Note to caregiver
                    </p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {referral.note_to_caregiver}
                    </p>
                </div>
            )}
        </>
    );
}

// ---- doctor status card ----------------------------------------------------

function DoctorStatusCard({ referral }: { referral: ReferralRow }) {
    const tone =
        referral.status === "accepted" || referral.status === "converted"
            ? "success"
            : referral.status === "declined" || referral.status === "expired"
                ? "muted"
                : "muted";

    const title =
        referral.status === "pending"
            ? "Waiting for patient to accept"
            : referral.status === "accepted"
                ? "Patient accepted"
                : referral.status === "converted"
                    ? "Booking created"
                    : referral.status === "declined"
                        ? "Patient declined"
                        : "Referral expired";

    const body =
        referral.status === "pending"
            ? `Sent ${relative(referral.created_at)} · expires ${relativeFuture(
                referral.expires_at
            )}`
            : referral.status === "accepted"
                ? "A care team thread has been opened."
                : referral.status === "converted"
                    ? "The patient booked a caregiver."
                    : referral.status === "declined"
                        ? "The patient declined this referral."
                        : "The referral passed its expiry date.";

    const bg = tone === "success" ? "bg-success/10" : "bg-muted";
    const fg = tone === "success" ? "text-success" : "text-muted-foreground";

    return (
        <div className={`rounded-2xl ${bg} p-4 mb-3`}>
            <p className={`text-sm font-bold ${fg}`}>{title}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{body}</p>
        </div>
    );
}

// ---- pieces ----------------------------------------------------------------

function CenteredCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
            {children}
        </div>
    );
}

function StatusCard({
    tone,
    title,
    children,
}: {
    tone: "success" | "muted";
    title: string;
    children: React.ReactNode;
}) {
    const bg = tone === "success" ? "bg-success/10" : "bg-muted";
    const fg = tone === "success" ? "text-success" : "text-muted-foreground";
    return (
        <div className={`rounded-2xl ${bg} p-4 text-center`}>
            <p className={`text-sm font-bold ${fg}`}>{title}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{children}</p>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="max-w-md mx-auto px-2 sm:px-4 py-6 space-y-3">
            <div className="h-12 w-12 rounded-full skeleton-shimmer mx-auto mb-3" />
            <div className="h-6 w-3/4 rounded-2xl skeleton-shimmer mx-auto" />
            <div className="h-20 rounded-2xl skeleton-shimmer" />
            <div className="h-24 rounded-2xl skeleton-shimmer" />
            <div className="h-11 rounded-2xl skeleton-shimmer" />
        </div>
    );
}

// ---- helpers ---------------------------------------------------------------

function phonesMatch(a: string, b: string): boolean {
    const digits = (s: string) => s.replace(/\D/g, "").slice(-9);
    return digits(a) === digits(b);
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