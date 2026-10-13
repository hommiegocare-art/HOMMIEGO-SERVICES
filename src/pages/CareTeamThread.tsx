// src/pages/CareTeamThread.tsx
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    ArrowLeft,
    CornerUpLeft,
    Heart,
    Loader2,
    Pencil,
    Reply,
    Send,
    ShieldCheck,
    Stethoscope,
    X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";
import { cn } from "@/lib/utils";
import {
    useCareTeamThread,
    MAX_ATTACHMENTS_PER_MESSAGE,
    type CareTeamMessage,
} from "@/hooks/useCareTeamThread";
import {
    ComposeAttachments,
    makePendingAttachment,
    type PendingAttachment,
} from "@/components/chat/ComposeAttachments";
import {
    AttachmentBubble,
    type BubbleAttachment,
} from "@/components/chat/AttachmentBubble";
import {
    AttachmentViewer,
    type ViewerAttachment,
} from "@/components/chat/AttachmentViewer";
import { useQueryClient } from "@tanstack/react-query";
// ---- types -----------------------------------------------------------------

type ThreadRow = {
    id: string;
    referral_id: string;
    client_id: string;
    caregiver_id: string | null;
    hospital_id: string;
    created_by: string;
    is_archived: boolean;
    expires_at: string;
    created_at: string;
    referral: {
        id: string;
        referring_user_id: string;
        note_to_patient: string | null;
        note_to_caregiver: string | null;
        services_needed: string[];
        urgency: string;
        hospital: { id: string; name: string } | null;
    } | null;
};

type ProfileLite = {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
};

type MessageActionTarget = {
    id: string;
    body: string;
    canEdit: boolean;
    canDelete: boolean;
};

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const SWIPE_MAX = 72;
const SWIPE_THRESHOLD = 56;

// ---- thread fetch ----------------------------------------------------------

async function fetchThread(threadId: string): Promise<ThreadRow | null> {
    const { data, error } = await supabase
        .from("care_team_threads")
        .select(
            `id, referral_id, client_id, caregiver_id, hospital_id, created_by,
       is_archived, expires_at, created_at,
       referral:referrals(
         id, referring_user_id, note_to_patient, note_to_caregiver,
         services_needed, urgency,
         hospital:hospitals(id, name)
       )`
        )
        .eq("id", threadId)
        .maybeSingle();
    if (error) throw error;
    return (data as unknown as ThreadRow) ?? null;
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

// ---- time helpers ----------------------------------------------------------

function timeShort(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function dayLabel(iso: string): string {
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
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function relativeFuture(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "ended";
    const h = Math.floor(diff / 3_600_000);
    if (h < 24) return `${h}h left`;
    const d = Math.floor(h / 24);
    return `${d}d left`;
}

function canEditOrDelete(m: CareTeamMessage, myId: string | undefined): boolean {
    if (!myId || m.senderId !== myId) return false;
    if (m.deletedAt) return false;
    const age = Date.now() - new Date(m.createdAt).getTime();
    return age < EDIT_WINDOW_MS;
}

// ---- page ------------------------------------------------------------------

export default function CareTeamThread() {
    const { threadId } = useParams<{ threadId: string }>();
    const navigate = useNavigate();
    const { user, loading: sessionLoading } = useSession();

    const qc = useQueryClient();

    // Mark care team notifications for this thread as read on open.
    // Then refresh the sidebar / bottom-nav unread badge.
    useEffect(() => {
        if (!threadId || !user) return;
        void supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("type", "care_team_message")
            .eq("is_read", false)
            .eq("thread_id", threadId)
            .then(() => {
                qc.invalidateQueries({
                    queryKey: ["notifications", "unread_care_team", user.id],
                });
                qc.invalidateQueries({
                    queryKey: ["care_team_unread_by_thread", user.id],
                });
            });
    }, [threadId, user, qc]);
    const threadQuery = useQuery({
        queryKey: ["care_team_thread", threadId],
        enabled: !!threadId,
        staleTime: 30_000,
        queryFn: () => fetchThread(threadId!),
    });

    const thread = threadQuery.data ?? null;

    const myRole = useMemo(() => {
        if (!thread || !user) return "participant";
        if (user.id === thread.client_id) return "client";
        if (user.id === thread.caregiver_id) return "caregiver";
        if (user.id === thread.referral?.referring_user_id) return "doctor";
        return "participant";
    }, [thread, user]);

    const {
        messages,
        messagesLoading,
        send,
        sendAttachments,
        editMessage,
        deleteMessage,
        discard,
        retry,
    } = useCareTeamThread(threadId, !!thread);

    const participantIds = useMemo(() => {
        if (!thread) return [];
        return [
            thread.client_id,
            thread.caregiver_id ?? "",
            thread.referral?.referring_user_id ?? "",
        ].filter(Boolean);
    }, [thread]);

    const profilesQuery = useQuery({
        queryKey: ["care_team_profiles", participantIds.sort().join(",")],
        enabled: participantIds.length > 0,
        staleTime: 5 * 60_000,
        queryFn: () => fetchProfiles(participantIds),
    });

    const profiles = profilesQuery.data ?? new Map<string, ProfileLite>();

    // ---- scroll ------------------------------------------------------------
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
    const prevLastIdRef = useRef<string | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showJump, setShowJump] = useState(false);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setAutoScroll(nearBottom);
        setShowJump(!nearBottom);
    };

    // Scroll to bottom, waiting for layout to settle. Run twice — once
    // synchronously and once after RAF — because images/videos that
    // haven't laid out yet can shift the height.
    const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
        requestAnimationFrame(() => {
            const el2 = scrollRef.current;
            if (!el2) return;
            el2.scrollTo({ top: el2.scrollHeight, behavior: "auto" });
        });
    };

    // On first load: jump to bottom with no animation.
    useLayoutEffect(() => {
        if (messages.length === 0) return;
        if (prevLastIdRef.current === null) {
            scrollToBottom("auto");
            prevLastIdRef.current = messages[messages.length - 1].id;
        }
    }, [messages.length]);

    // On new message: if the user was at the bottom, scroll. If not,
    // keep their position but show the "Jump to latest" pill.
    useEffect(() => {
        if (messages.length === 0) return;
        const last = messages[messages.length - 1].id;
        if (prevLastIdRef.current === last) return;

        const isNewer = prevLastIdRef.current !== null;
        prevLastIdRef.current = last;

        if (!isNewer) return; // first load handled above

        if (autoScroll) {
            // rAF inside scrollToBottom handles the layout race.
            scrollToBottom("smooth");
        } else {
            setShowJump(true);
        }
    }, [messages, autoScroll]);

    // When any image or video in the last message finishes loading, if we
    // were supposed to be at the bottom, re-scroll so the user sees it.
    useEffect(() => {
        if (!autoScroll) return;
        const el = scrollRef.current;
        if (!el) return;

        const onLoad = () => {
            if (!autoScroll) return;
            const el2 = scrollRef.current;
            if (!el2) return;
            // Only re-scroll if we're still near the bottom.
            const nearBottom =
                el2.scrollHeight - el2.scrollTop - el2.clientHeight < 200;
            if (nearBottom) el2.scrollTop = el2.scrollHeight;
        };

        const imgs = el.querySelectorAll<HTMLImageElement>("img");
        const vids = el.querySelectorAll<HTMLVideoElement>("video");
        imgs.forEach((i) => {
            if (!i.complete) i.addEventListener("load", onLoad, { once: true });
        });
        vids.forEach((v) => {
            if (v.readyState < 2) {
                v.addEventListener("loadeddata", onLoad, { once: true });
            }
        });

        return () => {
            imgs.forEach((i) => i.removeEventListener("load", onLoad));
            vids.forEach((v) => v.removeEventListener("loadeddata", onLoad));
        };
    }, [messages, autoScroll]);

    // ---- composer ----------------------------------------------------------
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(
        null
    );
    const [editing, setEditing] = useState<CareTeamMessage | null>(null);
    const [replyTo, setReplyTo] = useState<CareTeamMessage | null>(null);

    // attachments
    const [pending, setPending] = useState<PendingAttachment[]>([]);
    const [attachSheetOpen, setAttachSheetOpen] = useState(false);
    const [viewer, setViewer] = useState<{ messageId: string; index: number } | null>(
        null
    );

    useEffect(() => {
        return () => {
            pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const max = 5 * 24 + 16;
        el.style.height = Math.min(el.scrollHeight, max) + "px";
    }, [draft]);

    const expired = thread
        ? new Date(thread.expires_at).getTime() < Date.now()
        : false;
    const locked = !thread || thread.is_archived || expired;

    // ---- attachment handlers ----------------------------------------------
    const addPending = (item: { file: File; kind: "image" | "video" }) => {
        setPending((prev) => {
            if (prev.length >= MAX_ATTACHMENTS_PER_MESSAGE) return prev;
            return [...prev, makePendingAttachment(item.file, item.kind)];
        });
    };

    const removePending = (id: string) => {
        setPending((prev) => {
            const found = prev.find((p) => p.id === id);
            if (found) URL.revokeObjectURL(found.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    };

    const clearPending = () => {
        setPending((prev) => {
            prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return [];
        });
    };

    // ---- send / edit / delete ---------------------------------------------
    const onSubmit = async () => {
        if (!thread || !threadId || !user) return;
        const body = draft.trim();
        const hasAttachments = pending.length > 0;
        if ((!body && !hasAttachments) || sending) return;

        setSendError(null);

        // Edit path
        if (editing) {
            if (!body) return;
            setSending(true);
            await editMessage(editing.id, body);
            setSending(false);
            setEditing(null);
            setDraft("");
            return;
        }

        // Attachments path
        if (hasAttachments) {
            setSending(true);
            const items = pending.map((p) => ({ file: p.file, kind: p.kind }));
            const replyId = replyTo?.id ?? null;
            clearPending();
            setDraft("");
            setReplyTo(null);
            await sendAttachments(items, body, myRole, replyId);
            setSending(false);
            return;
        }

        // Text path
        if (!body) return;
        setSending(true);
        const replyId = replyTo?.id ?? null;
        setDraft("");
        setReplyTo(null);
        await send(body, myRole, replyId);
        setSending(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void onSubmit();
        }
        if (e.key === "Escape" && editing) {
            setEditing(null);
            setDraft("");
        }
    };

    const openActions = (m: CareTeamMessage) => {
        if (m.failed) {
            void retry(m.id, myRole);
            return;
        }
        setActionTarget({
            id: m.id,
            body: m.body ?? "",
            canEdit: canEditOrDelete(m, user?.id),
            canDelete: canEditOrDelete(m, user?.id),
        });
    };

    const onReply = (t: MessageActionTarget) => {
        const parent = messages.find((m) => m.id === t.id) ?? null;
        if (parent) setReplyTo(parent);
        setActionTarget(null);
        textareaRef.current?.focus();
    };

    const onCopy = async (t: MessageActionTarget) => {
        if (!t.body) return;
        try {
            await navigator.clipboard.writeText(t.body);
        } catch {
            /* silent */
        }
        setActionTarget(null);
    };

    const onEdit = (t: MessageActionTarget) => {
        const target = messages.find((m) => m.id === t.id) ?? null;
        if (!target) return;
        setEditing(target);
        setDraft(target.body ?? "");
        setReplyTo(null);
        setActionTarget(null);
        textareaRef.current?.focus();
    };

    const onDelete = async (t: MessageActionTarget) => {
        setActionTarget(null);
        const ok = window.confirm(
            "Delete this message? Everyone in the thread will see it was deleted."
        );
        if (!ok) return;
        await deleteMessage(t.id);
    };

    // ---- viewer ------------------------------------------------------------
    const viewerMessage = viewer
        ? messages.find((m) => m.id === viewer.messageId) ?? null
        : null;
    const viewerAttachments: ViewerAttachment[] = (viewerMessage?.attachments ??
        []) as unknown as ViewerAttachment[];
    const viewerIndex =
        viewer && viewerAttachments.length > 0
            ? Math.min(viewer.index, viewerAttachments.length - 1)
            : 0;

    // ---- states ------------------------------------------------------------
    if (sessionLoading || threadQuery.isLoading) {
        return <ThreadSkeleton />;
    }

    if (!thread) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">Thread not found</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                    You may not have access, or the link is broken.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="mt-5 h-11 px-5 rounded-2xl bg-muted text-foreground text-sm font-bold"
                >
                    Go back
                </button>
            </div>
        );
    }

    const doctorId = thread.referral?.referring_user_id ?? "";
    const clientProfile = profiles.get(thread.client_id);
    const caregiverProfile = thread.caregiver_id
        ? profiles.get(thread.caregiver_id)
        : null;
    const doctorProfile = doctorId ? profiles.get(doctorId) : null;

    const titleText = thread.referral?.hospital?.name ?? "Care team";

    const grouped = (() => {
        const out: { day: string; items: CareTeamMessage[] }[] = [];
        for (const m of messages) {
            const day = dayLabel(m.createdAt);
            const last = out[out.length - 1];
            if (last && last.day === day) last.items.push(m);
            else out.push({ day, items: [m] });
        }
        return out;
    })();

    return (
        <div className="mx-auto w-full max-w-3xl px-2 sm:px-4 py-4 sm:py-6 animate-fade-in">
            <div
                className="
                    flex flex-col
                    rounded-2xl sm:rounded-3xl
                    bg-card border border-border
                    overflow-hidden
                    h-[calc(100dvh-140px)] sm:h-[calc(100dvh-160px)] lg:h-[calc(100dvh-180px)]
                "
            >
                {/* Header ------------------------------------------------- */}
                <header className="shrink-0 bg-card border-b border-border">
                    <div className="h-14 px-2 sm:px-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            aria-label="Back"
                            className="h-11 w-11 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setDetailsOpen(true)}
                            className="flex-1 min-w-0 text-left active:opacity-80 transition-opacity"
                        >
                            <p className="text-sm font-bold text-foreground truncate">
                                {titleText}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <AvatarStack
                                    people={[
                                        { id: thread.client_id, profile: clientProfile, fallback: "P" },
                                        doctorId
                                            ? { id: doctorId, profile: doctorProfile, fallback: "D" }
                                            : null,
                                        thread.caregiver_id
                                            ? {
                                                id: thread.caregiver_id,
                                                profile: caregiverProfile,
                                                fallback: "C",
                                            }
                                            : null,
                                    ].filter(Boolean) as {
                                        id: string;
                                        profile: ProfileLite | undefined;
                                        fallback: string;
                                    }[]}
                                />
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {expired
                                        ? "Care window ended"
                                        : `Care window · ${relativeFuture(thread.expires_at)}`}
                                </p>
                            </div>
                        </button>
                    </div>
                </header>

                {/* Messages ---------------------------------------------- */}
                <div className="relative flex-1 min-h-0">
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="absolute inset-0 overflow-y-auto px-2 sm:px-4 py-3"
                    >
                        {messagesLoading ? (
                            <BubbleSkeleton />
                        ) : messages.length === 0 ? (
                            <EmptyThread
                                clientName={clientProfile?.display_name ?? "the patient"}
                                doctorName={doctorProfile?.display_name ?? "your doctor"}
                            />
                        ) : (
                            <div className="space-y-4">
                                {grouped.map(({ day, items }) => (
                                    <div key={day} className="space-y-2">
                                        <DayDivider label={day} />
                                        {items.map((m, i) => {
                                            const mine = m.senderId === user?.id;
                                            const sender = profiles.get(m.senderId);
                                            const prev = items[i - 1];
                                            const next = items[i + 1];
                                            const prevSame =
                                                prev &&
                                                prev.senderId === m.senderId &&
                                                !prev.deletedAt &&
                                                !m.deletedAt;
                                            const nextSame =
                                                next &&
                                                next.senderId === m.senderId &&
                                                !next.deletedAt &&
                                                !m.deletedAt;
                                            const showHeader = !prevSame;
                                            const tightBelow = !!nextSame;

                                            return (
                                                <div
                                                    key={m.id}
                                                    className={cn(
                                                        tightBelow ? "mb-0.5" : "mb-2"
                                                    )}
                                                >
                                                    <MessageBubble
                                                        message={m}
                                                        mine={mine}
                                                        senderName={sender?.display_name ?? null}
                                                        senderAvatar={sender?.avatar_url ?? null}
                                                        showHeader={showHeader}
                                                        onLongPress={openActions}
                                                        onReply={(mm) => {
                                                            if (mm.deletedAt) return;
                                                            setReplyTo(mm);
                                                            textareaRef.current?.focus();
                                                        }}
                                                        onOpenAttachment={(idx) =>
                                                            setViewer({ messageId: m.id, index: idx })
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                {/* Bottom anchor — helps scroll land precisely */}
                                <div ref={bottomAnchorRef} className="h-px" />
                            </div>
                        )}
                    </div>

                    {showJump && (
                        <button
                            type="button"
                            onClick={() => {
                                scrollToBottom("smooth");
                                setShowJump(false);
                                setAutoScroll(true);
                            }}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg inline-flex items-center gap-1.5 active:opacity-90 transition-opacity"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                            </svg>
                            New messages
                        </button>
                    )}
                </div>

                {/* Composer ---------------------------------------------- */}
                <div className="shrink-0 bg-card border-t border-border pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {locked ? (
                        <div className="px-3 py-3">
                            <div className="rounded-2xl bg-muted p-3 flex items-start gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {thread.is_archived
                                        ? "This thread has been archived. Messages are read-only."
                                        : "The care window has ended. Messages are read-only."}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="px-2 sm:px-3 py-2">
                            {sendError && (
                                <div className="mb-2 rounded-xl bg-destructive/10 px-3 py-2 flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-destructive">{sendError}</p>
                                </div>
                            )}

                            {!editing && (
                                <ComposeAttachments
                                    disabled={sending}
                                    items={pending}
                                    onAdd={addPending}
                                    onRemove={removePending}
                                    onError={(msg) => {
                                        setSendError(msg);
                                        window.setTimeout(() => setSendError(null), 3500);
                                    }}
                                    max={MAX_ATTACHMENTS_PER_MESSAGE}
                                    externalSheetOpen={attachSheetOpen}
                                    onExternalSheetClose={() => setAttachSheetOpen(false)}
                                />
                            )}

                            {editing && (
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
                                        onClick={() => {
                                            setEditing(null);
                                            setDraft("");
                                        }}
                                        aria-label="Cancel edit"
                                        className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-secondary"
                                    >
                                        <X className="h-4 w-4 text-foreground" />
                                    </button>
                                </div>
                            )}

                            {!editing && replyTo && (
                                <div className="mb-2 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                                    <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold text-foreground">
                                            Replying to{" "}
                                            {replyTo.senderId === user?.id
                                                ? "yourself"
                                                : profiles.get(replyTo.senderId)?.display_name ??
                                                "them"}
                                        </p>
                                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                            {replyTo.deletedAt
                                                ? "Deleted message"
                                                : replyTo.body ?? "—"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyTo(null)}
                                        aria-label="Cancel reply"
                                        className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-secondary"
                                    >
                                        <X className="h-4 w-4 text-foreground" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onPointerDown={(e) => e.preventDefault()}
                                    onClick={() => setAttachSheetOpen(true)}
                                    disabled={!!editing || sending}
                                    aria-label="Attach"
                                    className="h-11 w-11 shrink-0 rounded-2xl bg-muted inline-flex items-center justify-center active:bg-secondary transition-colors disabled:opacity-40"
                                >
                                    <span className="text-lg">+</span>
                                </button>

                                <textarea
                                    ref={textareaRef}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    rows={1}
                                    placeholder={
                                        editing ? "Edit message…" : "Message the care team"
                                    }
                                    className="flex-1 resize-none rounded-3xl bg-muted border-0 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border min-h-[44px] max-h-[136px]"
                                />

                                <button
                                    type="button"
                                    onClick={() => void onSubmit()}
                                    disabled={
                                        (!draft.trim() && pending.length === 0) || sending
                                    }
                                    aria-label="Send"
                                    className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center active:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {detailsOpen && (
                <DetailsSheet
                    thread={thread}
                    clientProfile={clientProfile}
                    caregiverProfile={caregiverProfile}
                    doctorProfile={doctorProfile}
                    myRole={myRole}
                    onClose={() => setDetailsOpen(false)}
                />
            )}

            {actionTarget && (
                <MessageActions
                    target={actionTarget}
                    onClose={() => setActionTarget(null)}
                    onReply={onReply}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onDelete={onDelete}
                />
            )}

            <AttachmentViewer
                attachments={viewerAttachments}
                index={viewerIndex}
                onClose={() => setViewer(null)}
                onIndexChange={(i) =>
                    setViewer((prev) => (prev ? { ...prev, index: i } : prev))
                }
            />
        </div>
    );
}

// ---- day divider -----------------------------------------------------------

function DayDivider({ label }: { label: string }) {
    return (
        <div className="my-2.5 sm:my-3 flex justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    );
}

// ---- message bubble --------------------------------------------------------

function MessageBubble({
    message,
    mine,
    senderName,
    senderAvatar,
    showHeader,
    onLongPress,
    onReply,
    onOpenAttachment,
}: {
    message: CareTeamMessage;
    mine: boolean;
    senderName: string | null;
    senderAvatar: string | null;
    showHeader: boolean;
    onLongPress: (m: CareTeamMessage) => void;
    onReply: (m: CareTeamMessage) => void;
    onOpenAttachment: (index: number) => void;
}) {
    const deleted = !!message.deletedAt;

    const roleLabel =
        message.senderRole === "doctor"
            ? "Doctor"
            : message.senderRole === "caregiver"
                ? "Caregiver"
                : message.senderRole === "client"
                    ? "Patient"
                    : "Member";

    const roleIcon =
        message.senderRole === "doctor" ? (
            <Stethoscope className="w-3 h-3" />
        ) : message.senderRole === "caregiver" ? (
            <ShieldCheck className="w-3 h-3" />
        ) : (
            <Heart className="w-3 h-3" />
        );

    const longPressTimer = useRef<number | null>(null);
    const [dragX, setDragX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
    const swipeDirection = mine ? -1 : 1;

    const clearTimer = () => {
        if (longPressTimer.current !== null) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const startLongPress = () => {
        clearTimer();
        longPressTimer.current = window.setTimeout(() => {
            onLongPress(message);
        }, 450);
    };

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        setDragging(false);
        setDragX(0);
        startLongPress();
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current || pointerStart.current.id !== e.pointerId) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (!dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
            clearTimer();
            pointerStart.current = null;
            return;
        }
        const directed = swipeDirection > 0 ? Math.max(0, dx) : Math.min(0, dx);
        if (Math.abs(directed) > 6) {
            clearTimer();
            setDragging(true);
            const clamped =
                Math.abs(directed) <= SWIPE_MAX
                    ? directed
                    : swipeDirection *
                    (SWIPE_MAX + (Math.abs(directed) - SWIPE_MAX) * 0.2);
            setDragX(clamped);
            e.currentTarget.setPointerCapture?.(e.pointerId);
        }
    };

    const endSwipe = (e: ReactPointerEvent<HTMLDivElement>) => {
        clearTimer();
        const committed = Math.abs(dragX) >= SWIPE_THRESHOLD;
        pointerStart.current = null;
        setDragging(false);
        setDragX(0);
        if (committed && !deleted) {
            e.preventDefault();
            onReply(message);
        }
    };

    const cancelSwipe = () => {
        clearTimer();
        pointerStart.current = null;
        setDragging(false);
        setDragX(0);
    };

    const progress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
    const hasBody = !!(message.body && message.body.trim() !== "");

    if (deleted) {
        return (
            <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[78%] rounded-3xl bg-muted px-4 py-2.5">
                    <p className="text-sm italic text-muted-foreground">Message removed</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {timeShort(message.createdAt)}
                    </p>
                </div>
            </div>
        );
    }

    const bubble = (
        <div
            onContextMenu={(e) => {
                e.preventDefault();
                onLongPress(message);
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endSwipe}
            onPointerCancel={cancelSwipe}
            style={{
                transform: `translateX(${dragX}px)`,
                transition: dragging ? "none" : "transform 180ms ease-out",
                touchAction: "pan-y",
            }}
            className={cn(
                "relative z-10 max-w-[78%] cursor-pointer select-none rounded-3xl px-4 py-2.5",
                mine
                    ? "bg-primary text-primary-foreground rounded-br-lg"
                    : "bg-muted text-foreground rounded-bl-lg",
                message.failed && "ring-1 ring-destructive/40 bg-destructive/10"
            )}
        >
            {message.replyToPreview && (
                <div
                    className={cn(
                        "mb-1 rounded-2xl px-2 py-1 text-[11px]",
                        mine
                            ? "bg-primary-foreground/10 text-primary-foreground/90"
                            : "bg-background/40 text-foreground"
                    )}
                >
                    <p className="font-bold">
                        {message.replyToPreview.senderId === message.senderId
                            ? "You"
                            : senderName ?? "Member"}
                    </p>
                    <p className="line-clamp-2 opacity-90">
                        {message.replyToPreview.body ?? "—"}
                    </p>
                </div>
            )}

            {message.attachments.length > 0 && (
                <div className={hasBody ? "mb-2" : ""}>
                    <AttachmentBubble
                        attachments={message.attachments as unknown as BubbleAttachment[]}
                        onOpenIndex={(i) => onOpenAttachment(i)}
                    />
                </div>
            )}

            {hasBody && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.body}
                </p>
            )}

            <div
                className={cn(
                    "mt-1 flex items-center gap-1 text-[10px]",
                    mine ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
            >
                {message.pending && (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending…</span>
                    </>
                )}
                {message.failed && (
                    <span className="text-destructive font-bold">Not sent</span>
                )}
                {message.editedAt && !message.pending && !message.failed && (
                    <span className="italic">edited</span>
                )}
                {!message.pending && !message.failed && (
                    <span>{timeShort(message.createdAt)}</span>
                )}
            </div>
        </div>
    );

    if (mine) {
        return (
            <div className="relative flex w-full justify-end">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-muted-foreground"
                    style={{
                        opacity: progress,
                        transform: `scale(${0.7 + progress * 0.3})`,
                    }}
                >
                    <Reply className="h-5 w-5" />
                </div>
                {bubble}
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2">
            <div className="w-7 shrink-0">
                {showHeader && (
                    <InitialsAvatar
                        url={senderAvatar}
                        name={senderName ?? roleLabel}
                        size="xs"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                {showHeader && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <span className="text-[11px] font-bold text-foreground truncate">
                            {senderName ?? roleLabel}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            {roleIcon}
                            {roleLabel}
                        </span>
                    </div>
                )}
                <div className="relative flex w-full justify-start">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center justify-center text-muted-foreground"
                        style={{
                            opacity: progress,
                            transform: `scale(${0.7 + progress * 0.3})`,
                        }}
                    >
                        <Reply className="h-5 w-5" />
                    </div>
                    {bubble}
                </div>
            </div>
        </div>
    );
}

// ---- message actions sheet -------------------------------------------------

function MessageActions({
    target,
    onClose,
    onReply,
    onEdit,
    onCopy,
    onDelete,
}: {
    target: MessageActionTarget;
    onClose: () => void;
    onReply: (t: MessageActionTarget) => void;
    onEdit: (t: MessageActionTarget) => void;
    onCopy: (t: MessageActionTarget) => void;
    onDelete: (t: MessageActionTarget) => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-foreground/40 flex items-end justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-t-3xl bg-card px-3 pb-6 pt-3 animate-slide-up"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-3 flex justify-center">
                    <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                </div>
                <ul className="space-y-1">
                    <li>
                        <button
                            type="button"
                            onClick={() => onReply(target)}
                            className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm text-foreground transition-colors active:bg-muted"
                        >
                            <Reply className="h-4 w-4 text-muted-foreground" />
                            Reply
                        </button>
                    </li>
                    {target.body && target.body.trim() !== "" && (
                        <li>
                            <button
                                type="button"
                                onClick={() => onCopy(target)}
                                className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm text-foreground transition-colors active:bg-muted"
                            >
                                <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
                                Copy
                            </button>
                        </li>
                    )}
                    {target.canEdit && (
                        <li>
                            <button
                                type="button"
                                onClick={() => onEdit(target)}
                                className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm text-foreground transition-colors active:bg-muted"
                            >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                Edit
                            </button>
                        </li>
                    )}
                    {target.canDelete && (
                        <li>
                            <button
                                type="button"
                                onClick={() => onDelete(target)}
                                className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm text-destructive transition-colors active:bg-muted"
                            >
                                <X className="h-4 w-4" />
                                Delete
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </div>,
        document.body
    );
}

// ---- avatar stack ----------------------------------------------------------

function AvatarStack({
    people,
}: {
    people: { id: string; profile: ProfileLite | undefined; fallback: string }[];
}) {
    const shown = people.slice(0, 3);
    return (
        <div className="flex -space-x-1.5">
            {shown.map((p, i) => (
                <span
                    key={p.id}
                    className="h-5 w-5 rounded-full ring-2 ring-card overflow-hidden bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground"
                    style={{ zIndex: shown.length - i }}
                >
                    {p.profile?.avatar_url ? (
                        <img
                            src={p.profile.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        (p.profile?.display_name?.[0] ?? p.fallback).toUpperCase()
                    )}
                </span>
            ))}
        </div>
    );
}

// ---- details sheet ---------------------------------------------------------

function DetailsSheet({
    thread,
    clientProfile,
    caregiverProfile,
    doctorProfile,
    myRole,
    onClose,
}: {
    thread: ThreadRow;
    clientProfile: ProfileLite | undefined;
    caregiverProfile: ProfileLite | null | undefined;
    doctorProfile: ProfileLite | undefined;
    myRole: string;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!mounted) return null;

    const canSeeCaregiverNote = myRole === "doctor" || myRole === "caregiver";
    const canSeePatientNote = myRole === "client" || myRole === "doctor";
    const services = thread.referral?.services_needed ?? [];

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-2xl bg-card border border-border rounded-t-3xl sm:rounded-3xl max-h-[90dvh] sm:max-h-[85dvh] overflow-y-auto animate-slide-up sm:animate-none"
                style={{
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pt-3 pb-2 flex justify-center sm:hidden">
                    <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="px-2 sm:px-6 pb-6">
                    <div className="flex items-start gap-3 pb-4 pt-3 sm:pt-5">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                                {thread.referral?.hospital?.name ?? "Care team"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {thread.referral?.urgency === "urgent"
                                    ? "Urgent referral"
                                    : thread.referral?.urgency === "soon"
                                        ? "Within 48 hours"
                                        : "Routine referral"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        Participants
                    </p>
                    <ul className="space-y-2 mb-5">
                        <PersonRow
                            profile={clientProfile}
                            fallback="Patient"
                            roleLabel="Patient"
                        />
                        {doctorProfile && (
                            <PersonRow
                                profile={doctorProfile}
                                fallback="Referring doctor"
                                roleLabel="Doctor"
                            />
                        )}
                        {caregiverProfile && (
                            <PersonRow
                                profile={caregiverProfile}
                                fallback="Caregiver"
                                roleLabel="Caregiver"
                            />
                        )}
                    </ul>

                    {services.length > 0 && (
                        <>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                Services
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {services.map((s) => (
                                    <span
                                        key={s}
                                        className="px-2.5 py-1 rounded-full bg-primary/10 text-[11px] font-bold text-primary capitalize"
                                    >
                                        {s.replace(/_/g, " ")}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {canSeeCaregiverNote && thread.referral?.note_to_caregiver && (
                        <div className="mb-4">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                                Note to caregiver
                            </p>
                            <div className="rounded-2xl bg-muted p-3">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {thread.referral.note_to_caregiver}
                                </p>
                            </div>
                        </div>
                    )}

                    {canSeePatientNote && thread.referral?.note_to_patient && (
                        <div>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                                Note to patient
                            </p>
                            <div className="rounded-2xl bg-muted p-3">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {thread.referral.note_to_patient}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function PersonRow({
    profile,
    fallback,
    roleLabel,
}: {
    profile: ProfileLite | undefined;
    fallback: string;
    roleLabel: string;
}) {
    return (
        <li className="rounded-2xl bg-muted p-3 flex items-center gap-3">
            <InitialsAvatar
                url={profile?.avatar_url ?? null}
                name={profile?.display_name ?? fallback}
                size="sm"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                    {profile?.display_name ?? fallback}
                </p>
                <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
            </div>
        </li>
    );
}

// ---- states ----------------------------------------------------------------

function EmptyThread({
    clientName,
    doctorName,
}: {
    clientName: string;
    doctorName: string;
}) {
    return (
        <div className="py-16 text-center animate-fade-in max-w-md mx-auto">
            <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">Your care team is here</p>
            <p className="text-xs text-muted-foreground mt-1.5">
                {clientName}, {doctorName} and your caregiver can message privately
                here for the duration of the care window.
            </p>
        </div>
    );
}

function BubbleSkeleton() {
    return (
        <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className={"flex " + (i % 3 === 0 ? "justify-end" : "justify-start")}
                >
                    <div
                        className="h-12 rounded-3xl skeleton-shimmer"
                        style={{ width: `${40 + ((i * 7) % 40)}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

function ThreadSkeleton() {
    return (
        <div className="mx-auto w-full max-w-3xl px-2 sm:px-4 py-4 sm:py-6">
            <div className="rounded-2xl sm:rounded-3xl bg-card border border-border overflow-hidden h-[calc(100dvh-140px)] sm:h-[calc(100dvh-160px)] lg:h-[calc(100dvh-180px)] flex flex-col">
                <div className="h-14 px-2 sm:px-3 flex items-center gap-2 border-b border-border">
                    <div className="h-11 w-11 rounded-full skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 rounded skeleton-shimmer w-1/3" />
                        <div className="h-2.5 rounded skeleton-shimmer w-1/4" />
                    </div>
                </div>
                <div className="flex-1" />
                <div className="px-3 py-3 border-t border-border">
                    <div className="h-11 rounded-3xl skeleton-shimmer" />
                </div>
            </div>
        </div>
    );
}