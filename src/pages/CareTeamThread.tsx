// src/pages/CareTeamThread.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Loader2,
    Send,
    ShieldCheck,
    Stethoscope,
    Heart,
    X,
    Clock,
    AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";

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

type MessageRow = {
    id: string;
    thread_id: string;
    sender_id: string;
    sender_role: string;
    body: string;
    attachment_url: string | null;
    created_at: string;
    deleted_at: string | null;
};

// ---- fetch -----------------------------------------------------------------

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

async function fetchMessages(threadId: string): Promise<MessageRow[]> {
    const { data, error } = await supabase
        .from("care_team_messages")
        .select(
            "id, thread_id, sender_id, sender_role, body, attachment_url, created_at, deleted_at"
        )
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(500);
    if (error) throw error;
    return (data ?? []) as MessageRow[];
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

export default function CareTeamThread() {
    const { threadId } = useParams<{ threadId: string }>();
    const navigate = useNavigate();
    const { user, loading: sessionLoading } = useSession();

    const threadQuery = useQuery({
        queryKey: ["care_team_thread", threadId],
        enabled: !!threadId,
        staleTime: 30_000,
        queryFn: () => fetchThread(threadId!),
    });

    const thread = threadQuery.data ?? null;

    const messagesQuery = useQuery({
        queryKey: ["care_team_messages", threadId],
        enabled: !!threadId,
        staleTime: 15_000,
        queryFn: () => fetchMessages(threadId!),
    });

    const [messages, setMessages] = useState<MessageRow[]>([]);
    useEffect(() => {
        if (messagesQuery.data) setMessages(messagesQuery.data);
    }, [messagesQuery.data]);

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

    // ---- realtime -----------------------------------------------------------
    useEffect(() => {
        if (!threadId) return;
        const channel = supabase
            .channel(`care_team:${threadId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "care_team_messages",
                    filter: `thread_id=eq.${threadId}`,
                },
                (payload) => {
                    const row = payload.new as MessageRow;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === row.id)) return prev;
                        return [...prev, row];
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "care_team_messages",
                    filter: `thread_id=eq.${threadId}`,
                },
                (payload) => {
                    const row = payload.new as MessageRow;
                    setMessages((prev) =>
                        prev.map((m) => (m.id === row.id ? { ...m, ...row } : m))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [threadId]);

    // ---- scroll behaviour ---------------------------------------------------
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            setAutoScroll(nearBottom);
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!autoScroll) return;
        const el = scrollRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages.length, autoScroll]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [thread?.id]);

    // ---- composer -----------------------------------------------------------
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const max = 5 * 24 + 16;
        el.style.height = Math.min(el.scrollHeight, max) + "px";
    }, [draft]);

    const expired = thread ? new Date(thread.expires_at).getTime() < Date.now() : false;
    const locked = !thread || thread.is_archived || expired;

    const myRole = useMemo(() => {
        if (!thread || !user) return "participant";
        if (user.id === thread.client_id) return "client";
        if (user.id === thread.caregiver_id) return "caregiver";
        if (user.id === thread.referral?.referring_user_id) return "doctor";
        return "participant";
    }, [thread, user]);

    const send = async () => {
        if (!user || !thread || !threadId) return;
        const body = draft.trim();
        if (!body || sending) return;
        setSending(true);
        setSendError(null);

        const { data, error } = await supabase
            .from("care_team_messages")
            .insert({
                thread_id: threadId,
                sender_id: user.id,
                sender_role: myRole,
                body,
            })
            .select(
                "id, thread_id, sender_id, sender_role, body, attachment_url, created_at, deleted_at"
            )
            .single();

        setSending(false);
        if (error) {
            setSendError(error.message);
            return;
        }
        if (data) {
            setMessages((prev) => {
                if (prev.some((m) => m.id === (data as MessageRow).id)) return prev;
                return [...prev, data as MessageRow];
            });
        }
        setDraft("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send();
        }
    };

    // ---- states -------------------------------------------------------------
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
                {/* Header ----------------------------------------------------- */}
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

                {/* Messages --------------------------------------------------- */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-2 sm:px-4 py-3"
                >
                    {messagesQuery.isLoading ? (
                        <BubbleSkeleton />
                    ) : messages.length === 0 ? (
                        <EmptyThread
                            clientName={clientProfile?.display_name ?? "the patient"}
                            doctorName={doctorProfile?.display_name ?? "your doctor"}
                        />
                    ) : (
                        <div className="space-y-2">
                            {messages.map((m, i) => {
                                const mine = m.sender_id === user?.id;
                                const sender = profiles.get(m.sender_id);
                                const prev = messages[i - 1];
                                const sameSenderAsPrev = prev?.sender_id === m.sender_id;
                                return (
                                    <MessageBubble
                                        key={m.id}
                                        message={m}
                                        mine={mine}
                                        senderName={sender?.display_name ?? null}
                                        senderAvatar={sender?.avatar_url ?? null}
                                        senderRole={m.sender_role}
                                        showHeader={!sameSenderAsPrev}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Composer --------------------------------------------------- */}
                <div className="shrink-0 bg-card border-t border-border pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {locked ? (
                        <div className="px-3 py-3">
                            <div className="rounded-2xl bg-muted p-3 flex items-start gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                    {thread.is_archived
                                        ? "This thread has been archived. Messages are read-only."
                                        : "The care window has ended. Messages are read-only."}
                                </p>
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
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={textareaRef}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    rows={1}
                                    placeholder="Message the care team"
                                    className="flex-1 resize-none rounded-3xl bg-muted border-0 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border min-h-[44px] max-h-[136px]"
                                />
                                <button
                                    type="button"
                                    onClick={() => void send()}
                                    disabled={!draft.trim() || sending}
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
        </div>
    );
}

// ---- message bubble --------------------------------------------------------

function MessageBubble({
    message,
    mine,
    senderName,
    senderAvatar,
    senderRole,
    showHeader,
}: {
    message: MessageRow;
    mine: boolean;
    senderName: string | null;
    senderAvatar: string | null;
    senderRole: string;
    showHeader: boolean;
}) {
    const deleted = !!message.deleted_at;

    const roleLabel =
        senderRole === "doctor"
            ? "Doctor"
            : senderRole === "caregiver"
                ? "Caregiver"
                : senderRole === "client"
                    ? "Patient"
                    : "Member";

    const roleIcon =
        senderRole === "doctor" ? (
            <Stethoscope className="w-3 h-3" />
        ) : senderRole === "caregiver" ? (
            <ShieldCheck className="w-3 h-3" />
        ) : (
            <Heart className="w-3 h-3" />
        );

    if (mine) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[78%]">
                    <div className="rounded-3xl rounded-br-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {deleted ? (
                            <span className="italic opacity-60">Message removed</span>
                        ) : (
                            message.body
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-1 pr-1">
                        {timeShort(message.created_at)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2">
            {/* 28px slot — size="xs" on the avatar makes it 24px, fits cleanly */}
            <div className="w-7 shrink-0">
                {showHeader && (
                    <InitialsAvatar
                        url={senderAvatar}
                        name={senderName ?? roleLabel}
                        size="xs"
                    />
                )}
            </div>
            <div className="max-w-[78%] min-w-0">
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
                <div className="rounded-3xl rounded-bl-lg bg-muted text-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {deleted ? (
                        <span className="italic opacity-60">Message removed</span>
                    ) : (
                        message.body
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                    {timeShort(message.created_at)}
                </p>
            </div>
        </div>
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

    const canSeeCaregiverNote =
        myRole === "doctor" || myRole === "caregiver";
    const canSeePatientNote = myRole === "client" || myRole === "doctor";

    const services = thread.referral?.services_needed ?? [];

    return createPortal(
        <div
            className="
                fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm
                flex items-end sm:items-center justify-center
                animate-fade-in
            "
            onClick={onClose}
        >
            <div
                className="
                    relative w-full sm:max-w-2xl bg-card border border-border
                    rounded-t-3xl sm:rounded-3xl
                    max-h-[90dvh] sm:max-h-[85dvh] overflow-y-auto
                    animate-slide-up sm:animate-none
                "
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
            <p className="text-sm font-bold text-foreground">
                Your care team is here
            </p>
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
                    className={
                        "flex " + (i % 3 === 0 ? "justify-end" : "justify-start")
                    }
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

// ---- helpers ---------------------------------------------------------------

function timeShort(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
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