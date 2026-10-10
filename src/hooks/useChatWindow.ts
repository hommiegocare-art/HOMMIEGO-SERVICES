// src/hooks/useChatWindow.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { uploadToCloudinary } from "@/lib/cloudinary";

export type TtlOption =
    | 300
    | 1800
    | 3600
    | 21600
    | 86400
    | 604800
    | -1;

export type AttachmentKind = "image" | "video";

export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export interface ChatAttachment {
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

export interface ChatMessage {
    id: string;
    connectionId: string;
    senderId: string;
    body: string | null;
    createdAt: string;
    deliveredAt: string | null;
    readAt: string | null;
    expiresAt: string;
    tombstoned: boolean;
    editedAt: string | null;
    deletedAt: string | null;
    replyToId: string | null;
    replyToPreview: {
        id: string;
        senderId: string;
        body: string | null;
    } | null;
    attachments: ChatAttachment[];
    pending?: boolean;
    failed?: boolean;
}

export interface ChatWindowMeta {
    connectionId: string;
    otherUserId: string;
    otherDisplayName: string | null;
    otherAvatarUrl: string | null;
    otherRole: "client" | "caregiver" | "admin";
    otherLastSeenAt: string | null;
    connectionStatus: "pending" | "accepted" | "declined" | "ended" | "blocked";
    defaultTtlSeconds: number | null;
    disappearingEnabled: boolean;
}

const PAGE_SIZE = 50;
const UNTIL_READ_TTL = 300;

const MESSAGE_SELECT = `
  id,
  connection_id,
  sender_id,
  body,
  created_at,
  delivered_at,
  read_at,
  expires_at,
  tombstoned,
  edited_at,
  deleted_at,
  reply_to_id,
  chat_attachments!chat_attachments_message_id_fkey (
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

function rowToAttachment(a: any): ChatAttachment {
    return {
        id: a.id,
        kind: a.kind,
        url: a.cloudinary_url,
        publicId: a.cloudinary_public_id,
        mimeType: a.mime_type ?? null,
        bytes: a.bytes ?? null,
        width: a.width ?? null,
        height: a.height ?? null,
        durationSeconds: a.duration_seconds ?? null,
        position: typeof a.position === "number" ? a.position : 0,
    };
}

function rowToMessage(r: any): ChatMessage {
    const attRows: any[] = Array.isArray(r.chat_attachments) ? r.chat_attachments : [];
    const attachments = attRows
        .map(rowToAttachment)
        .sort((a, b) => a.position - b.position);
    return {
        id: r.id,
        connectionId: r.connection_id,
        senderId: r.sender_id,
        body: r.body,
        createdAt: r.created_at,
        deliveredAt: r.delivered_at,
        readAt: r.read_at,
        expiresAt: r.expires_at,
        tombstoned: r.tombstoned,
        editedAt: r.edited_at ?? null,
        deletedAt: r.deleted_at ?? null,
        replyToId: r.reply_to_id ?? null,
        replyToPreview: null,
        attachments,
    };
}

function attachReplyPreviews(rows: ChatMessage[]): ChatMessage[] {
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
                    body: parent.tombstoned ? null : parent.body,
                }
                : null,
        };
    });
}

function resolveTtlSeconds(
    perMessage: TtlOption | null,
    connectionDefault: number | null,
): number {
    if (perMessage === -1) return UNTIL_READ_TTL;
    if (typeof perMessage === "number" && perMessage > 0) return perMessage;
    if (typeof connectionDefault === "number" && connectionDefault > 0) {
        return connectionDefault;
    }
    return 86400;
}

export interface PendingAttachmentInput {
    file: File;
    kind: AttachmentKind;
}

/**
 * The messages query caches ALL loaded pages in a single array.
 * A separate "meta" query tracks whether more pages exist older than
 * the currently loaded window. This is the classic cursor-pagination
 * shape without pulling in @tanstack/react-query's infinite queries,
 * because we want a custom scroll-anchor when prepending.
 */
interface MessagesPage {
    messages: ChatMessage[];
    hasMoreOlder: boolean;
}

export function useChatWindow(
    connectionId: string | undefined,
    enabled: boolean,
) {
    const { user } = useSession();
    const qc = useQueryClient();
    const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const sendingRef = useRef(false);

    const metaQuery = useQuery<ChatWindowMeta | null>({
        queryKey: ["chat-meta", connectionId],
        enabled: !!user && !!connectionId,
        staleTime: 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("connections")
                .select(
                    `
          id,
          client_id,
          caregiver_id,
          status,
          chat_connection_settings ( default_ttl_seconds, disappearing_enabled )
        `,
                )
                .eq("id", connectionId!)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            const otherId =
                data.client_id === user!.id ? data.caregiver_id : data.client_id;

            const { data: profile, error: pErr } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url, role, last_seen_at")
                .eq("id", otherId)
                .maybeSingle();

            if (pErr) throw pErr;

            const settings = (data as any).chat_connection_settings?.[0] ?? null;

            return {
                connectionId: data.id,
                otherUserId: otherId,
                otherDisplayName: profile?.display_name ?? null,
                otherAvatarUrl: profile?.avatar_url ?? null,
                otherRole: (profile?.role ?? "client") as
                    | "client"
                    | "caregiver"
                    | "admin",
                otherLastSeenAt: profile?.last_seen_at ?? null,
                connectionStatus: data.status,
                defaultTtlSeconds: settings?.default_ttl_seconds ?? null,
                disappearingEnabled: settings?.disappearing_enabled ?? true,
            };
        },
    });

    // Initial page: newest PAGE_SIZE, sorted ascending in the returned array.
    const messagesQuery = useQuery<MessagesPage>({
        queryKey: ["chat-messages", connectionId],
        enabled: !!user && !!connectionId,
        // Chat is live — always refetch on mount, but keep cache warm during
        // a session. Realtime keeps the newest messages fresh on top of this.
        staleTime: 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("chat_messages")
                .select(MESSAGE_SELECT)
                .eq("connection_id", connectionId!)
                .eq("tombstoned", false)
                .gt("expires_at", new Date().toISOString())
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE);

            if (error) throw error;
            const rows = (data ?? []).map(rowToMessage);
            // Reverse for ascending display order.
            rows.reverse();
            return {
                messages: rows,
                hasMoreOlder: rows.length === PAGE_SIZE,
            };
        },
    });

    const serverMessages: ChatMessage[] = messagesQuery.data?.messages ?? [];
    const hasMoreOlder = messagesQuery.data?.hasMoreOlder ?? false;

    /**
     * Fetch the previous PAGE_SIZE messages older than the given cursor.
     * Prepends to the cached page array. Cursor is the oldest currently
     * loaded message's createdAt.
     */
    const loadOlder = useCallback(async () => {
        if (!connectionId) return;
        if (loadingOlder) return;
        if (!hasMoreOlder) return;

        const current = qc.getQueryData<MessagesPage>(["chat-messages", connectionId]);
        if (!current || current.messages.length === 0) return;

        const oldest = current.messages[0];
        setLoadingOlder(true);

        try {
            const { data, error } = await supabase
                .from("chat_messages")
                .select(MESSAGE_SELECT)
                .eq("connection_id", connectionId)
                .eq("tombstoned", false)
                .gt("expires_at", new Date().toISOString())
                .lt("created_at", oldest.createdAt)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE);

            if (error) throw error;

            const older = (data ?? []).map(rowToMessage);
            older.reverse();

            qc.setQueryData<MessagesPage>(
                ["chat-messages", connectionId],
                (prev) => {
                    if (!prev) return prev;
                    const existingIds = new Set(prev.messages.map((m) => m.id));
                    const deduped = older.filter((m) => !existingIds.has(m.id));
                    return {
                        messages: [...deduped, ...prev.messages],
                        hasMoreOlder: older.length === PAGE_SIZE,
                    };
                },
            );
        } catch {
            // Silent. The user can retry by scrolling again.
        } finally {
            setLoadingOlder(false);
        }
    }, [connectionId, hasMoreOlder, loadingOlder, qc]);

    const messages = useMemo(() => {
        const serverIds = new Set(serverMessages.map((m) => m.id));
        const stillPending = optimistic.filter((m) => !serverIds.has(m.id));
        const merged = [...serverMessages, ...stillPending].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        return attachReplyPreviews(merged);
    }, [serverMessages, optimistic]);

    const markDelivered = useCallback(
        async (ids: string[]) => {
            if (!user || ids.length === 0) return;
            const { error } = await supabase
                .from("chat_messages")
                .update({ delivered_at: new Date().toISOString() })
                .in("id", ids)
                .is("delivered_at", null)
                .neq("sender_id", user.id);
            if (error) return;
            qc.invalidateQueries({ queryKey: ["chat-list"] });
        },
        [user, qc],
    );

    const markRead = useCallback(
        async (ids: string[]) => {
            if (!user || ids.length === 0) return;
            const nowIso = new Date().toISOString();
            const { error } = await supabase
                .from("chat_messages")
                .update({ read_at: nowIso, delivered_at: nowIso })
                .in("id", ids)
                .is("read_at", null)
                .neq("sender_id", user.id);
            if (error) return;
            qc.invalidateQueries({ queryKey: ["chat-list"] });
        },
        [user, qc],
    );

    const send = useCallback(
        async (body: string, ttl: TtlOption | null, replyToId?: string | null) => {
            if (!user || !connectionId) return;
            if (sendingRef.current) return;

            if (
                metaQuery.data &&
                (metaQuery.data.connectionStatus === "blocked" ||
                    metaQuery.data.connectionStatus === "ended" ||
                    metaQuery.data.connectionStatus === "declined")
            ) {
                return;
            }
            const trimmed = body.trim();
            if (!trimmed) return;

            sendingRef.current = true;

            const { data: sessionData } = await supabase.auth.getSession();
            const sessionExpiresAt = sessionData.session?.expires_at ?? 0;
            if (sessionExpiresAt - Date.now() / 1000 < 60) {
                await supabase.auth.refreshSession();
            }

            const ttlSeconds = resolveTtlSeconds(
                ttl,
                metaQuery.data?.defaultTtlSeconds ?? null,
            );
            const now = new Date();
            const messageExpiresAt = new Date(
                now.getTime() + ttlSeconds * 1000,
            ).toISOString();

            const parent = replyToId
                ? serverMessages.find((m) => m.id === replyToId) ?? null
                : null;
            const optimisticReplyPreview = parent
                ? { id: parent.id, senderId: parent.senderId, body: parent.body }
                : null;

            const tempId = `temp-${crypto.randomUUID()}`;
            const optimisticRow: ChatMessage = {
                id: tempId,
                connectionId,
                senderId: user.id,
                body: trimmed,
                createdAt: now.toISOString(),
                deliveredAt: null,
                readAt: null,
                expiresAt: messageExpiresAt,
                tombstoned: false,
                editedAt: null,
                deletedAt: null,
                replyToId: replyToId ?? null,
                replyToPreview: optimisticReplyPreview,
                attachments: [],
                pending: true,
            };
            setOptimistic((prev) => [...prev, optimisticRow]);

            try {
                const { data, error } = await supabase
                    .from("chat_messages")
                    .insert({
                        connection_id: connectionId,
                        sender_id: user.id,
                        body: trimmed,
                        ttl_seconds: ttlSeconds,
                        expires_at: messageExpiresAt,
                        reply_to_id: replyToId ?? null,
                    })
                    .select(MESSAGE_SELECT)
                    .single();

                if (error || !data) {
                    setOptimistic((prev) =>
                        prev.map((m) =>
                            m.id === tempId ? { ...m, pending: false, failed: true } : m,
                        ),
                    );
                    return;
                }

                setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
                qc.setQueryData<MessagesPage>(
                    ["chat-messages", connectionId],
                    (old) => {
                        if (!old) return old;
                        const real = rowToMessage(data);
                        if (old.messages.some((m) => m.id === real.id)) return old;
                        return {
                            ...old,
                            messages: [...old.messages, real].sort(
                                (a, b) =>
                                    new Date(a.createdAt).getTime() -
                                    new Date(b.createdAt).getTime(),
                            ),
                        };
                    },
                );
                qc.invalidateQueries({ queryKey: ["chat-list"] });
            } finally {
                sendingRef.current = false;
            }
        },
        [user, connectionId, metaQuery.data?.defaultTtlSeconds, qc, serverMessages],
    );

    const sendAttachments = useCallback(
        async (
            items: PendingAttachmentInput[],
            caption: string,
            ttl: TtlOption | null,
            replyToId?: string | null,
        ) => {
            if (!user || !connectionId) return;
            if (sendingRef.current) return;
            if (items.length === 0) return;
            if (items.length > MAX_ATTACHMENTS_PER_MESSAGE) return;

            if (
                metaQuery.data &&
                (metaQuery.data.connectionStatus === "blocked" ||
                    metaQuery.data.connectionStatus === "ended" ||
                    metaQuery.data.connectionStatus === "declined")
            ) {
                return;
            }

            sendingRef.current = true;

            const { data: sessionData } = await supabase.auth.getSession();
            const sessionExpiresAt = sessionData.session?.expires_at ?? 0;
            if (sessionExpiresAt - Date.now() / 1000 < 60) {
                await supabase.auth.refreshSession();
            }

            const ttlSeconds = resolveTtlSeconds(
                ttl,
                metaQuery.data?.defaultTtlSeconds ?? null,
            );
            const now = new Date();
            const messageExpiresAt = new Date(
                now.getTime() + ttlSeconds * 1000,
            ).toISOString();

            const parent = replyToId
                ? serverMessages.find((m) => m.id === replyToId) ?? null
                : null;
            const optimisticReplyPreview = parent
                ? { id: parent.id, senderId: parent.senderId, body: parent.body }
                : null;

            const localPreviews = items.map((it) => URL.createObjectURL(it.file));
            const optimisticAttachments: ChatAttachment[] = items.map((it, idx) => ({
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
            }));

            const tempId = `temp-${crypto.randomUUID()}`;
            const optimisticRow: ChatMessage = {
                id: tempId,
                connectionId,
                senderId: user.id,
                body: caption.trim() || null,
                createdAt: now.toISOString(),
                deliveredAt: null,
                readAt: null,
                expiresAt: messageExpiresAt,
                tombstoned: false,
                editedAt: null,
                deletedAt: null,
                replyToId: replyToId ?? null,
                replyToPreview: optimisticReplyPreview,
                attachments: optimisticAttachments,
                pending: true,
            };
            setOptimistic((prev) => [...prev, optimisticRow]);

            const cleanupLocalPreviews = () => {
                localPreviews.forEach((u) => URL.revokeObjectURL(u));
            };

            try {
                const uploads = await Promise.all(
                    items.map((it) =>
                        uploadToCloudinary(it.file, {
                            folder: `chat/${connectionId}`,
                            resourceType: it.kind === "video" ? "video" : "image",
                        }),
                    ),
                );

                const { data: msgData, error: msgErr } = await supabase
                    .from("chat_messages")
                    .insert({
                        connection_id: connectionId,
                        sender_id: user.id,
                        body: caption.trim() || null,
                        ttl_seconds: ttlSeconds,
                        expires_at: messageExpiresAt,
                        reply_to_id: replyToId ?? null,
                    })
                    .select("id")
                    .single();

                if (msgErr || !msgData) {
                    throw msgErr ?? new Error("message insert failed");
                }

                const attRows = items.map((it, idx) => ({
                    message_id: msgData.id,
                    connection_id: connectionId,
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
                    .from("chat_attachments")
                    .insert(attRows);

                if (attErr) throw attErr;

                const { data: joined } = await supabase
                    .from("chat_messages")
                    .select(MESSAGE_SELECT)
                    .eq("id", msgData.id)
                    .single();

                cleanupLocalPreviews();
                setOptimistic((prev) => prev.filter((m) => m.id !== tempId));

                if (joined) {
                    qc.setQueryData<MessagesPage>(
                        ["chat-messages", connectionId],
                        (old) => {
                            if (!old) return old;
                            const real = rowToMessage(joined);
                            if (old.messages.some((m) => m.id === real.id)) return old;
                            return {
                                ...old,
                                messages: [...old.messages, real].sort(
                                    (a, b) =>
                                        new Date(a.createdAt).getTime() -
                                        new Date(b.createdAt).getTime(),
                                ),
                            };
                        },
                    );
                }
                qc.invalidateQueries({ queryKey: ["chat-list"] });
            } catch {
                cleanupLocalPreviews();
                setOptimistic((prev) =>
                    prev.map((m) =>
                        m.id === tempId ? { ...m, pending: false, failed: true } : m,
                    ),
                );
            } finally {
                sendingRef.current = false;
            }
        },
        [user, connectionId, metaQuery.data?.defaultTtlSeconds, qc, serverMessages],
    );

    const editMessage = useCallback(
        async (id: string, newBody: string) => {
            if (!user) return;
            const trimmed = newBody.trim();
            if (!trimmed) return;

            const prev = qc.getQueryData<MessagesPage>(["chat-messages", connectionId]);
            if (prev) {
                qc.setQueryData<MessagesPage>(
                    ["chat-messages", connectionId],
                    {
                        ...prev,
                        messages: prev.messages.map((m) =>
                            m.id === id
                                ? {
                                    ...m,
                                    body: trimmed,
                                    editedAt: new Date().toISOString(),
                                }
                                : m,
                        ),
                    },
                );
            }

            const { data, error } = await supabase
                .from("chat_messages")
                .update({
                    body: trimmed,
                    edited_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select(MESSAGE_SELECT)
                .single();

            if (error || !data) {
                qc.invalidateQueries({ queryKey: ["chat-messages", connectionId] });
                return;
            }
            qc.setQueryData<MessagesPage>(
                ["chat-messages", connectionId],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: old.messages.map((m) =>
                            m.id === id ? rowToMessage(data) : m,
                        ),
                    };
                },
            );
            qc.invalidateQueries({ queryKey: ["chat-list"] });
        },
        [user, connectionId, qc],
    );

    const deleteMessage = useCallback(
        async (id: string) => {
            if (!user) return;
            const nowIso = new Date().toISOString();

            const prev = qc.getQueryData<MessagesPage>(["chat-messages", connectionId]);
            if (prev) {
                qc.setQueryData<MessagesPage>(
                    ["chat-messages", connectionId],
                    {
                        ...prev,
                        messages: prev.messages.map((m) =>
                            m.id === id
                                ? {
                                    ...m,
                                    body: null,
                                    tombstoned: true,
                                    deletedAt: nowIso,
                                }
                                : m,
                        ),
                    },
                );
            }

            const { data, error } = await supabase
                .from("chat_messages")
                .update({
                    body: null,
                    tombstoned: true,
                    deleted_at: nowIso,
                })
                .eq("id", id)
                .select(MESSAGE_SELECT)
                .single();

            if (error || !data) {
                qc.invalidateQueries({ queryKey: ["chat-messages", connectionId] });
                return;
            }
            qc.setQueryData<MessagesPage>(
                ["chat-messages", connectionId],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: old.messages.map((m) =>
                            m.id === id ? rowToMessage(data) : m,
                        ),
                    };
                },
            );
            qc.invalidateQueries({ queryKey: ["chat-list"] });
        },
        [user, connectionId, qc],
    );

    const updateSettings = useCallback(
        async (patch: {
            default_ttl_seconds?: number | null;
            disappearing_enabled?: boolean;
        }) => {
            if (!user || !connectionId) return;
            const { error } = await supabase
                .from("chat_connection_settings")
                .upsert(
                    {
                        connection_id: connectionId,
                        updated_by: user.id,
                        updated_at: new Date().toISOString(),
                        ...patch,
                    },
                    { onConflict: "connection_id" },
                );
            if (error) return;
            qc.invalidateQueries({ queryKey: ["chat-meta", connectionId] });
            qc.invalidateQueries({ queryKey: ["chat-list"] });
        },
        [user, connectionId, qc],
    );

    useEffect(() => {
        if (!connectionId || !user) return;

        const channel = supabase
            .channel(`chat:${connectionId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `connection_id=eq.${connectionId}`,
                },
                (payload) => {
                    const raw = payload.new as any;
                    const incoming = rowToMessage(raw);

                    qc.setQueryData<MessagesPage>(
                        ["chat-messages", connectionId],
                        (old) => {
                            if (!old) return old;
                            if (old.messages.some((m) => m.id === incoming.id)) return old;
                            return {
                                ...old,
                                messages: [...old.messages, incoming].sort(
                                    (a, b) =>
                                        new Date(a.createdAt).getTime() -
                                        new Date(b.createdAt).getTime(),
                                ),
                            };
                        },
                    );

                    void supabase
                        .from("chat_messages")
                        .select(MESSAGE_SELECT)
                        .eq("id", incoming.id)
                        .single()
                        .then(({ data }) => {
                            if (!data) return;
                            const joined = rowToMessage(data);
                            qc.setQueryData<MessagesPage>(
                                ["chat-messages", connectionId],
                                (old) => {
                                    if (!old) return old;
                                    return {
                                        ...old,
                                        messages: old.messages.map((m) =>
                                            m.id === joined.id ? joined : m,
                                        ),
                                    };
                                },
                            );
                        });

                    qc.invalidateQueries({ queryKey: ["chat-list"] });
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "chat_messages",
                    filter: `connection_id=eq.${connectionId}`,
                },
                (payload) => {
                    const updated = rowToMessage(payload.new);
                    qc.setQueryData<MessagesPage>(
                        ["chat-messages", connectionId],
                        (old) => {
                            if (!old) return old;
                            return {
                                ...old,
                                messages: old.messages.map((m) => {
                                    if (m.id !== updated.id) return m;
                                    return { ...updated, attachments: m.attachments };
                                }),
                            };
                        },
                    );
                    qc.invalidateQueries({ queryKey: ["chat-list"] });
                },
            )
            .subscribe((status) => {
                // eslint-disable-next-line no-console
                console.log("[chat realtime] status", status, "conn", connectionId);
            });

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            void supabase.removeChannel(channel);
        };
    }, [connectionId, user?.id, qc]);

    useEffect(() => {
        if (!replyTo) return;
        const stillExists = messages.some((m) => m.id === replyTo.id);
        if (!stillExists) setReplyTo(null);
    }, [messages, replyTo]);

    return {
        meta: metaQuery.data ?? null,
        metaLoading: metaQuery.isLoading,
        messages,
        messagesLoading: messagesQuery.isLoading,
        messagesError: messagesQuery.error as Error | null,
        refetchMessages: messagesQuery.refetch,
        hasMoreOlder,
        loadingOlder,
        loadOlder,
        send,
        sendAttachments,
        editMessage,
        deleteMessage,
        markDelivered,
        markRead,
        updateSettings,
        replyTo,
        setReplyTo,
        clearReplyTo: () => setReplyTo(null),
    };
}