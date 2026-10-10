import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    BadgeCheck,
    Loader2,
    MapPin,
    Phone,
    ShieldCheck,
    ShieldOff,
    RotateCcw,
    X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useAdmin } from "@/hooks/useAdmin";

type Action = "approve" | "reject" | "revoke" | "unreject";

type Detail = {
    user_id: string;
    professional_title: string | null;
    bio: string | null;
    specialties: string[];
    languages: string[];
    years_experience: number;
    license_number: string | null;
    license_type: string | null;
    credentials: unknown;
    verification_status: string;
    verification_notes: string | null;
    service_area_counties: string[];
    profile: {
        display_name: string | null;
        legal_name: string | null;
        phone_number: string | null;
        county: string | null;
        city: string | null;
        email: string | null;
    } | null;
};

async function fetchDetail(userId: string): Promise<Detail | null> {
    const { data, error } = await supabase
        .from("caregiver_profiles")
        .select(
            "user_id, professional_title, bio, specialties, languages, years_experience, license_number, license_type, credentials, verification_status, verification_notes, service_area_counties, profile:profiles!caregiver_profiles_user_id_fkey(display_name, legal_name, phone_number, county, city, email)"
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as any;
    return {
        ...row,
        profile: Array.isArray(row.profile) ? row.profile[0] ?? null : row.profile,
    } as Detail;
}

export default function AdminVerificationDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { user, loading: sessionLoading } = useSession();
    const { isVerifier, loading: adminLoading } = useAdmin();

    const [confirming, setConfirming] = useState<null | "reject" | "revoke">(null);
    const [reason, setReason] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["admin", "verification", id],
        enabled: isVerifier && !!id,
        staleTime: 15_000,
        refetchOnMount: "always",
        queryFn: () => fetchDetail(id!),
    });

    const act = useMutation({
        mutationFn: async (payload: { action: Action; reason?: string }) => {
            if (!id) throw new Error("Missing user id");

            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("Not signed in");

            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verification-action`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: id,
                    action: payload.action,
                    reason: payload.reason,
                }),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(body || `Request failed (${res.status})`);
            }
            return res.json();
        },
        onSuccess: () => {
            setConfirming(null);
            setReason("");
            qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
            qc.invalidateQueries({ queryKey: ["admin", "verification", id] });
            qc.invalidateQueries({ queryKey: ["profile"] });
        },
        onError: (e) => {
            setErrorMsg((e as Error).message || "Action failed");
        },
    });

    if (sessionLoading || adminLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) return <Navigate to="/auth" replace />;
    if (!isVerifier) return <Navigate to="/" replace />;

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6">
                <Link
                    to="/admin/verifications"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground h-11"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to queue
                </Link>
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 mt-4">
                    <p className="text-sm text-destructive">
                        Could not load caregiver:{" "}
                        {(error as Error | null)?.message ?? "Not found"}
                    </p>
                </div>
            </div>
        );
    }

    const name =
        data.profile?.display_name ||
        data.profile?.legal_name ||
        "Unnamed caregiver";
    const loc = [data.profile?.city, data.profile?.county]
        .filter(Boolean)
        .join(", ");

    const status = data.verification_status;
    const busy = act.isPending;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <Link
                to="/admin/verifications"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground h-11 mb-2"
            >
                <ArrowLeft className="w-4 h-4" /> Back to queue
            </Link>

            <header className="flex items-start gap-4 mb-5">
                <span className="w-16 h-16 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
                    <span className="text-xl font-black text-primary">
                        {name[0]?.toUpperCase() ?? "?"}
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black tracking-tight text-foreground truncate">
                            {name}
                        </h1>
                        <VerifiedBadge show={caregiver?.verification_status === "verified"} />
                    </div>
                    {data.professional_title && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {data.professional_title}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {loc && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {loc}
                            </span>
                        )}
                        {data.profile?.phone_number && (
                            <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {data.profile.phone_number}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <Section title="Status">
                <p className="text-sm text-foreground capitalize">{status}</p>
                {data.verification_notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Notes: {data.verification_notes}
                    </p>
                )}
            </Section>

            <Section title="Registration">
                <Row label="License number" value={data.license_number ?? "—"} />
                <Row label="License type" value={data.license_type ?? "—"} />
                <Row
                    label="Years of experience"
                    value={String(data.years_experience ?? 0)}
                />
            </Section>

            <Section title="Service">
                <Row
                    label="Counties"
                    value={
                        data.service_area_counties?.length
                            ? data.service_area_counties.join(", ")
                            : "—"
                    }
                />
                <Row
                    label="Specialties"
                    value={
                        data.specialties?.length ? data.specialties.join(", ") : "—"
                    }
                />
                <Row
                    label="Languages"
                    value={data.languages?.length ? data.languages.join(", ") : "—"}
                />
            </Section>

            {data.bio && (
                <Section title="Bio">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {data.bio}
                    </p>
                </Section>
            )}

            {errorMsg && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 mb-4">
                    <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
            )}

            {/* ---- Confirm panel (reject / revoke) ---- */}
            {confirming && (
                <div className="space-y-3 mb-4">
                    <div className="rounded-2xl bg-card px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            {confirming === "revoke"
                                ? "Reason for revoking verification"
                                : "Reason for rejection"}
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder={
                                confirming === "revoke"
                                    ? "e.g. Account documents found to be fraudulent"
                                    : "e.g. Licence number could not be verified"
                            }
                            className="w-full rounded-2xl bg-muted px-3 py-2 text-sm text-foreground outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setConfirming(null);
                                setReason("");
                                setErrorMsg(null);
                            }}
                            className="flex-1 h-12 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            onClick={() => {
                                setErrorMsg(null);
                                act.mutate({
                                    action: confirming,
                                    reason: reason.trim(),
                                });
                            }}
                            disabled={!reason.trim() || busy}
                            className="flex-1 h-12 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            {busy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : confirming === "revoke" ? (
                                "Confirm revoke"
                            ) : (
                                "Confirm rejection"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ---- Action buttons by status ---- */}
            {!confirming && status === "pending" && (
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setErrorMsg(null);
                            setConfirming("reject");
                        }}
                        disabled={busy}
                        className="flex-1 h-12 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold active:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => {
                            setErrorMsg(null);
                            act.mutate({ action: "approve" });
                        }}
                        disabled={busy}
                        className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" /> Approve
                            </>
                        )}
                    </button>
                </div>
            )}

            {!confirming && status === "verified" && (
                <div className="space-y-3">
                    <div className="rounded-2xl bg-muted px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            This caregiver is verified. If the account turns out to be
                            invalid, revoke the verification below.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setErrorMsg(null);
                            setConfirming("revoke");
                        }}
                        disabled={busy}
                        className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        <ShieldOff className="w-4 h-4" /> Revoke verification
                    </button>
                </div>
            )}

            {!confirming && status === "rejected" && (
                <div className="space-y-3">
                    <div className="rounded-2xl bg-muted px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            This caregiver was rejected. You can move them back to
                            pending for a fresh review.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setErrorMsg(null);
                            act.mutate({ action: "unreject" });
                        }}
                        disabled={busy}
                        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <RotateCcw className="w-4 h-4" /> Move back to pending
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-5">
            <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                {title}
            </h2>
            <div className="rounded-2xl bg-card px-4 py-3 space-y-1">{children}</div>
        </section>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 py-0.5">
            <span className="text-xs text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm text-foreground text-right break-words">
                {value}
            </span>
        </div>
    );
}