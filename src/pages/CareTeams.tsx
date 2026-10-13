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

type LastMessage = {
    thread_id: string;
    sender_id: string;
    body: string | null;
    created_at: string;
    has_attachment: boolean;
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

async function fetchLastMessages(
    threadIds: string[]
): Promise<Map<string, LastMessage>> {
    if (threadIds.length === 0) return new Map();

    const { data, error } = await supabase
        .from("care_team_messages")
        .select("thread_id, sender_id, body, created_at, attachment_url")
        .in("thread_id", threadIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(threadIds.length * 4);

    if (error) return new Map();

    const map = new Map<string, LastMessage>();
    for (const row of data ?? []) {
        if (!map.has(row.thread_id)) {
            map.set(row.thread_id, {
                thread_id: row.thread_id,
                sender_id: row.sender_id,
                body: row.body,
                created_at: row.created_at,
                has_attachment: !!row.attachment_url,
            });
        }
    }
    return map;
}

async function fetchUnreadByThread(
    userId: string,
    threadIds: string[]
): Promise<Map<string, number>> {
    if (threadIds.length === 0) return new Map();
    const { data, error } = await supabase
        .from("notifications")
        .select("thread_id")
        .eq("user_id", userId)
        .eq("type", "care_team_message")
        .eq("is_read", false)
        .in("thread_id", threadIds);
    if (error) return new Map();
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
        if (!row.thread_id) continue;
        counts.set(row.thread_id, (counts.get(row.thread_id) ?? 0) + 1);
    }
    return counts;
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

    const threadIds = useMemo(() => threads.map((t) => t.id), [threads]);
    const threadIdsKey = useMemo(
        () => [...threadIds].sort().join(","),
        [threadIds]
    );

    const lastMsgQuery = useQuery({
        queryKey: ["care_team_last_messages", threadIdsKey],
        enabled: threadIds.length > 0,
        staleTime: 30_000,
        queryFn: () => fetchLastMessages(threadIds),
    });

    const lastMessages = lastMsgQuery.data ?? new Map<string, LastMessage>();

    const unreadQuery = useQuery({
        queryKey: ["care_team_unread_by_thread", user?.id, threadIdsKey],
        enabled: !!user && threadIds.length > 0,
        staleTime: 30_000,
        queryFn: () => fetchUnreadByThread(user!.id, threadIds),
    });

    const unreadByThread = unreadQuery.data ?? new Map<string, number>();

    const allProfileIds = useMemo(() => {
        const ids: string[] = [];
        for (const t of threads) {
            ids.push(t.client_id);
            if (t.caregiver_id) ids.push(t.caregiver_id);
            if (t.referral?.referring_user_id) ids.push(t.referral.referring_user_id);
        }
        for (const lm of lastMessages.values()) {
            ids.push(lm.sender_id);
        }
        return ids;
    }, [threads, lastMessages]);

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
                <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>
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
                                            lastMessage={lastMessages.get(t.id) ?? null}
                                            unread={unreadByThread.get(t.id) ?? 0}
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
                                            lastMessage={lastMessages.get(t.id) ?? null}
                                            unread={unreadByThread.get(t.id) ?? 0}
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
    lastMessage,
    unread,
    viewerId,
    onOpen,
}: {
    thread: ThreadLite;
    profiles: Map<string, ProfileLite>;
    lastMessage: LastMessage | null;
    unread: number;
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

    // ---- preview line ----
    let preview: string;
    if (lastMessage) {
        const senderProfile = profiles.get(lastMessage.sender_id);
        const isMine = lastMessage.sender_id === viewerId;
        const who = isMine ? "You" : senderProfile?.display_name ?? "Someone";
        const rawText = (lastMessage.body ?? "").trim();
        const text = rawText
            ? rawText.length > 60
                ? rawText.slice(0, 60) + "…"
                : rawText
            : lastMessage.has_attachment
                ? "Sent an attachment"
                : "";
        preview = `${who}: ${text}`;
    } else {
        preview = "No messages yet";
    }

    const whenLabel = lastMessage
        ? relativeShort(lastMessage.created_at)
        : relativeShort(thread.created_at);

    const hasUnread = unread > 0;

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
                    {closed && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Closed
                        </span>
                    )}
                </div>

                <p
                    className={
                        "text-xs truncate mt-0.5 " +
                        (hasUnread
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground")
                    }
                >
                    {preview}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {whenLabel}
                    </span>
                    {thread.referral?.hospital?.name && (
                        <span className="inline-flex items-center gap-1 truncate">
                            <Users className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                                {thread.referral.hospital.name}
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
                {hasUnread && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
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

function relativeShort(iso: string): string {
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