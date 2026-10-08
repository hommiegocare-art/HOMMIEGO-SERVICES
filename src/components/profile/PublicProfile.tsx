// src/components/profile/PublicProfile.tsx
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

type Media = { id: string; url: string; kind: string };

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

        // Public media only. RLS also enforces this, but we filter
        // client-side to avoid pulling rows we can't render.
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
        const clientCol = p.role === "caregiver" ? targetId : viewerId;
        const caregiverCol = p.role === "caregiver" ? viewerId : targetId;

        const { data: conn } = await supabase
            .from("connections")
            .select("*")
            .eq("client_id", clientCol)
            .eq("caregiver_id", caregiverCol)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        existingConnection = (conn as Connection) ?? null;
    }

    return { profile: p, caregiver, client, services, existingConnection, media };
}

export function PublicProfile({ userId }: { userId: string }) {
    const { user } = useSession();
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["profile", "public", userId, user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchTarget(userId, user!.id),
    });

    const requestConnection = useMutation({
        mutationFn: async () => {
            if (!user || !data) return;
            const target = data.profile;

            const clientId = target.role === "caregiver" ? user.id : target.id;
            const caregiverId = target.role === "caregiver" ? target.id : user.id;

            const { error } = await supabase.from("connections").insert({
                client_id: clientId,
                caregiver_id: caregiverId,
                status: "pending",
                initiated_by: user.id,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["profile", "public", userId] });
            qc.invalidateQueries({ queryKey: ["connections"] });
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

    // Client viewing client — no connection allowed
    const canConnect =
        user &&
        user.id !== profile.id &&
        ((user.role === "client" && profile.role === "caregiver") ||
            (user.role === "caregiver" && profile.role === "client"));

    const connStatus = existingConnection?.status;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <header className="flex items-start gap-4 mb-5">
                <span className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
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
                        {caregiver?.verification_status === "verified" && (
                            <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                        )}
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
                        <div className="w-full h-12 rounded-2xl bg-muted text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            {existingConnection?.initiated_by === user.id
                                ? "Request sent"
                                : "Request pending your review"}
                        </div>
                    )}
                    {connStatus === "accepted" && (
                        <div className="w-full h-12 rounded-2xl bg-success/10 text-success font-semibold text-sm inline-flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            You're connected
                        </div>
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

            {caregiver?.bio && (
                <p className="text-sm text-foreground leading-relaxed mb-5">{caregiver.bio}</p>
            )}

            {caregiver?.specialties && caregiver.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {caregiver.specialties.map((s) => (
                        <span
                            key={s}
                            className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground"
                        >
                            {s}
                        </span>
                    ))}
                </div>
            )}

            {/* PUBLIC PHOTOS — gallery + hospital, never ID docs */}
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
            )}

            {services.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        Services
                    </h2>
                    <div className="space-y-2">
                        {services.map((s) => (
                            <div key={s.id} className="rounded-2xl bg-card px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-12 h-12 rounded-2xl bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                        {s.cover_image ? (
                                            <img src={s.cover_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {s.title}
                                        </p>
                                        {s.short_description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {s.short_description}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-foreground shrink-0">
                                        {s.price != null
                                            ? `KES ${Math.round(s.price).toLocaleString()}`
                                            : "Ask"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {connStatus === "accepted" && (
                        <Link
                            to={`/booking/new?caregiver=${profile.id}`}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-semibold h-11"
                        >
                            Book a service <ArrowRight className="w-3 h-3" />
                        </Link>
                    )}
                </section>
            )}

            {client && (
                <div className="rounded-2xl bg-muted px-4 py-3 mb-5">
                    <p className="text-xs text-muted-foreground">
                        This is a client profile. Their medical details are private and only
                        shared with connected caregivers.
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