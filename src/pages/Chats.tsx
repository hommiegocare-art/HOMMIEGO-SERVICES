// src/pages/Chats.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useChatList, type ChatListItem } from "@/hooks/useChatList";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";

function timeAgo(iso: string | null): string {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString();
}

function previewText(item: ChatListItem, myId: string | undefined): string {
    if (!item.lastMessageId) return "No messages yet";
    const mine = item.lastMessageSender === myId;
    const body = item.lastMessageBody ?? "";
    const clipped = body.length > 60 ? body.slice(0, 60).trimEnd() + "…" : body;
    return mine ? `You: ${clipped}` : clipped;
}

/**
 * Fetch verification status for every caregiver in the chat list in one query.
 * Returns a Set of caregiver user_ids who are verified.
 * Clients are ignored (they never get a badge).
 */
function useVerifiedCaregiverIds(items: ChatListItem[]) {
    const caregiverIds = items
        .filter((it) => it.otherRole === "caregiver")
        .map((it) => it.otherUserId)
        .filter(Boolean) as string[];

    return useQuery({
        queryKey: ["chats-verified-ids", [...caregiverIds].sort().join(",")],
        enabled: caregiverIds.length > 0,
        staleTime: 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("caregiver_profiles")
                .select("user_id, verification_status")
                .in("user_id", caregiverIds)
                .eq("verification_status", "verified");
            if (error) return new Set<string>();
            return new Set((data ?? []).map((r: any) => r.user_id as string));
        },
    });
}

function Row({
    item,
    myId,
    verifiedIds,
}: {
    item: ChatListItem;
    myId: string | undefined;
    verifiedIds: Set<string>;
}) {
    const initials = (item.otherDisplayName ?? "?")
        .split(" ")
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const showBadge =
        item.otherRole === "caregiver" && verifiedIds.has(item.otherUserId);

    return (
        <Link
            to={`/chats/${item.connectionId}`}
            className={cn(
                "flex items-center gap-3 rounded-2xl bg-card px-4 py-4",
                "transition-colors active:bg-muted",
            )}
        >
            {item.otherAvatarUrl ? (
                <img
                    src={item.otherAvatarUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full bg-muted object-cover"
                />
            ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {initials || "?"}
                </div>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-foreground">
                            {item.otherDisplayName ?? "Unknown"}
                        </p>
                        <VerifiedBadge
                            show={showBadge}
                            className="w-4 h-4 shrink-0"
                        />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(item.lastMessageAt)}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {previewText(item, myId)}
                </p>
            </div>

            {item.unreadCount > 0 && (
                <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-primary-foreground">
                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </span>
            )}
        </Link>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4">
            <div className="skeleton-shimmer h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-3 w-1/3 rounded-2xl" />
                <div className="skeleton-shimmer h-3 w-2/3 rounded-2xl" />
            </div>
        </div>
    );
}

export default function Chats() {
    const { user } = useSession();
    const { data, isLoading, isError, refetch } = useChatList();

    const visible = (data ?? []).filter(
        (it) => it.connectionStatus === "accepted" || it.connectionStatus === "pending",
    );

    const { data: verifiedIds } = useVerifiedCaregiverIds(visible);

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 pb-24 lg:pb-8 animate-fade-in">
            <header className="mb-5 space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Chats
                </h1>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Private, ephemeral conversations. Messages disappear.
                </p>
            </header>

            <div className="mb-5 rounded-2xl bg-success/10 px-4 py-3">
                <p className="text-xs text-success">
                    Screenshots can't be detected — please keep this conversation between
                    you and your caregiver.
                </p>
            </div>

            {isLoading && (
                <div className="space-y-4">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            )}

            {isError && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-4">
                    <p className="text-sm font-bold text-destructive">
                        Couldn't load your chats.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-2 h-11 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors active:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading && !isError && visible.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-12 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <MessageCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-foreground">No chats yet</p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Accept a connection with a caregiver and a private chat will open
                        here automatically.
                    </p>
                </div>
            )}

            {!isLoading && !isError && visible.length > 0 && (
                <ul className="space-y-4">
                    {visible.map((item) => (
                        <li key={item.connectionId}>
                            <Row
                                item={item}
                                myId={user?.id}
                                verifiedIds={verifiedIds ?? new Set()}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}