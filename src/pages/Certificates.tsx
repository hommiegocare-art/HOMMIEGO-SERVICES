// src/pages/Certificates.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Award,
    ArrowRight,
    Download,
    CheckCircle2,
    X,
    ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { downloadCertificate } from "@/lib/downloadCertificate";
import type { ServiceMilestone } from "@/types/db";

/* ---------- fetch ---------- */

async function fetchMilestones(caregiverId: string): Promise<ServiceMilestone[]> {
    const { data, error } = await supabase
        .from("service_milestones")
        .select("*")
        .eq("caregiver_id", caregiverId)
        .order("milestone", { ascending: false })
        .limit(100);
    if (error) throw error;
    return (data ?? []) as ServiceMilestone[];
}

/* ---------- page ---------- */

export default function Certificates() {
    const { user, loading: sessionLoading } = useSession();
    const [selected, setSelected] = useState<ServiceMilestone | null>(null);

    const { data: milestones = [], isLoading } = useQuery({
        queryKey: ["certificates", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchMilestones(user!.id),
    });

    if (sessionLoading || isLoading) {
        return <PageSkeleton />;
    }

    if (!user) {
        return (
            <div className="max-w-3xl mx-auto px-2 sm:px-4 py-20 text-center">
                <p className="text-sm text-muted-foreground">Sign in required.</p>
            </div>
        );
    }

    const earned = milestones.length;
    const completed = milestones[0]?.milestone ?? 0;

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 animate-fade-in">
            <header className="mb-5 px-2 sm:px-0">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Certificates
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Every 10 completed services earns a HommieCare certificate. Tap a
                    certificate to view or download it.
                </p>
            </header>

            {/* Summary strip */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-2xl bg-card px-4 py-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Earned
                    </p>
                    <p className="text-2xl font-black text-foreground mt-1">
                        {earned}
                    </p>
                </div>
                <div className="rounded-2xl bg-card px-4 py-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Latest milestone
                    </p>
                    <p className="text-2xl font-black text-foreground mt-1">
                        {completed > 0 ? completed : "—"}
                    </p>
                </div>
            </div>

            {milestones.length === 0 ? (
                <EmptyState />
            ) : (
                <section>
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 px-2 sm:px-0">
                        Your milestones
                    </h2>
                    <div className="space-y-2">
                        {milestones.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSelected(m)}
                                className="w-full text-left rounded-2xl bg-card px-4 py-4 active:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Award className="w-5 h-5 text-primary" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-foreground truncate">
                                                Milestone {m.milestone}
                                            </p>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Awarded
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {m.milestone} completed services ·{" "}
                                            {new Date(m.awarded_at).toLocaleDateString(
                                                undefined,
                                                {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </p>
                                        <p className="text-[10px] font-mono text-muted-foreground mt-1">
                                            {m.certificate_code ?? "—"}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
            {selected && (
                <CertificateSheet
                    milestone={selected}
                    caregiverId={user.id}
                    caregiverName={user.display_name || "Caregiver"}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

/* ---------- preview sheet ---------- */
function CertificateSheet({
    milestone,
    caregiverId,
    caregiverName,
    onClose,
}: {
    milestone: ServiceMilestone;
    caregiverId: string;
    caregiverName: string;
    onClose: () => void;
}) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch the exact services that earned this milestone
    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: [
            "milestone-services",
            caregiverId,
            milestone.milestone,
        ],
        enabled: !!caregiverId,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                "milestone_service_breakdown",
                {
                    p_caregiver_id: caregiverId,
                    p_milestone: milestone.milestone,
                },
            );
            if (error) return [];
            return (data ?? []) as {
                service_title: string;
                short_description: string | null;
                completed_at: string;
            }[];
        },
    });

    const onDownload = async () => {
        setDownloading(true);
        setError(null);
        try {
            let code = milestone.certificate_code;
            if (!code) {
                const { data } = await supabase.rpc("ensure_certificate_code", {
                    p_milestone_id: milestone.id,
                });
                code = (data as string | null) ?? null;
            }
            if (!code) {
                setError("This certificate is still being prepared. Try again in a moment.");
                return;
            }
            await downloadCertificate({
                caregiverName,
                milestone: milestone.milestone,
                awardedAt: milestone.awarded_at,
                certificateCode: code,
                services,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not generate the PDF.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center">
            <div className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-background h-14 flex items-center justify-between px-2">
                    <button
                        onClick={onClose}
                        className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <p className="text-sm font-bold">Certificate preview</p>
                    <span className="w-11" />
                </div>

                <div className="px-2 sm:px-4 pb-6 space-y-5">
                    {/* Preview — mirrors the PDF */}
                    <div className="rounded-2xl bg-card px-5 py-6">
                        <div className="flex flex-col items-center mb-3">
                            <img
                                src="/pwa-512x512.png"
                                alt=""
                                className="h-11 w-11 rounded-full mb-2"
                            />
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                Hommie<span className="text-brand-red">Care</span>
                            </p>
                        </div>
                        <div className="my-3 h-px bg-muted" />
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">
                            Certificate of Service Milestone
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground text-center">
                            Awarded to
                        </p>
                        <p className="mt-1 text-lg font-black text-foreground text-center">
                            {caregiverName}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground text-center">
                            for completing
                        </p>
                        <p className="mt-1 text-3xl font-black text-primary text-center">
                            {milestone.milestone}
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            care services
                        </p>

                        {/* Service list preview */}
                        <div className="my-4 h-px bg-muted" />
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center mb-2">
                            Services delivered
                        </p>
                        {servicesLoading ? (
                            <p className="text-xs text-muted-foreground text-center">
                                Loading…
                            </p>
                        ) : services.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center">
                                No service breakdown available yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {services.map((s, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs"
                                    >
                                        <span className="text-brand-red font-bold">
                                            •
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground truncate">
                                                {s.service_title}
                                            </p>
                                            {s.short_description && (
                                                <p className="text-muted-foreground line-clamp-2">
                                                    {s.short_description}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                            {new Date(
                                                s.completed_at,
                                            ).toLocaleDateString(undefined, {
                                                year: "2-digit",
                                                month: "short",
                                                day: "2-digit",
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="my-4 h-px bg-muted" />
                        <p className="text-xs text-muted-foreground text-center">
                            {new Date(milestone.awarded_at).toLocaleDateString(
                                undefined,
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                },
                            )}
                        </p>
                        <p className="mt-1 text-[10px] font-mono text-muted-foreground text-center">
                            {milestone.certificate_code ?? "—"}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Generated live from your profile and completed bookings.
                    </p>

                    {error && (
                        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="space-y-2">
                        <button
                            onClick={onDownload}
                            disabled={downloading || servicesLoading}
                            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            <Download className="w-4 h-4" />
                            {downloading
                                ? "Generating…"
                                : servicesLoading
                                    ? "Loading services…"
                                    : "Download PDF"}
                        </button>
                        <Link
                            to={`/verify/${milestone.certificate_code}`}
                            className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Public verification link
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- empty + skeleton ---------- */

function EmptyState() {
    return (
        <div className="rounded-2xl bg-card px-4 py-14 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Award className="w-6 h-6 text-primary" />
            </span>
            <p className="text-sm font-bold text-foreground">
                No certificates yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Every 10 completed services earns a certificate. They're yours
                permanently — you can download them anytime.
            </p>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 space-y-4">
            <div className="h-8 w-40 rounded-2xl skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-2xl skeleton-shimmer" />
                <div className="h-24 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="h-20 rounded-2xl skeleton-shimmer" />
            <div className="h-20 rounded-2xl skeleton-shimmer" />
        </div>
    );
}