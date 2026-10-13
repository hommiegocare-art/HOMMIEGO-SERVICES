// src/hooks/useCareTeamThread.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { notifyCareTeamMessage } from "@/lib/careTeamSounds";
import {
    parseAttachment as parseLegacyAttachment,
} from "@/lib/careTeamAttachments";

// ---- types -----------------------------------------------------------------

export type AttachmentKind = "image" | "video";

export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export interface CareTeamAttachment {
    id: string;
    kind: AttachmentKind;
    url: string;
    publicId: string;
    mimeType: string | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    position: number;
}

export interface CareTeamMessage {
    id: string;
    threadId: string;
    senderId: string;
    senderRole: "doctor" | "caregiver" | "client" | "participant";
    body: string | null;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    replyToId: string | null;
    replyToPreview: {
        id: string;
        senderId: string;
        body: string | null;
    } | null;
    attachments: CareTeamAttachment[];
    pending?: boolean;
    failed?: boolean;
}

export interface PendingAttachmentInput {
    file: File;
    kind: AttachmentKind;
}

// ---- row mapping -----------------------------------------------------------

const MESSAGE_SELECT = `
  id,
  thread_id,
  sender_id,
  sender_role,
  body,
  created_at,
  edited_at,
  deleted_at,
  reply_to_id,
  attachment_url,
  care_team_attachments!care_team_attachments_message_id_fkey (
    id,
    kind,
    cloudinary_url,
    cloudinary_public_id,
    mime_type,
    bytes,
    width,
    height,
    duration_seconds,
    position
  )
`;

function rowToAttachment(a: any): CareTeamAttachment {
    return {
        id: a.id,
        kind: a.kind,
        url: a.cloudinary_url,
        publicId: a.cloudinary_public_id,
        mimeType: a.mime_type ?? null,
        bytes: a.bytes ?? null,
        width: a.width ?? null,
        height: a.height ?? null,
        durationSeconds:
            a.duration_seconds === null || a.duration_seconds === undefined
                ? null
                : Number(a.duration_seconds),
        position: typeof a.position === "number" ? a.position : 0,
    };
}

function rowToMessage(r: any): CareTeamMessage {
    const attRows: any[] = Array.isArray(r.care_team_attachments)
        ? r.care_team_attachments
        : [];
    let attachments = attRows
        .map(rowToAttachment)
        .sort((a, b) => a.position - b.position);

    // Legacy: messages sent before the care_team_attachments table existed
    // stored a single JSON blob (or a bare URL) in attachment_url. Keep
    // them readable.
    if (attachments.length === 0 && r.attachment_url) {
        const legacy = parseLegacyAttachment(r.attachment_url);
        if (legacy) {
            attachments = [
                {
                    id: `legacy-${r.id}`,
                    kind: legacy.kind === "file" ? "image" : legacy.kind,
                    url: legacy.url,
                    publicId: legacy.public_id ?? "",
                    mimeType: null,
                    bytes: legacy.bytes ?? null,
                    width: legacy.width ?? null,
                    height: legacy.height ?? null,
                    durationSeconds: null,
                    position: 0,
                },
            ];
        }
    }

    return {
        id: r.id,
        threadId: r.thread_id,
        senderId: r.sender_id,
        senderRole: (r.sender_role ?? "participant") as CareTeamMessage["senderRole"],
        body: r.body ?? null,
        createdAt: r.created_at,
        editedAt: r.edited_at ?? null,
        deletedAt: r.deleted_at ?? null,
        replyToId: r.reply_to_id ?? null,
        replyToPreview: null,
        attachments,
    };
}

function attachReplyPreviews(rows: CareTeamMessage[]): CareTeamMessage[] {
    const byId = new Map(rows.map((m) => [m.id, m]));
    return rows.map((m) => {
        if (!m.replyToId) return m;
        const parent = byId.get(m.replyToId);
        return {
            ...m,
            replyToPreview: parent
                ? {
                    id: parent.id,
                    senderId: parent.senderId,
                    body: parent.deletedAt ? null : parent.body,
                }
                : null,
        };
    });
}

interface ThreadPage {
    messages: CareTeamMessage[];
}

// ---- hook ------------------------------------------------------------------

export function useCareTeamThread(
    threadId: string | undefined,
    enabled: boolean
) {
    const { user } = useSession();
    const qc = useQueryClient();
    const [optimistic, setOptimistic] = useState<CareTeamMessage[]>([]);
    const sendingRef = useRef(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const messagesQuery = useQuery<ThreadPage>({
        queryKey: ["care_team_messages_v2", threadId],
        enabled: !!user && !!threadId && enabled,
        staleTime: 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("care_team_messages")
                .select(MESSAGE_SELECT)
                .eq("thread_id", threadId!)
                .order("created_at", { ascending: true })
                .limit(500);
            if (error) throw error;
            const rows = (data ?? []).map(rowToMessage);
            return { messages: rows };
        },
    });

    const serverMessages: CareTeamMessage[] = messagesQuery.data?.messages ?? [];

    const messages = useMemo(() => {
        const serverIds = new Set(serverMessages.map((m) => m.id));
        const stillPending = optimistic.filter((m) => !serverIds.has(m.id));
        const merged = [...serverMessages, ...stillPending].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return attachReplyPreviews(merged);
    }, [serverMessages, optimistic]);

    // ---- realtime -----------------------------------------------------------
    useEffect(() => {
        if (!threadId || !user) return;

        const channel = supabase
            .channel(`care_team_v2:${threadId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "care_team_messages",
                    filter: `thread_id=eq.${threadId}`,
                },
                async (payload) => {
                    const incoming = payload.new as any;
                    // Re-fetch with joins so attachments come along.
                    const { data } = await supabase
                        .from("care_team_messages")
                        .select(MESSAGE_SELECT)
                        .eq("id", incoming.id)
                        .single();
                    if (!data) return;
                    const joined = rowToMessage(data);

                    qc.setQueryData<ThreadPage>(
                        ["care_team_messages_v2", threadId],
                        (old) => {
                            if (!old) return old;
                            if (old.messages.some((m) => m.id === joined.id)) return old;
                            return {
                                messages: [...old.messages, joined].sort(
                                    (a, b) =>
                                        new Date(a.createdAt).getTime() -
                                        new Date(b.createdAt).getTime()
                                ),
                            };
                        }
                    );

                    // Sound only for messages from other people.
                    if (joined.senderId !== user.id) {
                        notifyCareTeamMessage(threadId, joined.senderRole);
                    }
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
                async (payload) => {
                    const incoming = payload.new as any;
                    const { data } = await supabase
                        .from("care_team_messages")
                        .select(MESSAGE_SELECT)
                        .eq("id", incoming.id)
                        .single();
                    if (!data) return;
                    const updated = rowToMessage(data);
                    qc.setQueryData<ThreadPage>(
                        ["care_team_messages_v2", threadId],
                        (old) => {
                            if (!old) return old;
                            return {
                                messages: old.messages.map((m) =>
                                    m.id === updated.id
                                        ? { ...updated, attachments: m.attachments.length > 0 ? m.attachments : updated.attachments }
                                        : m
                                ),
                            };
                        }
                    );
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            void supabase.removeChannel(channel);
        };
    }, [threadId, user?.id, qc, user]);

    // ---- send text ----------------------------------------------------------
    const send = useCallback(
        async (body: string, senderRole: string, replyToId?: string | null) => {
            if (!user || !threadId) return;
            if (sendingRef.current) return;
            const trimmed = body.trim();
            if (!trimmed) return;

            sendingRef.current = true;

            const tempId = `temp-${crypto.randomUUID()}`;
            const now = new Date().toISOString();
            const optimisticRow: CareTeamMessage = {
                id: tempId,
                threadId,
                senderId: user.id,
                senderRole: senderRole as CareTeamMessage["senderRole"],
                body: trimmed,
                createdAt: now,
                editedAt: null,
                deletedAt: null,
                replyToId: replyToId ?? null,
                replyToPreview: null,
                attachments: [],
                pending: true,
            };
            setOptimistic((prev) => [...prev, optimisticRow]);

            try {
                const { data, error } = await supabase
                    .from("care_team_messages")
                    .insert({
                        thread_id: threadId,
                        sender_id: user.id,
                        sender_role: senderRole,
                        body: trimmed,
                        reply_to_id: replyToId ?? null,
                    })
                    .select(MESSAGE_SELECT)
                    .single();

                if (error || !data) {
                    setOptimistic((prev) =>
                        prev.map((m) =>
                            m.id === tempId ? { ...m, pending: false, failed: true } : m
                        )
                    );
                    return;
                }

                setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
                const real = rowToMessage(data);
                qc.setQueryData<ThreadPage>(
                    ["care_team_messages_v2", threadId],
                    (old) => {
                        if (!old) return old;
                        if (old.messages.some((m) => m.id === real.id)) return old;
                        return {
                            messages: [...old.messages, real].sort(
                                (a, b) =>
                                    new Date(a.createdAt).getTime() -
                                    new Date(b.createdAt).getTime()
                            ),
                        };
                    }
                );
            } finally {
                sendingRef.current = false;
            }
        },
        [user, threadId, qc]
    );

    // ---- send with attachments ---------------------------------------------
    const sendAttachments = useCallback(
        async (
            items: PendingAttachmentInput[],
            caption: string,
            senderRole: string,
            replyToId?: string | null
        ) => {
            if (!user || !threadId) return;
            if (sendingRef.current) return;
            if (items.length === 0) return;
            if (items.length > MAX_ATTACHMENTS_PER_MESSAGE) return;

            sendingRef.current = true;

            const tempId = `temp-${crypto.randomUUID()}`;
            const now = new Date().toISOString();
            const localPreviews = items.map((it) =>
                URL.createObjectURL(it.file)
            );
            const optimisticAttachments: CareTeamAttachment[] = items.map(
                (it, idx) => ({
                    id: `temp-att-${crypto.randomUUID()}`,
                    kind: it.kind,
                    url: localPreviews[idx],
                    publicId: "",
                    mimeType: it.file.type || null,
                    bytes: it.file.size,
                    width: null,
                    height: null,
                    durationSeconds: null,
                    position: idx,
                })
            );
            const optimisticRow: CareTeamMessage = {
                id: tempId,
                threadId,
                senderId: user.id,
                senderRole: senderRole as CareTeamMessage["senderRole"],
                body: caption.trim() || null,
                createdAt: now,
                editedAt: null,
                deletedAt: null,
                replyToId: replyToId ?? null,
                replyToPreview: null,
                attachments: optimisticAttachments,
                pending: true,
            };
            setOptimistic((prev) => [...prev, optimisticRow]);

            const cleanup = () =>
                localPreviews.forEach((u) => URL.revokeObjectURL(u));

            try {
                // Upload all files in parallel.
                const uploads = await Promise.all(
                    items.map((it) =>
                        uploadToCloudinary(it.file, {
                            folder: `care-team/${threadId}`,
                            resourceType: it.kind === "video" ? "video" : "image",
                        })
                    )
                );

                // Insert the message row first.
                const { data: msg, error: msgErr } = await supabase
                    .from("care_team_messages")
                    .insert({
                        thread_id: threadId,
                        sender_id: user.id,
                        sender_role: senderRole,
                        body: caption.trim() || null,
                        reply_to_id: replyToId ?? null,
                    })
                    .select("id")
                    .single();
                if (msgErr || !msg) throw msgErr ?? new Error("message insert failed");

                // Then the attachment rows.
                const attRows = items.map((it, idx) => ({
                    message_id: msg.id,
                    thread_id: threadId,
                    uploader_id: user.id,
                    kind: it.kind,
                    cloudinary_public_id: uploads[idx].public_id,
                    cloudinary_url: uploads[idx].url,
                    mime_type: it.file.type || null,
                    bytes: uploads[idx].bytes ?? it.file.size,
                    width: uploads[idx].width ?? null,
                    height: uploads[idx].height ?? null,
                    duration_seconds: null,
                    position: idx,
                }));
                const { error: attErr } = await supabase
                    .from("care_team_attachments")
                    .insert(attRows);
                if (attErr) throw attErr;

                // Re-fetch with joins and replace the optimistic row.
                const { data: joined } = await supabase
                    .from("care_team_messages")
                    .select(MESSAGE_SELECT)
                    .eq("id", msg.id)
                    .single();

                cleanup();
                setOptimistic((prev) => prev.filter((m) => m.id !== tempId));

                if (joined) {
                    const real = rowToMessage(joined);
                    qc.setQueryData<ThreadPage>(
                        ["care_team_messages_v2", threadId],
                        (old) => {
                            if (!old) return old;
                            if (old.messages.some((m) => m.id === real.id)) return old;
                            return {
                                messages: [...old.messages, real].sort(
                                    (a, b) =>
                                        new Date(a.createdAt).getTime() -
                                        new Date(b.createdAt).getTime()
                                ),
                            };
                        }
                    );
                }
            } catch {
                cleanup();
                setOptimistic((prev) =>
                    prev.map((m) =>
                        m.id === tempId ? { ...m, pending: false, failed: true } : m
                    )
                );
            } finally {
                sendingRef.current = false;
            }
        },
        [user, threadId, qc]
    );

    // ---- edit ---------------------------------------------------------------
    const editMessage = useCallback(
        async (id: string, newBody: string) => {
            if (!user || !threadId) return;
            const trimmed = newBody.trim();
            if (!trimmed) return;

            const { data, error } = await supabase
                .from("care_team_messages")
                .update({ body: trimmed, edited_at: new Date().toISOString() })
                .eq("id", id)
                .select(MESSAGE_SELECT)
                .single();
            if (error || !data) return;

            const updated = rowToMessage(data);
            qc.setQueryData<ThreadPage>(
                ["care_team_messages_v2", threadId],
                (old) => {
                    if (!old) return old;
                    return {
                        messages: old.messages.map((m) =>
                            m.id === id
                                ? { ...updated, attachments: m.attachments }
                                : m
                        ),
                    };
                }
            );
        },
        [user, threadId, qc]
    );

    // ---- delete (soft) ------------------------------------------------------
    const deleteMessage = useCallback(
        async (id: string) => {
            if (!user || !threadId) return;
            const nowIso = new Date().toISOString();
            const { data, error } = await supabase
                .from("care_team_messages")
                .update({ deleted_at: nowIso })
                .eq("id", id)
                .select(MESSAGE_SELECT)
                .single();
            if (error || !data) return;

            const updated = rowToMessage(data);
            qc.setQueryData<ThreadPage>(
                ["care_team_messages_v2", threadId],
                (old) => {
                    if (!old) return old;
                    return {
                        messages: old.messages.map((m) =>
                            m.id === id
                                ? { ...updated, attachments: m.attachments }
                                : m
                        ),
                    };
                }
            );
        },
        [user, threadId, qc]
    );

    // ---- discard / retry ----------------------------------------------------
    const discard = useCallback((tempId: string) => {
        setOptimistic((prev) => {
            const row = prev.find((m) => m.id === tempId);
            row?.attachments.forEach((a) => {
                if (a.url.startsWith("blob:")) URL.revokeObjectURL(a.url);
            });
            return prev.filter((m) => m.id !== tempId);
        });
    }, []);

    const retry = useCallback(
        async (tempId: string, senderRole: string) => {
            const failed = optimistic.find((m) => m.id === tempId);
            if (!failed || !failed.failed) return;
            if (failed.attachments.length > 0) return; // can't retry attachments
            const body = failed.body ?? "";
            const replyId = failed.replyToId ?? null;
            setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
            await send(body, senderRole, replyId);
        },
        [optimistic, send]
    );

    return {
        messages,
        messagesLoading: messagesQuery.isLoading,
        send,
        sendAttachments,
        editMessage,
        deleteMessage,
        discard,
        retry,
        refetch: messagesQuery.refetch,
    };
}