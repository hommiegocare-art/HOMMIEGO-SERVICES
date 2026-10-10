// src/components/profile/OwnProfile.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Pencil,
    MapPin,
    Star,
    Shield,
    Award,
    Settings2,
    ArrowRight,
    ShieldCheck,
    Clock,
    Loader2,
    Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { CaregiverProfile, ClientProfile } from "@/types/db";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { MedicalProfileCard } from "@/components/profile/MedicalProfileCard";
import { CaregiverCredentialsCard } from "@/components/profile/CaregiverCredentialsCard";
import { DailyDiaryCard } from "../daily/DailyDiaryCard";
import { VerifiedBadge } from "../brand/VerifiedBadge";

async function fetchCaregiver(userId: string): Promise<CaregiverProfile | null> {
    const { data } = await supabase
        .from("caregiver_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    return (data as CaregiverProfile) ?? null;
}

async function fetchClient(userId: string): Promise<ClientProfile | null> {
    const { data } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    return (data as ClientProfile) ?? null;
}

export function OwnProfile() {
    const { user } = useSession();
    const qc = useQueryClient();
    const [editing, setEditing] = useState(false);

    const isCaregiver = user?.role === "caregiver";

    const { data: caregiver } = useQuery({
        queryKey: ["profile", "caregiver", user?.id],
        enabled: !!user && isCaregiver,
        staleTime: 60_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchCaregiver(user!.id),
    });

    const { data: client } = useQuery({
        queryKey: ["profile", "client", user?.id],
        enabled: !!user && !isCaregiver,
        staleTime: 60_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchClient(user!.id),
    });

    const requestVerification = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("Not signed in");
            const { error } = await supabase
                .from("caregiver_profiles")
                .update({ verification_status: "pending" })
                .eq("user_id", user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["profile", "caregiver", user?.id] });
            qc.invalidateQueries({ queryKey: ["profile"] });
        },
        onError: (e) => {
            alert(`Could not request verification: ${(e as Error).message}`);
        },
    });

    if (!user) return null;

    const location = [user.city, user.county].filter(Boolean).join(", ");
    const status = caregiver?.verification_status;
    const isVerified = status === "verified";

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <header className="flex items-start gap-4 mb-5">
                <span className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-primary">
                            {user.display_name?.[0]?.toUpperCase() ?? "U"}
                        </span>
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-black tracking-tight text-foreground truncate">
                            {user.display_name || "You"}
                        </h1>
                        <VerifiedBadge show={caregiver?.verification_status === "verified"} />
                    </div>
                    {caregiver?.professional_title && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {caregiver.professional_title}
                        </p>
                    )}
                    {location && (
                        <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {location}
                        </p>
                    )}
                </div>
            </header>

            {isCaregiver && caregiver && !isVerified && (
                <VerificationCard
                    status={status}
                    notes={caregiver.verification_notes}
                    isPending={requestVerification.isPending}
                    onRequest={() => requestVerification.mutate()}
                />
            )}

            <div className="flex gap-2 mb-5">
                <button
                    onClick={() => setEditing((v) => !v)}
                    className="flex-1 h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                >
                    <Pencil className="w-4 h-4" />
                    {editing ? "Done editing" : "Edit profile"}
                </button>
                {!isCaregiver && (
                    <Link
                        to="/settings/privacy"
                        className="h-11 px-4 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                    >
                        <Shield className="w-4 h-4" />
                        Privacy
                    </Link>
                )}
            </div>

            {editing ? (
                <EditProfileForm
                    caregiver={caregiver ?? null}
                    client={client ?? null}
                    onDone={() => setEditing(false)}
                />
            ) : (
                <>
                    {isCaregiver && caregiver && (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <Stat
                                    label="Rating"
                                    value={
                                        caregiver.average_rating > 0
                                            ? Number(caregiver.average_rating).toFixed(1)
                                            : "—"
                                    }
                                    icon={<Star className="w-3 h-3 fill-current text-primary" />}
                                />
                                <Stat label="Reviews" value={String(caregiver.total_reviews)} />
                                <Stat
                                    label="Completed"
                                    value={String(caregiver.completed_bookings)}
                                />
                            </div>

                            {/* Public-facing stats */}
                            <ProfileViewsCard userId={user.id} />
                            <EndorsementsCard userId={user.id} />

                            {caregiver.bio && (
                                <p className="text-sm text-foreground leading-relaxed mb-5">
                                    {caregiver.bio}
                                </p>
                            )}

                            <OwnGallery userId={user.id} />

                            <CaregiverCredentialsCard />

                            <Link
                                to="/cpd"
                                className="flex items-center justify-between rounded-2xl bg-card px-4 py-4 mb-3 active:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-primary" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            CPD & Certificates
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {caregiver.completed_bookings} completed services
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </Link>

                            <Link
                                to="/services"
                                className="flex items-center justify-between rounded-2xl bg-card px-4 py-4 mb-3 active:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Settings2 className="w-5 h-5 text-primary" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            Manage services
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Add, edit, or pause your offerings
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        </>
                    )}
                    {!isCaregiver && <MedicalProfileCard />}
                    {!isCaregiver && <DailyDiaryCard />}
                </>
            )}
        </div>
    );
}

/* ---------- verification card (unchanged) ---------- */

function VerificationCard({
    status,
    notes,
    isPending,
    onRequest,
}: {
    status: string | undefined;
    notes: string | null | undefined;
    isPending: boolean;
    onRequest: () => void;
}) {
    if (status === "pending") {
        return (
            <div className="rounded-2xl bg-muted px-4 py-4 mb-5 flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-foreground">
                        Verification pending
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        A reviewer is looking at your profile. You'll be notified once a
                        decision is made.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-primary/10 px-4 py-4 mb-5">
            <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                        {status === "rejected"
                            ? "Verification was rejected"
                            : "You're not verified yet"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {status === "rejected"
                            ? "Fix the issue below, then request verification again."
                            : "Get verified to earn client trust and appear with the verified badge."}
                    </p>
                    {status === "rejected" && notes && (
                        <p className="text-xs text-destructive mt-2">
                            Reason: {notes}
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={onRequest}
                disabled={isPending}
                className="mt-3 w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <ShieldCheck className="w-4 h-4" />
                        {status === "rejected"
                            ? "Request verification again"
                            : "Request verification"}
                    </>
                )}
            </button>
        </div>
    );
}

/* ---------- profile views card (NEW) ---------- */

function ProfileViewsCard({ userId }: { userId: string }) {
    const { data } = useQuery({
        queryKey: ["profile-views", userId],
        staleTime: 60_000,
        queryFn: async () => {
            const { data } = await supabase
                .from("profile_view_counts")
                .select("total_views, views_7d, views_24h")
                .eq("target_id", userId)
                .maybeSingle();
            return (
                data ?? { total_views: 0, views_7d: 0, views_24h: 0 }
            ) as { total_views: number; views_7d: number; views_24h: number };
        },
    });

    if (!data) return null;
    // Hide until there's at least something to show
    if (data.total_views === 0) return null;

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Profile views</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                    <p className="text-lg font-black text-foreground">
                        {data.views_24h}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Today
                    </p>
                </div>
                <div>
                    <p className="text-lg font-black text-foreground">
                        {data.views_7d}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        This week
                    </p>
                </div>
                <div>
                    <p className="text-lg font-black text-foreground">
                        {data.total_views}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        All time
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ---------- endorsements card (NEW) ---------- */

type EndorsementChip = { skill: string; total: number };

function EndorsementsCard({ userId }: { userId: string }) {
    const { data } = useQuery({
        queryKey: ["endorsements", "summary", userId],
        staleTime: 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("endorsement_summary")
                .select("skill, total")
                .eq("endorsed_id", userId)
                .order("total", { ascending: false })
                .limit(8);
            if (error) return [] as EndorsementChip[];
            return (data ?? []) as EndorsementChip[];
        },
    });

    if (!data || data.length === 0) return null;

    const totalEndorsements = data.reduce((sum, e) => sum + e.total, 0);

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">
                    Endorsed for
                </p>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                    {totalEndorsements} total
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {data.map((e) => (
                    <span
                        key={e.skill}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                        {e.skill}
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold">
                            {e.total}
                        </span>
                    </span>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
                Endorsements come from people you're connected to. They help new clients
                see what you're known for.
            </p>
        </div>
    );
}

/* ---------- gallery (unchanged) ---------- */

function OwnGallery({ userId }: { userId: string }) {
    const { data } = useQuery({
        queryKey: ["own-gallery", userId],
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profile_media")
                .select("id, url, kind")
                .eq("user_id", userId)
                .in("kind", ["gallery", "hospital"])
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(8);
            if (error) throw error;
            return data as { id: string; url: string; kind: string }[];
        },
    });

    if (!data || data.length === 0) return null;

    return (
        <section className="mb-5">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Photos
                </h2>
                <Link
                    to="/services"
                    className="text-xs text-primary font-semibold"
                >
                    Manage photos
                </Link>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data.map((m) => (
                    <li key={m.id}>
                        <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block aspect-square overflow-hidden rounded-xl bg-muted"
                        >
                            <img
                                src={m.url}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-card px-3 py-3 text-center">
            <p className="text-lg font-black text-foreground inline-flex items-center gap-1">
                {icon}
                {value}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
                {label}
            </p>
        </div>
    );
}