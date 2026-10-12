// src/pages/CareTeams.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronRight,
    Clock,
    Stethoscope,
    Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";

// ---- types -----------------------------------------------------------------

type ThreadLite = {
    id: string;
    referral_id: string;
    client_id: string;
    caregiver_id: string | null;
    hospital_id: string;
    is_archived: boolean;
    expires_at: string;
    created_at: string;
    referral: {
        id: string;
        referring_user_id: string;
        urgency: string;
        hospital: { id: string; name: string } | null;
    } | null;
};

type ProfileLite = {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
};

// ---- fetch -----------------------------------------------------------------

async function fetchMyThreads(): Promise<ThreadLite[]> {
    const { data, error } = await supabase
        .from("care_team_threads")
        .select(
            `id, referral_id, client_id, caregiver_id, hospital_id,
       is_archived, expires_at, created_at,
       referral:referrals(
         id, referring_user_id, urgency,
         hospital:hospitals(id, name)
       )`
        )
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) throw error;
    return (data ?? []) as unknown as ThreadLite[];
}

async function fetchProfiles(ids: string[]): Promise<Map<string, ProfileLite>> {
    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (uniq.length === 0) return new Map();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", uniq);
    if (error) return new Map();
    const m = new Map<string, ProfileLite>();
    for (const p of (data ?? []) as ProfileLite[]) m.set(p.id, p);
    return m;
}

// ---- page ------------------------------------------------------------------

export default function CareTeams() {
    const { user } = useSession();
    const navigate = useNavigate();

    const threadsQuery = useQuery({
        queryKey: ["care_team_threads", "mine", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: () => fetchMyThreads(),
    });

    const threads = threadsQuery.data ?? [];

    const allProfileIds = useMemo(() => {
        const ids: string[] = [];
        for (const t of threads) {
            ids.push(t.client_id);
            if (t.caregiver_id) ids.push(t.caregiver_id);
            if (t.referral?.referring_user_id) ids.push(t.referral.referring_user_id);
        }
        return ids;
    }, [threads]);

    const profilesQuery = useQuery({
        queryKey: ["care_team_profiles", allProfileIds.sort().join(",")],
        enabled: allProfileIds.length > 0,
        staleTime: 5 * 60_000,
        queryFn: () => fetchProfiles(allProfileIds),
    });

    const profiles = profilesQuery.data ?? new Map<string, ProfileLite>();

    const { active, closed } = useMemo(() => {
        const now = Date.now();
        const a: ThreadLite[] = [];
        const c: ThreadLite[] = [];
        for (const t of threads) {
            const expired = new Date(t.expires_at).getTime() < now;
            if (t.is_archived || expired) c.push(t);
            else a.push(t);
        }
        return { active: a, closed: c };
    }, [threads]);

    const isCaregiver = user?.role === "caregiver";
    const isPatientWithThreads = threads.some((t) => t.client_id === user?.id);

    const subheading = isCaregiver
        ? "Threads with your patients"
        : isPatientWithThreads
            ? "Your private care threads"
            : "Private threads with your patients";

    const emptyBody = isCaregiver
        ? "When a patient you're caring for has an active referral, their care team thread opens here."
        : isPatientWithThreads
            ? "When your hospital refers you for home care and you accept, your care team thread opens here."
            : "When a patient accepts your referral, a private care team thread opens here.";

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-4 pb-4">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Care teams
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {subheading}
                </p>
            </header>

            {threadsQuery.isLoading ? (
                <ListSkeleton />
            ) : threads.length === 0 ? (
                <EmptyState body={emptyBody} />
            ) : (
                <div className="space-y-5">
                    {active.length > 0 && (
                        <section>
                            <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                Active
                            </h2>
                            <ul className="space-y-2">
                                {active.map((t) => (
                                    <li key={t.id}>
                                        <ThreadCard
                                            thread={t}
                                            profiles={profiles}
                                            viewerId={user?.id ?? ""}
                                            onOpen={() => navigate(`/care-team/${t.id}`)}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {closed.length > 0 && (
                        <section>
                            <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                Closed
                            </h2>
                            <ul className="space-y-2">
                                {closed.map((t) => (
                                    <li key={t.id}>
                                        <ThreadCard
                                            thread={t}
                                            profiles={profiles}
                                            viewerId={user?.id ?? ""}
                                            onOpen={() => navigate(`/care-team/${t.id}`)}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

// ---- card ------------------------------------------------------------------

function ThreadCard({
    thread,
    profiles,
    viewerId,
    onOpen,
}: {
    thread: ThreadLite;
    profiles: Map<string, ProfileLite>;
    viewerId: string;
    onOpen: () => void;
}) {
    const expired = new Date(thread.expires_at).getTime() < Date.now();
    const closed = thread.is_archived || expired;

    const doctorId = thread.referral?.referring_user_id ?? "";
    const myRole =
        viewerId === thread.client_id
            ? "client"
            : viewerId === thread.caregiver_id
                ? "caregiver"
                : viewerId === doctorId
                    ? "doctor"
                    : "participant";

    const patientProfile = profiles.get(thread.client_id);
    const doctorProfile = doctorId ? profiles.get(doctorId) : null;
    const caregiverProfile = thread.caregiver_id
        ? profiles.get(thread.caregiver_id)
        : null;

    const avatarProfile =
        myRole === "client"
            ? doctorProfile ?? caregiverProfile ?? null
            : patientProfile ?? null;

    const avatarFallback =
        myRole === "client"
            ? doctorId
                ? "Doctor"
                : "Caregiver"
            : "Patient";

    const titleName =
        myRole === "client"
            ? doctorProfile?.display_name ??
            caregiverProfile?.display_name ??
            "Care team"
            : patientProfile?.display_name ?? "Patient";

    const titlePrefix =
        myRole === "client"
            ? doctorProfile?.display_name || caregiverProfile?.display_name
                ? "with "
                : ""
            : "Patient: ";

    const hospitalName = thread.referral?.hospital?.name ?? null;

    const urgency = thread.referral?.urgency;
    const urgencyLabel =
        urgency === "urgent"
            ? "Urgent"
            : urgency === "soon"
                ? "Within 48h"
                : null;

    const subtitle = hospitalName
        ? hospitalName + (urgencyLabel ? ` · ${urgencyLabel}` : "")
        : urgencyLabel ?? "Care team";

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full text-left rounded-2xl bg-card p-3 sm:p-4 flex items-center gap-3 active:bg-muted transition-colors"
        >
            <InitialsAvatar
                url={avatarProfile?.avatar_url ?? null}
                name={avatarProfile?.display_name ?? avatarFallback}
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-foreground truncate">
                        <span className="text-muted-foreground font-normal">
                            {titlePrefix}
                        </span>
                        {titleName}
                    </p>
                    {closed ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Closed
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Active
                        </span>
                    )}
                </div>

                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {subtitle}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Care team
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {closed ? "Ended" : relativeFuture(thread.expires_at)}
                    </span>
                </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
    );
}

// ---- states ----------------------------------------------------------------

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card p-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 rounded skeleton-shimmer w-1/2" />
                        <div className="h-2.5 rounded skeleton-shimmer w-1/3" />
                        <div className="h-2.5 rounded skeleton-shimmer w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ body }: { body: string }) {
    return (
        <div className="py-16 text-center animate-fade-in">
            <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No care teams yet</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
                {body}
            </p>
        </div>
    );
}

// ---- helpers ---------------------------------------------------------------

function relativeFuture(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "ended";
    const h = Math.floor(diff / 3_600_000);
    if (h < 24) return `${h}h left`;
    const d = Math.floor(h / 24);
    return `${d}d left`;
}