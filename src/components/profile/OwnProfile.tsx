// src/components/profile/OwnProfile.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Pencil,
    MapPin,
    BadgeCheck,
    Star,
    Shield,
    Award,
    Settings2,
    ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { CaregiverProfile, ClientProfile } from "@/types/db";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { MedicalProfileCard } from "@/components/profile/MedicalProfileCard";
import { CaregiverCredentialsCard } from "@/components/profile/CaregiverCredentialsCard";
import { DailyDiaryCard } from "../daily/DailyDiaryCard";

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

    if (!user) return null;

    const location = [user.city, user.county].filter(Boolean).join(", ");

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

                            {caregiver.bio && (
                                <p className="text-sm text-foreground leading-relaxed mb-5">
                                    {caregiver.bio}
                                </p>
                            )}

                            {/* Preview of what clients see — public media only */}
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

/**
 * Read-only gallery. Same query as PublicProfile — the client's view of what
 * others will see. Only shows 'gallery' and 'hospital' kinds; ID documents
 * stay private and are visible only when editing.
 */
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