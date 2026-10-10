// src/pages/Connections.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Check,
    X,
    Clock,
    Users,
    AlertCircle,
    ArrowRight,
    MessageCircle,
    Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Connection, Profile } from "@/types/db";

const SOFT_CAP = 3;

type ConnectionRow = Connection & {
    other: Pick<Profile, "id" | "display_name" | "avatar_url" | "role"> | null;
};

/* ---------- fetch connections + enrichment ---------- */

async function fetchConnections(
    userId: string,
    role: "client" | "caregiver"
): Promise<ConnectionRow[]> {
    const filterCol = role === "client" ? "client_id" : "caregiver_id";

    const { data: rows, error } = await supabase
        .from("connections")
        .select("*")
        .eq(filterCol, userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) throw error;
    if (!rows || rows.length === 0) return [];

    const otherIds = Array.from(
        new Set(
            rows.map((r) => (role === "client" ? r.caregiver_id : r.client_id))
        )
    );

    const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role")
        .in("id", otherIds)
        .limit(otherIds.length);

    if (pErr) throw pErr;

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((r) => {
        const otherId = role === "client" ? r.caregiver_id : r.client_id;
        return { ...r, other: byId.get(otherId) ?? null };
    }) as ConnectionRow[];
}

/* ---------- endorsement counts for a batch of user ids ---------- */

async function fetchEndorsementCounts(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, number>();
    const { data, error } = await supabase
        .from("endorsement_totals")
        .select("endorsed_id, total_endorsements")
        .in("endorsed_id", userIds);
    if (error) return new Map<string, number>();
    return new Map(
        (data ?? []).map((r) => [r.endorsed_id, r.total_endorsements ?? 0])
    );
}

/* ---------- unread chat counts for my accepted connections ---------- */

async function fetchUnreadCounts(
    viewerId: string
): Promise<Map<string, number>> {
    const { data, error } = await supabase
        .from("chat_unread_counts")
        .select("connection_id, unread_for_client, unread_for_caregiver");
    if (error) return new Map();
    const map = new Map<string, number>();
    for (const row of data ?? []) {
        const isClient = (row as any).client_id === viewerId;
        const count = isClient
            ? (row as any).unread_for_client
            : (row as any).unread_for_caregiver;
        if (count > 0) map.set((row as any).connection_id, count);
    }
    return map;
}

/* ---------- endorsements I've given to a batch of users ---------- */

async function fetchMyEndorsementCounts(
    endorserId: string,
    endorsedIds: string[]
): Promise<Map<string, number>> {
    if (endorsedIds.length === 0) return new Map();
    const { data, error } = await supabase
        .from("endorsements")
        .select("endorsed_id")
        .eq("endorser_id", endorserId)
        .in("endorsed_id", endorsedIds)
        .is("deleted_at", null)
        .limit(500);
    if (error) return new Map();
    const counts = new Map<string, number>();
    for (const r of data ?? []) {
        const id = r.endorsed_id as string;
        counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
}

/* ---------- page ---------- */

export default function Connections() {
    const { user } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [endorseTarget, setEndorseTarget] = useState<{
        connectionId: string;
        endorsedId: string;
        endorsedName: string;
        skills: string[];
        existing: string[];
    } | null>(null);

    const role = (user?.role === "caregiver" ? "caregiver" : "client") as
        | "client"
        | "caregiver";

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["connections", user?.id, role],
        enabled: !!user,
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchConnections(user!.id, role),
    });

    const otherIds = useMemo(
        () => rows.map((r) => r.other?.id).filter((x): x is string => !!x),
        [rows]
    );

    const { data: endorsementCounts = new Map<string, number>() } = useQuery({
        queryKey: ["endorsement-totals", otherIds.sort().join(",")],
        enabled: otherIds.length > 0,
        staleTime: 60_000,
        queryFn: () => fetchEndorsementCounts(otherIds),
    });

    const { data: unreadCounts = new Map<string, number>() } = useQuery({
        queryKey: ["chat-unread", user?.id],
        enabled: !!user,
        staleTime: 15_000,
        refetchInterval: 30_000,
        queryFn: () => fetchUnreadCounts(user!.id),
    });

    const acceptedIds = useMemo(
        () =>
            rows
                .filter((r) => r.status === "accepted" && r.other?.id)
                .map((r) => r.other!.id),
        [rows]
    );

    const { data: myEndorsementsMap = new Map<string, number>() } = useQuery({
        queryKey: ["my-endorsements", user?.id, acceptedIds.sort().join(",")],
        enabled: !!user && acceptedIds.length > 0,
        staleTime: 60_000,
        queryFn: () => fetchMyEndorsementCounts(user!.id, acceptedIds),
    });

    const { incoming, outgoing, accepted } = useMemo(() => {
        const inc: ConnectionRow[] = [];
        const out: ConnectionRow[] = [];
        const acc: ConnectionRow[] = [];
        for (const r of rows) {
            if (r.status === "accepted") acc.push(r);
            else if (r.status === "pending") {
                if (r.initiated_by === user?.id) out.push(r);
                else inc.push(r);
            }
        }
        return { incoming: inc, outgoing: out, accepted: acc };
    }, [rows, user?.id]);

    const update = useMutation({
        mutationFn: async ({
            id,
            status,
        }: {
            id: string;
            status: "accepted" | "declined" | "ended";
        }) => {
            const patch: Record<string, unknown> = { status };
            if (status === "accepted") patch.accepted_at = new Date().toISOString();
            if (status === "declined") patch.declined_at = new Date().toISOString();
            if (status === "ended") patch.ended_at = new Date().toISOString();

            const { error } = await supabase
                .from("connections")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["connections"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });

    /* ---------- open endorse modal ---------- */

    const onEndorse = async (row: ConnectionRow) => {
        if (!user || !row.other) return;
        const endorsedId = row.other.id;

        const [caregiverRes, myEndorsementsRes] = await Promise.all([
            row.other.role === "caregiver"
                ? supabase
                    .from("caregiver_profiles")
                    .select("specialties")
                    .eq("user_id", endorsedId)
                    .maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            supabase
                .from("endorsements")
                .select("skill")
                .eq("endorser_id", user.id)
                .eq("endorsed_id", endorsedId)
                .is("deleted_at", null)
                .limit(50),
        ]);

        const skills =
            row.other.role === "caregiver" &&
                caregiverRes.data?.specialties?.length
                ? (caregiverRes.data.specialties as string[]).slice(0, 20)
                : [
                    "Clear communication",
                    "Prepared home",
                    "Cooperative",
                    "Consistent",
                    "Kind",
                ];

        const existing = (myEndorsementsRes.data ?? []).map(
            (r) => r.skill as string
        );

        setEndorseTarget({
            connectionId: row.id,
            endorsedId,
            endorsedName: row.other.display_name ?? "this person",
            skills,
            existing,
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-8 w-40 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    const capReached = accepted.length >= SOFT_CAP;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
                Connections
            </h1>

            {role === "client" && capReached && (
                <div className="rounded-2xl bg-primary/10 px-4 py-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            You have {accepted.length} connected caregivers.
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Adding more is allowed, but a small, consistent care team
                            usually works better.
                        </p>
                    </div>
                </div>
            )}

            {incoming.length > 0 && (
                <Section title={`Requests to you (${incoming.length})`}>
                    {incoming.map((r) => (
                        <RequestCard
                            key={r.id}
                            row={r}
                            role={role}
                            onAccept={() =>
                                update.mutate({ id: r.id, status: "accepted" })
                            }
                            onDecline={() =>
                                update.mutate({ id: r.id, status: "declined" })
                            }
                            busy={update.isPending}
                        />
                    ))}
                </Section>
            )}

            {outgoing.length > 0 && (
                <Section title={`Sent requests (${outgoing.length})`}>
                    {outgoing.map((r) => (
                        <PendingCard
                            key={r.id}
                            row={r}
                            role={role}
                            onCancel={() => update.mutate({ id: r.id, status: "ended" })}
                            busy={update.isPending}
                        />
                    ))}
                </Section>
            )}

            <Section
                title={
                    role === "caregiver"
                        ? `Your clients (${accepted.length})`
                        : `Your caregivers (${accepted.length})`
                }
            >
                {accepted.length === 0 ? (
                    <EmptyCard
                        text={
                            role === "caregiver"
                                ? "No clients connected yet. When a client accepts your request, they'll appear here."
                                : "No caregivers connected yet. Browse Explore and send a request."
                        }
                        ctaLabel={role === "client" ? "Find caregivers" : undefined}
                        ctaTo={role === "client" ? "/explore" : undefined}
                    />
                ) : (
                    accepted.map((r) => (
                        <AcceptedCard
                            key={r.id}
                            row={r}
                            role={role}
                            endorsementCount={
                                r.other?.id
                                    ? endorsementCounts.get(r.other.id) ?? 0
                                    : 0
                            }
                            myEndorsementCount={
                                r.other?.id
                                    ? myEndorsementsMap.get(r.other.id) ?? 0
                                    : 0
                            }
                            unread={unreadCounts.get(r.id) ?? 0}
                            onOpenChat={() => navigate(`/chats/${r.id}`)}
                            onEndorse={() => onEndorse(r)}
                            onEnd={() => update.mutate({ id: r.id, status: "ended" })}
                            busy={update.isPending}
                        />
                    ))
                )}
            </Section>

            {endorseTarget && user && (
                <EndorseModal
                    endorserId={user.id}
                    endorsedId={endorseTarget.endorsedId}
                    connectionId={endorseTarget.connectionId}
                    endorsedName={endorseTarget.endorsedName}
                    skills={endorseTarget.skills}
                    existing={endorseTarget.existing}
                    onClose={() => setEndorseTarget(null)}
                />
            )}
        </div>
    );
}

/* ---------- pieces ---------- */

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                {title}
            </h2>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
    const initial = name?.[0]?.toUpperCase() ?? "?";
    return (
        <span className="w-11 h-11 rounded-full bg-primary/10 shrink-0 overflow-hidden flex items-center justify-center">
            {src ? (
                <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
                <span className="text-primary font-black">{initial}</span>
            )}
        </span>
    );
}

function RequestCard({
    row,
    role,
    onAccept,
    onDecline,
    busy,
}: {
    row: ConnectionRow;
    role: "client" | "caregiver";
    onAccept: () => void;
    onDecline: () => void;
    busy: boolean;
}) {
    const name = row.other?.display_name || (role === "client" ? "Caregiver" : "Client");
    return (
        <div className="rounded-2xl bg-card px-4 py-3">
            <div className="flex items-center gap-3">
                <Avatar name={name} src={row.other?.avatar_url ?? null} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Wants to connect · {new Date(row.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {row.request_note && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    "{row.request_note}"
                </p>
            )}

            <div className="flex gap-2 mt-3">
                <button
                    onClick={onDecline}
                    disabled={busy}
                    className="flex-1 h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                    <X className="w-4 h-4" />
                    Decline
                </button>
                <button
                    onClick={onAccept}
                    disabled={busy}
                    className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:opacity-90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                    <Check className="w-4 h-4" />
                    Accept
                </button>
            </div>
        </div>
    );
}

function PendingCard({
    row,
    role,
    onCancel,
    busy,
}: {
    row: ConnectionRow;
    role: "client" | "caregiver";
    onCancel: () => void;
    busy: boolean;
}) {
    const name = row.other?.display_name || (role === "client" ? "Caregiver" : "Client");
    return (
        <div className="rounded-2xl bg-card px-4 py-3 flex items-center gap-3">
            <Avatar name={name} src={row.other?.avatar_url ?? null} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Awaiting response
                </p>
            </div>
            <button
                onClick={onCancel}
                disabled={busy}
                className="h-11 px-3 rounded-2xl text-xs font-semibold text-muted-foreground active:bg-muted transition-colors disabled:opacity-60"
            >
                Cancel
            </button>
        </div>
    );
}

function AcceptedCard({
    row,
    role,
    endorsementCount,
    myEndorsementCount,
    unread,
    onOpenChat,
    onEndorse,
    onEnd,
    busy,
}: {
    row: ConnectionRow;
    role: "client" | "caregiver";
    endorsementCount: number;
    myEndorsementCount: number;
    unread: number;
    onOpenChat: () => void;
    onEndorse: () => void;
    onEnd: () => void;
    busy: boolean;
}) {
    const name = row.other?.display_name || (role === "client" ? "Caregiver" : "Client");
    const otherRole = row.other?.role ?? role;
    const showEndorsementCount = endorsementCount > 0;
    const showMyEndorsement = myEndorsementCount > 0;

    return (
        <div className="rounded-2xl bg-card px-4 py-4">
            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <Avatar name={name} src={row.other?.avatar_url ?? null} />
                    {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </div>

                <Link
                    to={`/profile/${row.other?.id}`}
                    className="flex-1 min-w-0 active:opacity-70 transition-opacity"
                >
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {name}
                        </p>
                        {showEndorsementCount && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                <Award className="w-3 h-3" />
                                {endorsementCount}
                            </span>
                        )}
                        {showMyEndorsement && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                                Endorsed
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {otherRole}
                    </p>
                </Link>
            </div>

            {/* Action row — Chat + Endorse, matching rectangular buttons */}
            <div className="mt-3 flex items-stretch gap-2">
                <button
                    onClick={onOpenChat}
                    className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {unread > 0 && (
                        <span className="rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </button>

                <button
                    onClick={onEndorse}
                    className="flex-1 h-11 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary transition-colors inline-flex items-center justify-center gap-2"
                >
                    <Award className="w-4 h-4" />
                    Endorse
                </button>

                <Link
                    to={`/profile/${row.other?.id}`}
                    className="h-11 w-11 shrink-0 rounded-2xl bg-muted flex items-center justify-center active:bg-secondary transition-colors"
                    aria-label="View profile"
                >
                    <ArrowRight className="w-4 h-4 text-foreground" />
                </Link>
            </div>

            <button
                onClick={onEnd}
                disabled={busy}
                className="mt-3 h-9 px-3 rounded-full text-xs font-semibold text-muted-foreground active:bg-muted transition-colors disabled:opacity-60"
            >
                End connection
            </button>
        </div>
    );
}

/* ---------- endorse modal ---------- */

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
            qc.invalidateQueries({ queryKey: ["my-endorsements"] });
            qc.invalidateQueries({ queryKey: ["endorsement-totals"] });
            onClose();
        },
    });

    return (
        <div className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl max-h-[85dvh] overflow-y-auto border border-border pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-6">
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

function EmptyCard({
    text,
    ctaLabel,
    ctaTo,
}: {
    text: string;
    ctaLabel?: string;
    ctaTo?: string;
}) {
    return (
        <div className="rounded-2xl bg-card px-4 py-6 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{text}</p>
            {ctaLabel && ctaTo && (
                <Link
                    to={ctaTo}
                    className="inline-block mt-4 h-11 leading-[44px] px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                    {ctaLabel}
                </Link>
            )}
        </div>
    );
}