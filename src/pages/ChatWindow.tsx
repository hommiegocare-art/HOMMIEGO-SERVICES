// src/pages/ChatWindow.tsx
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Check,
    CheckCheck,
    Clock,
    CornerUpLeft,
    Loader2,
    MoreVertical,
    Paperclip,
    Pencil,
    Send,
    ShieldAlert,
    ShieldCheck,
    Timer,
    X,
} from "lucide-react";
import {
    useChatWindow,
    MAX_ATTACHMENTS_PER_MESSAGE,
    type ChatMessage,
    type TtlOption,
    type AttachmentKind,
} from "@/hooks/useChatWindow";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useChatTyping } from "@/hooks/useChatTyping";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";
import {
    MessageActions,
    type MessageActionTarget,
} from "@/components/chat/MessageActions";
import { AttachmentBubble } from "@/components/chat/AttachmentBubble";
import { AttachmentViewer } from "@/components/chat/AttachmentViewer";
import {
    ComposeAttachments,
    makePendingAttachment,
    type PendingAttachment,
} from "@/components/chat/ComposeAttachments";

const TTL_OPTIONS: { value: TtlOption; label: string; short: string }[] = [
    { value: 300, label: "5 minutes", short: "5m" },
    { value: 1800, label: "30 minutes", short: "30m" },
    { value: 3600, label: "1 hour", short: "1h" },
    { value: 21600, label: "6 hours", short: "6h" },
    { value: 86400, label: "24 hours", short: "24h" },
    { value: 604800, label: "7 days", short: "7d" },
    { value: -1, label: "Until read + 5 min", short: "↺5m" },
];

const EDIT_WINDOW_MS = 15 * 60 * 1000;

// How close to the top (in px) the user has to scroll before we
// start loading older messages. 400 gives a comfortable buffer.
const TOP_SCROLL_TRIGGER_PX = 400;

function shortTtl(ttl: TtlOption | null): string {
    if (ttl === null) return "auto";
    const found = TTL_OPTIONS.find((o) => o.value === ttl);
    return found ? found.short : "auto";
}

function fmtTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yest)) return "Yesterday";
    return d.toLocaleDateString();
}

function canEditOrDelete(m: ChatMessage, myId: string | undefined): boolean {
    if (!myId || m.senderId !== myId) return false;
    if (m.tombstoned) return false;
    if (m.readAt) return false;
    const age = Date.now() - new Date(m.createdAt).getTime();
    return age < EDIT_WINDOW_MS;
}

function Ticks({ m, mine }: { m: ChatMessage; mine: boolean }) {
    if (!mine) return null;
    if (m.pending) return <Clock className="h-3 w-3 opacity-70" />;
    if (m.failed) return <span className="text-[10px] font-bold text-destructive">!</span>;
    if (m.readAt) return <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />;
    if (m.deliveredAt) return <CheckCheck className="h-3.5 w-3.5 opacity-70" />;
    return <Check className="h-3 w-3 opacity-70" />;
}

function TombstoneBubble({ mine }: { mine: boolean }) {
    return (
        <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5",
                    "bg-muted text-muted-foreground",
                )}
            >
                <p className="text-sm italic">This message was deleted</p>
            </div>
        </div>
    );
}

function ReplyPreview({
    parent,
    mine,
    otherName,
}: {
    parent: ChatMessage["replyToPreview"];
    mine: boolean;
    otherName: string;
}) {
    if (!parent) {
        return (
            <div
                className={cn(
                    "mb-1 rounded-2xl px-2 py-1 text-[11px] italic",
                    mine
                        ? "bg-primary-foreground/10 text-primary-foreground/70"
                        : "bg-background/40 text-muted-foreground",
                )}
            >
                Original message unavailable
            </div>
        );
    }
    return (
        <div
            className={cn(
                "mb-1 rounded-2xl px-2 py-1 text-[11px]",
                mine
                    ? "bg-primary-foreground/10 text-primary-foreground/90"
                    : "bg-background/40 text-foreground",
            )}
        >
            <p className="font-bold">{otherName}</p>
            <p className="line-clamp-2 opacity-90">{parent.body ?? "—"}</p>
        </div>
    );
}

function Bubble({
    m,
    mine,
    otherName,
    onLongPress,
    onOpenAttachment,
}: {
    m: ChatMessage;
    mine: boolean;
    otherName: string;
    onLongPress: (m: ChatMessage) => void;
    onOpenAttachment: (messageId: string, index: number) => void;
}) {
    const longPressTimer = useRef<number | null>(null);

    if (m.tombstoned) {
        return <TombstoneBubble mine={mine} />;
    }

    const clearTimer = () => {
        if (longPressTimer.current !== null) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const startLongPress = () => {
        clearTimer();
        longPressTimer.current = window.setTimeout(() => {
            onLongPress(m);
        }, 450);
    };

    return (
        <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div
                onContextMenu={(e) => {
                    e.preventDefault();
                    onLongPress(m);
                }}
                onTouchStart={startLongPress}
                onTouchEnd={clearTimer}
                onTouchMove={clearTimer}
                onMouseDown={startLongPress}
                onMouseUp={clearTimer}
                onMouseLeave={clearTimer}
                className={cn(
                    "max-w-[78%] cursor-pointer select-none rounded-2xl px-4 py-2.5",
                    mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                )}
            >
                {m.replyToId ? (
                    <ReplyPreview parent={m.replyToPreview} mine={mine} otherName={otherName} />
                ) : null}

                {m.attachments.length > 0 ? (
                    <div className={m.body ? "mb-2" : ""}>
                        <AttachmentBubble
                            attachments={m.attachments}
                            onOpenIndex={(i) => onOpenAttachment(m.id, i)}
                        />
                    </div>
                ) : null}

                {m.body ? (
                    <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                ) : null}

                <div
                    className={cn(
                        "mt-1 flex items-center gap-1 text-[10px]",
                        mine ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                >
                    {m.editedAt ? <span className="italic">edited</span> : null}
                    <span>{fmtTime(m.createdAt)}</span>
                    <Ticks m={m} mine={mine} />
                </div>
            </div>
        </div>
    );
}

function DayDivider({ label }: { label: string }) {
    return (
        <div className="my-3 flex justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    );
}

function SkeletonBubble({ mine }: { mine: boolean }) {
    return (
        <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div className="skeleton-shimmer h-10 w-40 rounded-2xl" />
        </div>
    );
}

function TtlSheet({
    open,
    onClose,
    current,
    onPick,
}: {
    open: boolean;
    onClose: () => void;
    current: TtlOption | null;
    onPick: (v: TtlOption | null) => void;
}) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-foreground/40 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full rounded-t-3xl bg-card px-4 pb-6 pt-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Message disappears after
                </p>
                <ul className="space-y-2">
                    {TTL_OPTIONS.map((opt) => (
                        <li key={String(opt.value)}>
                            <button
                                type="button"
                                onClick={() => {
                                    onPick(opt.value);
                                    onClose();
                                }}
                                className={cn(
                                    "flex h-11 w-full items-center justify-between rounded-2xl px-4 text-sm transition-colors active:bg-muted",
                                    current === opt.value
                                        ? "bg-muted text-foreground font-bold"
                                        : "text-foreground",
                                )}
                            >
                                <span>{opt.label}</span>
                                {current === opt.value && <Check className="h-4 w-4" />}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                onPick(null);
                                onClose();
                            }}
                            className={cn(
                                "flex h-11 w-full items-center justify-between rounded-2xl px-4 text-sm transition-colors active:bg-muted",
                                current === null
                                    ? "bg-muted text-foreground font-bold"
                                    : "text-foreground",
                            )}
                        >
                            <span>Use connection default</span>
                            {current === null && <Check className="h-4 w-4" />}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function useOtherVerification(
    otherUserId: string | null | undefined,
    otherRole: string | null | undefined,
) {
    return useQuery({
        queryKey: ["chat-other-verified", otherUserId],
        enabled: !!otherUserId && otherRole === "caregiver",
        staleTime: 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("caregiver_profiles")
                .select("verification_status")
                .eq("user_id", otherUserId!)
                .maybeSingle();
            if (error) return null;
            return data?.verification_status ?? null;
        },
    });
}

export default function ChatWindow() {
    const { connectionId } = useParams<{ connectionId: string }>();
    const { user } = useSession();
    const navigate = useNavigate();
    const [focused, setFocused] = useState(
        typeof document !== "undefined" ? document.visibilityState === "visible" : true,
    );
    const [draft, setDraft] = useState("");
    const [perMessageTtl, setPerMessageTtl] = useState<TtlOption | null>(null);
    const [ttlSheetOpen, setTtlSheetOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
    const [editing, setEditing] = useState<ChatMessage | null>(null);
    const [pending, setPending] = useState<PendingAttachment[]>([]);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [sendingAttachments, setSendingAttachments] = useState(false);
    const [viewerState, setViewerState] = useState<{
        messageId: string;
        index: number;
    } | null>(null);
    const [attachSheetOpen, setAttachSheetOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);

    // Refs used for scroll anchoring when older messages are prepended.
    const prevFirstIdRef = useRef<string | null>(null);
    const prevLastIdRef = useRef<string | null>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const prevScrollTopRef = useRef<number>(0);
    const anchoredRef = useRef(false);

    const {
        meta,
        metaLoading,
        messages,
        messagesLoading,
        send,
        sendAttachments,
        editMessage,
        deleteMessage,
        markDelivered,
        markRead,
        updateSettings,
        replyTo,
        setReplyTo,
        clearReplyTo,
        hasMoreOlder,
        loadingOlder,
        loadOlder,
    } = useChatWindow(connectionId, focused);

    const { otherTyping, signalTyping, stopTyping } = useChatTyping(
        connectionId,
        focused,
    );

    const otherVerified = useOtherVerification(meta?.otherUserId, meta?.otherRole);
    const showVerifiedBadge = otherVerified.data === "verified";

    useEffect(() => {
        const onVis = () => setFocused(document.visibilityState === "visible");
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    // Track scroll position continuously so we can compute an anchor
    // delta after prepending older messages.
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        prevScrollHeightRef.current = el.scrollHeight;
        prevScrollTopRef.current = el.scrollTop;

        // Near the top? Ask for older messages.
        if (
            el.scrollTop < TOP_SCROLL_TRIGGER_PX &&
            hasMoreOlder &&
            !loadingOlder
        ) {
            anchoredRef.current = true;
            void loadOlder();
        }
    }, [hasMoreOlder, loadingOlder, loadOlder]);

    // After messages change, either:
    //   - if anchored (we just loaded older), restore the viewport
    //   - if a new message arrived at the bottom, jump to bottom
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const first = messages.length > 0 ? messages[0].id : null;
        const last =
            messages.length > 0 ? messages[messages.length - 1].id : null;

        const isInitial = prevLastIdRef.current === null;
        const gotOlder =
            first !== prevFirstIdRef.current &&
            last === prevLastIdRef.current;
        const gotNewer = last !== prevLastIdRef.current;

        if (isInitial) {
            el.scrollTop = el.scrollHeight;
            anchoredRef.current = false;
        } else if (anchoredRef.current && gotOlder) {
            // Prepend case. Restore by offsetting scrollTop by the
            // delta in scrollHeight that occurred since the fetch
            // started.
            const delta = el.scrollHeight - prevScrollHeightRef.current;
            if (delta > 0) {
                el.scrollTop = prevScrollTopRef.current + delta;
            }
            anchoredRef.current = false;
        } else if (gotNewer) {
            // New message arrived at the bottom (send or realtime).
            // Only auto-scroll if the user was already near the bottom;
            // if they're reading older messages, leave their viewport
            // alone.
            const distanceFromBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight;
            if (distanceFromBottom < 200) {
                el.scrollTop = el.scrollHeight;
            }
        }

        prevFirstIdRef.current = first;
        prevLastIdRef.current = last;
        prevScrollHeightRef.current = el.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (!focused || !user) return;
        const undelivered = messages
            .filter((m) => m.senderId !== user.id && !m.deliveredAt && !m.tombstoned)
            .map((m) => m.id);
        if (undelivered.length > 0) void markDelivered(undelivered);

        const unread = messages
            .filter((m) => m.senderId !== user.id && !m.readAt && !m.tombstoned)
            .map((m) => m.id);
        if (unread.length > 0) void markRead(unread);
    }, [focused, messages, user, markDelivered, markRead]);

    useEffect(() => {
        return () => {
            pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const grouped = useMemo(() => {
        const out: { day: string; items: ChatMessage[] }[] = [];
        for (const m of messages) {
            const day = fmtDay(m.createdAt);
            const last = out[out.length - 1];
            if (last && last.day === day) last.items.push(m);
            else out.push({ day, items: [m] });
        }
        return out;
    }, [messages]);

    const connectionClosed =
        meta?.connectionStatus === "blocked" ||
        meta?.connectionStatus === "ended" ||
        meta?.connectionStatus === "declined";

    const lastSeenLine = useMemo(() => {
        const iso = meta?.otherLastSeenAt;
        if (!iso) return "";
        const then = new Date(iso).getTime();
        const diff = Date.now() - then;
        const m = Math.floor(diff / 60_000);
        if (m < 1) return "last seen just now";
        if (m < 60) return `last seen ${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `last seen ${h}h ago`;
        const d = Math.floor(h / 24);
        if (d < 7) return `last seen ${d}d ago`;
        return `last seen ${new Date(iso).toLocaleDateString()}`;
    }, [meta]);

    const openActions = (m: ChatMessage) => {
        setActionTarget({
            id: m.id,
            body: m.body,
            canEdit: canEditOrDelete(m, user?.id),
            canDelete: canEditOrDelete(m, user?.id),
        });
    };

    const onCopy = async (t: MessageActionTarget) => {
        if (!t.body) return;
        try {
            await navigator.clipboard.writeText(t.body);
        } catch {
            /* silent */
        }
    };

    const onReply = (t: MessageActionTarget) => {
        const parent = messages.find((m) => m.id === t.id) ?? null;
        if (parent) setReplyTo(parent);
        composerRef.current?.focus();
    };

    const onEdit = (t: MessageActionTarget) => {
        const target = messages.find((m) => m.id === t.id) ?? null;
        if (!target) return;
        setEditing(target);
        setDraft(target.body ?? "");
        clearReplyTo();
        composerRef.current?.focus();
    };

    const onDelete = async (t: MessageActionTarget) => {
        const ok = window.confirm(
            "Delete this message? The other party will see that it was deleted.",
        );
        if (!ok) return;
        await deleteMessage(t.id);
    };

    const onAddAttachment = useCallback(
        (item: { file: File; kind: AttachmentKind }) => {
            setPending((prev) => {
                if (prev.length >= MAX_ATTACHMENTS_PER_MESSAGE) return prev;
                return [...prev, makePendingAttachment(item.file, item.kind)];
            });
        },
        [],
    );

    const onRemoveAttachment = useCallback((id: string) => {
        setPending((prev) => {
            const found = prev.find((p) => p.id === id);
            if (found) URL.revokeObjectURL(found.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    const clearPending = useCallback(() => {
        setPending((prev) => {
            prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return [];
        });
    }, []);

    const onSend = async () => {
        const text = draft.trim();

        if (editing) {
            if (!text) return;
            const id = editing.id;
            setEditing(null);
            setDraft("");
            stopTyping();
            await editMessage(id, text);
            return;
        }

        if (pending.length > 0) {
            const items = pending.map((p) => ({ file: p.file, kind: p.kind }));
            const replyId = replyTo?.id ?? null;
            setDraft("");
            clearReplyTo();
            stopTyping();
            clearPending();
            setSendingAttachments(true);
            try {
                await sendAttachments(items, text, perMessageTtl, replyId);
            } finally {
                setSendingAttachments(false);
            }
            return;
        }

        if (!text) return;
        const replyId = replyTo?.id ?? null;
        setDraft("");
        clearReplyTo();
        stopTyping();
        await send(text, perMessageTtl, replyId);
    };

    const onCancelEdit = () => {
        setEditing(null);
        setDraft("");
    };

    const onToggleDisappearing = () => {
        if (!meta) return;
        void updateSettings({ disappearing_enabled: !meta.disappearingEnabled });
    };

    const onReport = async () => {
        setMenuOpen(false);
        if (!user || !meta) return;
        const ok = window.confirm(
            "Report this conversation? An admin will review it. This will block further messages.",
        );
        if (!ok) return;
        await supabase.from("reports").insert({
            reporter_id: user.id,
            reported_user_id: meta.otherUserId,
            connection_id: meta.connectionId,
            reason: "user_reported",
        });
        await supabase
            .from("connections")
            .update({ status: "blocked" })
            .eq("id", meta.connectionId);
        navigate("/chats");
    };

    const onBlock = async () => {
        setMenuOpen(false);
        if (!meta) return;
        const ok = window.confirm("Block this user? You won't be able to chat again.");
        if (!ok) return;
        await supabase
            .from("connections")
            .update({ status: "blocked" })
            .eq("id", meta.connectionId);
        navigate("/chats");
    };

    const replyParent = replyTo;
    const canSend =
        !connectionClosed &&
        !sendingAttachments &&
        (draft.trim().length > 0 || pending.length > 0);

    const viewerMessage = viewerState
        ? messages.find((m) => m.id === viewerState.messageId) ?? null
        : null;
    const viewerAttachments = viewerMessage?.attachments ?? [];
    const viewerIndex =
        viewerState && viewerAttachments.length > 0
            ? Math.min(viewerState.index, viewerAttachments.length - 1)
            : 0;

    return (
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
            <header className="relative z-30 shrink-0 bg-background">
                <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Back"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors active:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5 text-foreground" />
                    </button>

                    {metaLoading ? (
                        <div className="skeleton-shimmer h-11 w-11 rounded-full" />
                    ) : meta?.otherAvatarUrl ? (
                        <img
                            src={meta.otherAvatarUrl}
                            alt=""
                            className="h-11 w-11 rounded-full bg-muted object-cover"
                        />
                    ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {(meta?.otherDisplayName ?? "?")
                                .split(" ")
                                .map((s) => s[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() || "?"}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                                {meta?.otherDisplayName ?? "Loading…"}
                            </p>
                            <VerifiedBadge
                                show={showVerifiedBadge}
                                className="w-4 h-4 shrink-0"
                            />
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground capitalize">
                            {otherTyping ? (
                                <span className="text-success font-bold">typing…</span>
                            ) : (
                                <>
                                    {meta?.otherRole ?? ""}
                                    {lastSeenLine ? (
                                        <span className="normal-case">
                                            {" · "}
                                            {lastSeenLine}
                                        </span>
                                    ) : null}
                                </>
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onToggleDisappearing}
                        aria-label="Toggle disappearing messages"
                        className={cn(
                            "flex h-11 items-center gap-1.5 rounded-2xl px-3 text-xs font-bold transition-colors active:opacity-90",
                            meta?.disappearingEnabled
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        <Timer className="h-4 w-4" />
                        {meta?.disappearingEnabled ? "On" : "Off"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="More"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors active:bg-muted"
                    >
                        <MoreVertical className="h-5 w-5 text-foreground" />
                    </button>
                </div>

                {menuOpen && (
                    <div className="absolute right-3 top-16 z-40 w-48 rounded-2xl bg-popover p-1 animate-fade-in">
                        <button
                            type="button"
                            onClick={onReport}
                            className="flex h-11 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm text-foreground transition-colors active:bg-muted"
                        >
                            <ShieldAlert className="h-4 w-4" />
                            Report
                        </button>
                        <button
                            type="button"
                            onClick={onBlock}
                            className="flex h-11 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm text-destructive transition-colors active:bg-muted"
                        >
                            <ShieldAlert className="h-4 w-4" />
                            Block
                        </button>
                    </div>
                )}
            </header>

            {/* SCROLLABLE MESSAGES */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
            >
                <div className="mx-auto max-w-3xl">
                    <div className="mb-3 mt-2">
                        <div className="flex items-start gap-2 rounded-2xl bg-success/10 px-3 py-2">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                            <p className="text-[11px] text-success">
                                Private and ephemeral. Screenshots can't be detected —
                                keep health details between you and your caregiver.
                            </p>
                        </div>
                    </div>

                    {/* Older-messages loading / no-more pill */}
                    {messages.length > 0 ? (
                        <div className="my-3 flex justify-center">
                            {loadingOlder ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading earlier messages
                                </span>
                            ) : hasMoreOlder ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        anchoredRef.current = true;
                                        void loadOlder();
                                    }}
                                    className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors active:bg-secondary"
                                >
                                    Load earlier messages
                                </button>
                            ) : (
                                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Start of conversation
                                </span>
                            )}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        {messagesLoading && (
                            <>
                                <SkeletonBubble mine={false} />
                                <SkeletonBubble mine={true} />
                                <SkeletonBubble mine={false} />
                            </>
                        )}

                        {!messagesLoading && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                    <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-bold text-foreground">
                                    No messages yet
                                </p>
                                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                    Say hello. Messages disappear based on the timer you set.
                                </p>
                            </div>
                        )}

                        {grouped.map(({ day, items }) => (
                            <div key={day} className="space-y-2">
                                <DayDivider label={day} />
                                {items.map((m) => (
                                    <Bubble
                                        key={m.id}
                                        m={m}
                                        mine={m.senderId === user?.id}
                                        otherName={meta?.otherDisplayName ?? "Them"}
                                        onLongPress={openActions}
                                        onOpenAttachment={(messageId, index) =>
                                            setViewerState({ messageId, index })
                                        }
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PINNED COMPOSE */}
            <div className="relative z-30 shrink-0 bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="mx-auto max-w-3xl px-4 pt-2">
                    {connectionClosed ? (
                        <div className="rounded-2xl bg-muted px-4 py-4 text-center">
                            <p className="text-sm font-bold text-foreground">
                                This conversation is closed
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {meta?.connectionStatus === "blocked"
                                    ? "You blocked this user, or they blocked you. You can't send new messages here."
                                    : "This connection has ended. Start a new connection to chat again."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {editing ? (
                                <div className="mb-2 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                                    <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold text-foreground">
                                            Editing message
                                        </p>
                                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                            {editing.body ?? ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onCancelEdit}
                                        aria-label="Cancel edit"
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors active:bg-secondary"
                                    >
                                        <X className="h-4 w-4 text-foreground" />
                                    </button>
                                </div>
                            ) : null}

                            {!editing && replyParent ? (
                                <div className="mb-2 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                                    <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold text-foreground">
                                            Replying to{" "}
                                            {replyParent.senderId === user?.id
                                                ? "yourself"
                                                : meta?.otherDisplayName ?? "them"}
                                        </p>
                                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                            {replyParent.tombstoned
                                                ? "Deleted message"
                                                : replyParent.body ?? "Attachment"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearReplyTo}
                                        aria-label="Cancel reply"
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors active:bg-secondary"
                                    >
                                        <X className="h-4 w-4 text-foreground" />
                                    </button>
                                </div>
                            ) : null}

                            {!editing ? (
                                <ComposeAttachments
                                    disabled={connectionClosed || sendingAttachments}
                                    items={pending}
                                    onAdd={onAddAttachment}
                                    onRemove={onRemoveAttachment}
                                    onError={(msg) => {
                                        setErrorText(msg);
                                        window.setTimeout(() => setErrorText(null), 3500);
                                    }}
                                    max={MAX_ATTACHMENTS_PER_MESSAGE}
                                    externalSheetOpen={attachSheetOpen}
                                    onExternalSheetClose={() => setAttachSheetOpen(false)}
                                />
                            ) : null}

                            {errorText ? (
                                <div className="mb-2 rounded-2xl bg-destructive/10 px-3 py-2">
                                    <p className="text-[11px] font-bold text-destructive">
                                        {errorText}
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex items-end gap-2">
                                <div className="flex flex-1 items-end gap-1 rounded-2xl bg-card px-1.5 py-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setAttachSheetOpen(true)}
                                        disabled={!!editing || sendingAttachments}
                                        aria-label="Attach"
                                        className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                                            "text-muted-foreground transition-colors active:bg-muted",
                                            "disabled:opacity-40",
                                        )}
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>

                                    <textarea
                                        ref={composerRef}
                                        value={draft}
                                        onChange={(e) => {
                                            setDraft(e.target.value);
                                            if (!editing) signalTyping();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                if (canSend) void onSend();
                                            }
                                        }}
                                        rows={1}
                                        placeholder={editing ? "Edit message…" : "Message"}
                                        className="max-h-32 min-h-[36px] w-full flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setTtlSheetOpen(true)}
                                        disabled={!!editing}
                                        aria-label="Message timer"
                                        className={cn(
                                            "flex h-9 shrink-0 items-center gap-1 rounded-2xl px-2 text-[11px] font-bold transition-colors active:bg-muted disabled:opacity-40",
                                            perMessageTtl === null
                                                ? "text-muted-foreground"
                                                : "text-foreground",
                                        )}
                                    >
                                        <Timer className="h-4 w-4" />
                                        {shortTtl(perMessageTtl)}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void onSend()}
                                    disabled={!canSend}
                                    aria-label="Send"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors active:opacity-90 disabled:opacity-40"
                                >
                                    {sendingAttachments ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <TtlSheet
                open={ttlSheetOpen}
                onClose={() => setTtlSheetOpen(false)}
                current={perMessageTtl}
                onPick={(v) => setPerMessageTtl(v)}
            />

            <AttachmentViewer
                attachments={viewerAttachments}
                index={viewerIndex}
                onClose={() => setViewerState(null)}
                onIndexChange={(i) =>
                    setViewerState((prev) => (prev ? { ...prev, index: i } : prev))
                }
            />

            <MessageActions
                target={actionTarget}
                onClose={() => setActionTarget(null)}
                onReply={onReply}
                onEdit={onEdit}
                onCopy={onCopy}
                onDelete={onDelete}
            />
        </div>
    );
}