// src/hooks/useChatList.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export interface ChatListItem {
    connectionId: string;
    otherUserId: string;
    otherDisplayName: string | null;
    otherAvatarUrl: string | null;
    otherRole: "client" | "caregiver" | "admin";
    connectionStatus: "pending" | "accepted" | "declined" | "ended" | "blocked";
    defaultTtlSeconds: number | null;
    disappearingEnabled: boolean;
    lastMessageId: string | null;
    lastMessageBody: string | null;
    lastMessageAt: string | null;
    lastMessageSender: string | null;
    unreadCount: number;
}

const LIMIT = 50;

export function useChatList() {
    const { user } = useSession();

    return useQuery<ChatListItem[]>({
        queryKey: ["chat-list", user?.id ?? "anon"],
        enabled: !!user,
        staleTime: 15_000,
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_chat_list", {
                p_limit: LIMIT,
            });

            if (error) throw error;

            return (data ?? []).map((r: any): ChatListItem => ({
                connectionId: r.connection_id,
                otherUserId: r.other_user_id,
                otherDisplayName: r.other_display_name,
                otherAvatarUrl: r.other_avatar_url,
                otherRole: r.other_role,
                connectionStatus: r.connection_status,
                defaultTtlSeconds: r.default_ttl_seconds,
                disappearingEnabled: r.disappearing_enabled,
                lastMessageId: r.last_message_id,
                lastMessageBody: r.last_message_body,
                lastMessageAt: r.last_message_at,
                lastMessageSender: r.last_message_sender,
                unreadCount: Number(r.unread_count ?? 0),
            }));
        },
    });
}

export function totalUnread(items: ChatListItem[] | undefined): number {
    if (!items) return 0;
    return items.reduce((sum, it) => sum + (it.unreadCount ?? 0), 0);
}