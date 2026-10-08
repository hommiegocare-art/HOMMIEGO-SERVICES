// src/pages/Connections.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Check,
    X,
    Clock,
    Users,
    AlertCircle,
    ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Connection, Profile } from "@/types/db";

const SOFT_CAP = 3;

type ConnectionRow = Connection & {
    other: Pick<Profile, "id" | "display_name" | "avatar_url" | "role"> | null;
};

/* ---------- data ---------- */

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

/* ---------- page ---------- */

export default function Connections() {
    const { user } = useSession();
    const qc = useQueryClient();

    const role = (user?.role === "caregiver" ? "caregiver" : "client") as
        | "client"
        | "caregiver";

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["connections", user?.id, role],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: () => fetchConnections(user!.id, role),
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
                            Adding more is allowed, but a small, consistent care team usually
                            works better.
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
                            onAccept={() => update.mutate({ id: r.id, status: "accepted" })}
                            onDecline={() => update.mutate({ id: r.id, status: "declined" })}
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
                            onEnd={() => update.mutate({ id: r.id, status: "ended" })}
                            busy={update.isPending}
                        />
                    ))
                )}
            </Section>
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

function Avatar({
    name,
    src,
}: {
    name: string;
    src: string | null;
}) {
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
    onEnd,
    busy,
}: {
    row: ConnectionRow;
    role: "client" | "caregiver";
    onEnd: () => void;
    busy: boolean;
}) {
    const name = row.other?.display_name || (role === "client" ? "Caregiver" : "Client");
    return (
        <div className="rounded-2xl bg-card px-4 py-3">
            <div className="flex items-center gap-3">
                <Avatar name={name} src={row.other?.avatar_url ?? null} />
                <Link
                    to={`/profile/${row.other?.id}`}
                    className="flex-1 min-w-0 active:opacity-70 transition-opacity"
                >
                    <p className="text-sm font-semibold text-foreground truncate">
                        {name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {row.other?.role ?? role}
                    </p>
                </Link>
                <Link
                    to={`/profile/${row.other?.id}`}
                    className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted transition-colors"
                    aria-label="View profile"
                >
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
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