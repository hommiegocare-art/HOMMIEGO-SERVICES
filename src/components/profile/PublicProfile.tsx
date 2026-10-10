// src/components/profile/PublicProfile.tsx
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
    MapPin,
    BadgeCheck,
    Star,
    Clock,
    Briefcase,
    UserPlus,
    Check,
    Loader2,
    ArrowRight,
    Stethoscope,
    FileSignature,
    History,
    HeartPulse,
    ShieldAlert,
    Award,
    X,
    Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type {
    Profile,
    CaregiverProfile,
    ClientProfile,
    Service,
    Connection,
} from "@/types/db";
import { VerifiedBadge } from "../brand/VerifiedBadge";

type Media = { id: string; url: string; kind: string };

type EndorsementChip = {
    skill: string;
    total: number;
};

type Target = {
    profile: Profile;
    caregiver: CaregiverProfile | null;
    client: ClientProfile | null;
    services: Service[];
    existingConnection: Connection | null;
    media: Media[];
};

async function fetchTarget(targetId: string, viewerId: string): Promise<Target | null> {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();
    if (error) throw error;
    if (!profile) return null;

    const p = profile as Profile;
    let caregiver: CaregiverProfile | null = null;
    let client: ClientProfile | null = null;
    let services: Service[] = [];
    let media: Media[] = [];

    if (p.role === "caregiver") {
        const { data: cg } = await supabase
            .from("caregiver_profiles")
            .select("*")
            .eq("user_id", targetId)
            .maybeSingle();
        caregiver = (cg as CaregiverProfile) ?? null;

        const { data: svc } = await supabase
            .from("services")
            .select("*")
            .eq("caregiver_id", targetId)
            .eq("is_active", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20);
        services = (svc ?? []) as Service[];

        const { data: mediaRows } = await supabase
            .from("profile_media")
            .select("id, url, kind")
            .eq("user_id", targetId)
            .in("kind", ["gallery", "hospital"])
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(8);
        media = (mediaRows ?? []) as Media[];
    } else {
        const { data: cl } = await supabase
            .from("client_profiles")
            .select("*")
            .eq("user_id", targetId)
            .maybeSingle();
        client = (cl as ClientProfile) ?? null;
    }

    let existingConnection: Connection | null = null;
    if (p.role === "caregiver" || p.role === "client") {
        const clientId = p.role === "caregiver" ? viewerId : targetId;
        const caregiverId = p.role === "caregiver" ? targetId : viewerId;

        const { data: conn } = await supabase
            .from("connections")
            .select("*")
            .eq("client_id", clientId)
            .eq("caregiver_id", caregiverId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        existingConnection = (conn as Connection) ?? null;
    }

    return { profile: p, caregiver, client, services, existingConnection, media };
}

/* ---------- endorsements fetch ---------- */

async function fetchEndorsementChips(endorsedId: string): Promise<EndorsementChip[]> {
    const { data, error } = await supabase
        .from("endorsement_summary")
        .select("skill, total")
        .eq("endorsed_id", endorsedId)
        .order("total", { ascending: false })
        .limit(6);
    if (error) return [];
    return (data ?? []) as EndorsementChip[];
}

async function fetchMyEndorsementSkills(
    endorserId: string,
    endorsedId: string
): Promise<string[]> {
    const { data, error } = await supabase
        .from("endorsements")
        .select("skill")
        .eq("endorser_id", endorserId)
        .eq("endorsed_id", endorsedId)
        .is("deleted_at", null)
        .limit(50);
    if (error) return [];
    return (data ?? []).map((r) => r.skill as string);
}
async function fetchViewCount(
    targetId: string
): Promise<{ total_views: number; views_7d: number; views_24h: number }> {
    const { data, error } = await supabase
        .from("profile_view_counts")
        .select("total_views, views_7d, views_24h")
        .eq("target_id", targetId)
        .maybeSingle();
    if (error || !data) {
        return { total_views: 0, views_7d: 0, views_24h: 0 };
    }
    return {
        total_views: Number(data.total_views ?? 0),
        views_7d: Number(data.views_7d ?? 0),
        views_24h: Number(data.views_24h ?? 0),
    };
}
/* ---------- public component ---------- */

export function PublicProfile({ userId }: { userId: string }) {
    const { user } = useSession();
    const qc = useQueryClient();
    const [endorseOpen, setEndorseOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["profile", "public", userId, user?.id],
        enabled: !!user,
        staleTime: 60_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchTarget(userId, user!.id),
    });

    // Fire-and-forget profile view tracking
    useEffect(() => {
        if (!user || user.id === userId) return;
        const t = setTimeout(() => {
            supabase
                .rpc("record_profile_view", {
                    p_target_id: userId,
                    p_source: "direct",
                })
                .then(
                    () => undefined,
                    () => undefined
                );
        }, 1500);
        return () => clearTimeout(t);
    }, [user, userId]);

    const { data: endorsements = [] } = useQuery({
        queryKey: ["endorsements", "summary", userId],
        enabled: !!userId,
        staleTime: 60_000,
        queryFn: () => fetchEndorsementChips(userId),
    });

    const { data: myEndorsedSkills = [] } = useQuery({
        queryKey: ["endorsements", "mine", userId, user?.id],
        enabled: !!user && !!userId && user.id !== userId,
        staleTime: 30_000,
        queryFn: () => fetchMyEndorsementSkills(user!.id, userId),
    });
    const { data: viewCount } = useQuery({
        queryKey: ["profile-view-count", userId],
        enabled: !!userId,
        staleTime: 60_000,
        queryFn: () => fetchViewCount(userId),
    });

    const requestConnection = useMutation({
        mutationFn: async () => {
            if (!user || !data) return;
            const target = data.profile;
            const clientId = target.role === "caregiver" ? user.id : target.id;
            const caregiverId = target.role === "caregiver" ? target.id : user.id;

            // If an "ended" row already exists, resurrect it instead of inserting.
            if (existingConnection && existingConnection.status === "ended") {
                const { error } = await supabase
                    .from("connections")
                    .update({
                        status: "pending",
                        initiated_by: user.id,
                        ended_at: null,
                        ended_reason: null,
                        declined_at: null,
                    })
                    .eq("id", existingConnection.id);
                if (error) throw error;
                return;
            }

            const { error } = await supabase.from("connections").insert({
                client_id: clientId,
                caregiver_id: caregiverId,
                status: "pending",
                initiated_by: user.id,
            });
            if (error) throw error;
        },
        onError: (e) => alert(`Could not send request: ${(e as Error).message}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["profile", "public"] });
            qc.invalidateQueries({ queryKey: ["connections"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">This profile doesn't exist.</p>
            </div>
        );
    }

    const { profile, caregiver, client, services, existingConnection, media } = data;
    const location = [profile.city, profile.county].filter(Boolean).join(", ");

    const canConnect =
        user &&
        user.id !== profile.id &&
        ((user.role === "client" && profile.role === "caregiver") ||
            (user.role === "caregiver" && profile.role === "client"));

    const connStatus = existingConnection?.status;
    const isConnected = connStatus === "accepted";

    const showMedicalEntry =
        !!user &&
        user.role === "caregiver" &&
        profile.role === "client" &&
        isConnected;

    const isViewingSelf = user?.id === profile.id;
    const isUnverifiedCaregiver =
        profile.role === "caregiver" &&
        caregiver?.verification_status !== "verified";

    const endorsableSkills =
        profile.role === "caregiver" && caregiver?.specialties?.length
            ? caregiver.specialties.slice(0, 20)
            : [
                "Clear communication",
                "Prepared home",
                "Cooperative",
                "Consistent",
                "Kind",
            ];

    const canEndorse = !!user && !isViewingSelf && isConnected && !!existingConnection;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <header className="flex items-start gap-4 mb-5">
                <span className="w-20 h-20 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-primary">
                            {profile.display_name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-black tracking-tight text-foreground truncate">
                            {profile.display_name || "Anonymous"}
                        </h1>
                        <VerifiedBadge show={caregiver?.verification_status === "verified"} />
                    </div>
                    {caregiver?.professional_title && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {caregiver.professional_title}
                        </p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {location && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {location}
                            </span>
                        )}
                        {viewCount && viewCount.total_views > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {viewCount.total_views.toLocaleString()}{" "}
                                {viewCount.total_views === 1 ? "view" : "views"}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {isUnverifiedCaregiver && !isViewingSelf && (
                <div className="rounded-2xl bg-card px-4 py-3 mb-5 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {caregiver?.verification_status === "pending"
                                ? "Verification pending"
                                : "Not yet verified"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {caregiver?.verification_status === "pending"
                                ? "This caregiver has submitted their profile for review."
                                : "This caregiver hasn't completed HommieCare verification yet."}
                        </p>
                    </div>
                </div>
            )}

            {canConnect && (
                <div className="mb-5">
                    {!connStatus && (
                        <button
                            onClick={() => requestConnection.mutate()}
                            disabled={requestConnection.isPending}
                            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            {requestConnection.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            Request to connect
                        </button>
                    )}
                    {connStatus === "pending" && (
                        <div className="w-full h-12 rounded-2xl bg-card text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            {existingConnection?.initiated_by === user.id
                                ? "Request sent"
                                : "Request pending your review"}
                        </div>
                    )}
                    {isConnected && (
                        <div className="w-full h-12 rounded-2xl bg-success/10 text-success font-semibold text-sm inline-flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            You're connected
                        </div>
                    )}
                    {connStatus === "ended" && (
                        <button
                            onClick={() => requestConnection.mutate()}
                            disabled={requestConnection.isPending}
                            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            {requestConnection.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            Reconnect
                        </button>
                    )}
                </div>
            )}

            {caregiver && (
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
                        label="Experience"
                        value={caregiver.years_experience ? `${caregiver.years_experience}y` : "—"}
                    />
                </div>
            )}

            {/* ENDORSEMENTS STRIP */}
            {endorsements.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        Endorsed for
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                        {endorsements.map((e) => (
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
                </section>
            )}

            {caregiver?.bio && (
                <p className="text-sm text-foreground leading-relaxed mb-5">{caregiver.bio}</p>
            )}

            {caregiver?.specialties && caregiver.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {caregiver.specialties.map((s) => (
                        <span
                            key={s}
                            className="px-3 py-1 rounded-full bg-card text-xs font-medium text-foreground"
                        >
                            {s}
                        </span>
                    ))}
                </div>
            )}

            {media.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        Photos
                    </h2>
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {media.map((m) => (
                            <li key={m.id}>
                                <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block aspect-square overflow-hidden rounded-xl bg-card"
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
            )}

            {services.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        Services
                    </h2>
                    <div className="space-y-2">
                        {services.map((s) => {
                            const isFree = (s as Service & { is_free_consultation?: boolean })
                                .is_free_consultation;
                            const canChat = isFree && isConnected && !!existingConnection?.id;

                            const inner = (
                                <div className="flex items-center gap-3">
                                    <span className="w-12 h-12 rounded-2xl bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                        {s.cover_image ? (
                                            <img src={s.cover_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-foreground truncate">
                                                {s.title}
                                            </p>
                                            {isFree && (
                                                <span className="px-2 py-0.5 rounded-full bg-success/10 text-[10px] font-bold text-success shrink-0">
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                        {s.short_description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {s.short_description}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-foreground shrink-0">
                                        {isFree
                                            ? "Chat"
                                            : s.price != null
                                                ? `KES ${Math.round(s.price).toLocaleString()}`
                                                : "Ask"}
                                    </p>
                                </div>
                            );

                            return canChat ? (
                                <Link
                                    key={s.id}
                                    to={`/chats/${existingConnection!.id}`}
                                    className="block rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
                                >
                                    {inner}
                                </Link>
                            ) : (
                                <div key={s.id} className="rounded-2xl bg-card px-4 py-3">
                                    {inner}
                                </div>
                            );
                        })}
                    </div>
                    {isConnected && (
                        <Link
                            to={`/bookings/new?caregiver=${profile.id}`}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-semibold h-11"
                        >
                            Book a service <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </section>
            )}

            {/* ENDORSE ACTION */}
            {canEndorse && (
                <section className="mb-5">
                    <button
                        onClick={() => setEndorseOpen(true)}
                        className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                    >
                        <Award className="w-4 h-4" />
                        Endorse {profile.display_name?.split(" ")[0] ?? "this person"}
                        {myEndorsedSkills.length > 0 && (
                            <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                                {myEndorsedSkills.length}
                            </span>
                        )}
                    </button>
                </section>
            )}

            {showMedicalEntry && <MedicalEntryCard clientId={profile.id} />}

            {client && (
                <div className="rounded-2xl bg-card px-4 py-3 mb-5">
                    <p className="text-xs text-muted-foreground">
                        {isConnected
                            ? "You're connected. Use the links above to view the patient's history or record an examination."
                            : "This is a client profile. Their medical details are private and only shared with connected caregivers."}
                    </p>
                </div>
            )}

            {caregiver?.peer_consultation_opt_in && (
                <div className="rounded-2xl bg-primary/10 px-4 py-3">
                    <p className="text-xs text-foreground">
                        Open to peer consultation with other caregivers.
                    </p>
                </div>
            )}

            {/* ENDORSE MODAL */}
            {endorseOpen && existingConnection && (
                <EndorseModal
                    endorserId={user.id}
                    endorsedId={profile.id}
                    connectionId={existingConnection.id}
                    endorsedName={profile.display_name ?? "this person"}
                    skills={endorsableSkills}
                    existing={myEndorsedSkills}
                    onClose={() => setEndorseOpen(false)}
                />
            )}
        </div>
    );
}

/* ---------- endorsement modal ---------- */

function EndorseModal({
    endorserId,
    endorsedId,
    connectionId,
    endorsedName,
    skills,
    existing,
    onClose,
}: {
    endorserId: string;
    endorsedId: string;
    connectionId: string;
    endorsedName: string;
    skills: string[];
    existing: string[];
    onClose: () => void;
}) {
    const qc = useQueryClient();
    const [selected, setSelected] = useState<string[]>(existing);
    const [error, setError] = useState<string | null>(null);

    const toggle = (skill: string) => {
        setSelected((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const save = useMutation({
        mutationFn: async () => {
            const toAdd = selected.filter((s) => !existing.includes(s));
            const toRemove = existing.filter((s) => !selected.includes(s));

            if (toAdd.length > 0) {
                const { error: insErr } = await supabase.from("endorsements").insert(
                    toAdd.map((skill) => ({
                        endorser_id: endorserId,
                        endorsed_id: endorsedId,
                        connection_id: connectionId,
                        skill,
                    }))
                );
                if (insErr) throw insErr;
            }

            if (toRemove.length > 0) {
                const { error: delErr } = await supabase
                    .from("endorsements")
                    .delete()
                    .eq("endorser_id", endorserId)
                    .eq("endorsed_id", endorsedId)
                    .in("skill", toRemove);
                if (delErr) throw delErr;
            }
        },
        onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["endorsements"] });
            onClose();
        },
    });

    return (
        <div className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl max-h-[85dvh] overflow-y-auto border border-border pb-[calc(env(safe-area-inset-bottom)+64px)] sm:pb-0">
                <div className="sticky top-0 bg-card h-14 flex items-center justify-between px-4">
                    <button
                        onClick={onClose}
                        className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <p className="text-sm font-bold">Endorse {endorsedName.split(" ")[0]}</p>
                    <span className="w-11" />
                </div>

                <div className="px-4 pb-6 space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Tap the skills you trust them with. Tap again to remove. Only
                        connected people can endorse.
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill) => {
                            const active = selected.includes(skill);
                            return (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggle(skill)}
                                    className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${active
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                        }`}
                                >
                                    {skill}
                                </button>
                            );
                        })}
                    </div>

                    {error && (
                        <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={onClose}
                            disabled={save.isPending}
                            className="flex-1 h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => save.mutate()}
                            disabled={save.isPending}
                            className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:opacity-90 disabled:opacity-60"
                        >
                            {save.isPending ? "Saving…" : "Save endorsements"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- medical entry card ---------- */

function MedicalEntryCard({ clientId }: { clientId: string }) {
    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
                <HeartPulse className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Medical profile</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
                View the patient's history, record a new examination, or review the audit
                trail.
            </p>
            <div className="grid grid-cols-1 gap-2">
                <Link
                    to={`/medical/${clientId}/exam/new`}
                    className="flex items-center gap-3 rounded-2xl bg-primary/10 px-3 py-3 active:bg-primary/20 transition-colors"
                >
                    <span className="h-9 w-9 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            Start new examination
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Record vitals, exam findings, and plan
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>

                <Link
                    to={`/medical/${clientId}/record`}
                    className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-3 active:bg-secondary transition-colors"
                >
                    <span className="h-9 w-9 rounded-xl bg-muted text-foreground inline-flex items-center justify-center shrink-0">
                        <FileSignature className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            Open medical record
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Read or update the patient's full history
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>

                <Link
                    to={`/medical/${clientId}/audit`}
                    className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-3 active:bg-secondary transition-colors"
                >
                    <span className="h-9 w-9 rounded-xl bg-muted text-foreground inline-flex items-center justify-center shrink-0">
                        <History className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            Audit trail
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Every change with actor and timestamp
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
            </div>
        </div>
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